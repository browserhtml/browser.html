/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record} = require('typed-immutable');
  const {html, thunk:render, forward} = require('reflex');
  const WebView = require('./web-view');
  const Page = require('./web-page');
  const Card = require('./web-card');
  const Focusable = require('../common/focusable');
  const {Style, StyleSheet} = require('../common/style');
  const {getDomainName} = require('../common/url-helper');
  const Favicon = require('../common/favicon');
  const Selector = require('../common/selector');
  const Theme = require('./theme');
  const {onAnimationFrame, on} = require('driver');


  // Action
  const Create = Record({
    description: 'Create a new web view'
  }, 'Preview.Create');
  exports.Create = Create;

  const Action = Create;
  exports.Action = Action;

  // View

  const Close = event => {
    if (event.button === 1) {
      event.stopPropagation();
      return WebView.Close();
    }
    return WebView.None();
  }

  const styleControls = StyleSheet.create({
    panel: {
      position: 'absolute',
      right: '6px',
      top: '6px'
    },
    button: {
      color: 'inherit',
      lineHeight: '16px',
      fontFamily: 'FontAwesome',
      textAlign: 'center',
      fontSize: '16px',
      verticalAlign: 'middle',
      cursor: 'default'
    }
  });

  const DashboardIcon = '\uf067';

  const viewControls = (theme, address) => html.div({
    style: styleControls.panel,
    className: 'web-preview-controls'
  }, [
    html.button({
      key: 'dashboard-button',
      className: 'web-preview-dashboard-button',
      style: styleControls.button,
      onClick: forward(address, Create)
    }, [DashboardIcon])
  ]);
  exports.viewControls = viewControls;

  const stylePreview = StyleSheet.create({
    card: {
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
      color: '#444',
      height: '300px',
      margin: '0 10px',
      overflow: 'hidden',
      position: 'relative',
      width: '240px',
      textAlign: 'left',
      marginTop: 'calc(50vh - 150px)',
      transition: 'box-shadow 80ms ease'
    },
    ghost: {
      backgroundColor: 'transparent',
      border: '3px dashed rgba(255, 255, 255, 0.2)',
      boxShadow: 'none'
    },
    selected: {
      boxShadow: '0 0 0 6px #4A90E2'
    },
    header: {
      height: '24px',
      lineHeight: '24px',
      padding: '0px 24px 0px 10px',
      overflow: 'hidden',
      position: 'relative',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    icon: {
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      borderRadius: '3px',
      position: 'absolute',
      right: '4px',
      top: '4px',
      width: '16px',
      height: '16px',
    },
    image: {
      backgroundColor: '#DDD',
      backgroundImage: null,
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      height: '150px',
      marginBottom: '14px',
      position: 'relative',
      width: '240px',
    },
    screenshot: {
      backgroundColor: '#DDD',
      backgroundImage: null,
      backgroundPosition: 'center top',
      backgroundSize: 'cover',
      height: '276px',
      width: '240px'
    },
    imageLoader: {
      position: 'absolute',
      left: 0,
      zIndex: -1,
      width: 'inherit',
      height: 'inherit'
    },
    description: {
      fontSize: '12px',
      lineHeight: '18px',
      height: '90px',
      margin: '0px 10px',
      overflow: 'hidden',
      whiteSpace: 'normal'
    }
  });

  const viewContentsHeroTitleDescription = (title, icon, hero, description, theme) => [
    html.header({
        key: 'header',
        style: Style(stylePreview.header, {
          backgroundColor: theme.shell,
          color: theme.shellText
        }),
      }, [title != null ? title : '']),
    html.span({
      key: 'icon',
      alt: '',
      style: Style(stylePreview.icon, {
        backgroundImage: `url(${icon})`
      })
    }),
    html.div({
      key: 'hero',
      style: Style(stylePreview.image, {
        backgroundImage: `url(${hero})`
      })
    }, [
      html.img({
        key: 'image',
        src: hero,
        alt: '',
        style: stylePreview.imageLoader,
        onLoad: event => URL.revokeObjectURL(event.target.src)
      })
    ]),
    html.p({
      key: 'description',
      style: stylePreview.description
    }, [description])
  ];

  const viewContentsScreenshot = (title, icon, screenshot, theme) => [
    html.header({
        key: 'header',
        style: Style(stylePreview.header, {
          backgroundColor: theme.shell,
          color: theme.shellText
        }),
      }, [title != null ? title : '']),
    html.span({
      key: 'icon',
      alt: '',
      style: Style(stylePreview.icon, {
        backgroundImage: `url(${icon})`
      })
    }),
    html.div({
      key: 'screenshot',
      style: Style(stylePreview.screenshot, {
        backgroundImage: `url(${screenshot})`
      })
    }, [
      html.img({
        key: 'image',
        src: screenshot,
        alt: '',
        style: stylePreview.imageLoader,
        onLoad: event => URL.revokeObjectURL(event.target.src)
      })
    ])
  ];

  const DIRECTION_UP = 1;
  const DIRECTION_DOWN = 2;

  const preventOnBegin = action =>
    action instanceof Card.BeginSwipe ? true : false

  const decodeSwipeGestureStart = event => {
    if (event.direction === DIRECTION_UP ||
        event.direction === DIRECTION_DOWN)
    {
      event.allowedDirections = DIRECTION_UP | DIRECTION_DOWN;
      return Card.BeginSwipe({timeStamp: performance.now()});
    } else {
      return WebView.None();
    }
  }

  const decodeSwipeGestureUpdate = event =>
    Card.ContinueSwipe({y: Math.floor(event.delta * 1000),
                        timeStamp: performance.now()});


  const decodeSwipeGestureEnd = event =>
    Card.ContinueSwipe({y: Math.floor(event.delta * 1000),
                        timeStamp: performance.now()});

  const decodeSwipeGestureStop = event =>
    Card.EndSwipe({timeStamp: performance.now()});

  const distanceToOpacity = n =>
    (100 - Card.exitProximity(n)) / 100;

  const viewPreview = (loader, page, card, isSelected, address) => {
    const hero = page.hero.get(0);
    const title = page.label || page.title;
    const name = page.name || getDomainName(loader.uri);
    const theme = Theme.read(page.pallet);
    const icon = page.faviconURL || Favicon.getFallback(loader.uri);

    const previewContents =
      hero && title && page.description ?
        viewContentsHeroTitleDescription(title, icon, hero, page.description, theme) :
        viewContentsScreenshot(title, icon, page.thumbnail, theme);


    return html.div({
      style: Style(style.cardholder,
                   style.shrinkable,
                   card.beginShrink > 0 && style.shrink),
      MozSwipeGestureStart: on(address, decodeSwipeGestureStart, {
        preventDefault: preventOnBegin
      }),
      MozSwipeGestureUpdate: on(address, decodeSwipeGestureUpdate),
      MozSwipeGestureEnd: on(address, decodeSwipeGestureEnd),
      MozSwipeGesture: on(address, decodeSwipeGestureStop),
    }, [
      html.div({
        className: 'card',
        style: Style(stylePreview.card,
                     isSelected && stylePreview.selected,
                     (card && card.y != 0) && {
                       opacity: distanceToOpacity(card.y),
                       transform: `translateY(${-1 * card.y}px)`
                     }),
        onClick: forward(address, Focusable.Focus),
        onMouseUp: forward(address, Close),
        onAnimationFrame: card.isClosing && onAnimationFrame(address, timeStamp => {
          return card.endShrink > 0 ? WebView.Close() :
                 Card.AnimationFrame({timeStamp})
        })
      }, previewContents)
    ])
  };
  exports.viewPreview = viewPreview;

  const style = StyleSheet.create({
    cardholder: {
      height: '100%',
      display: 'inline-block',
      overflow: 'hidden',
      width: 260,
      position: 'relative',
      scrollSnapCoordinate: '50% 50%',
    },
    shrinkable: {
      transition: `width ${Card.shrinkDuration}ms ease-out`
    },
    shrink: {
      width: 0
    },
    scroller: {
      // Use 100px to hide a scrollbar by making scroller little larger and
      // compensating with a bottom padding.
      height: 'calc(100vh + 100px)',
      paddingBottom: 100,
      width: '100vw',
      scrollSnapType: 'proximity',
      scrollSnapDestination: '50% 50%',
      overflowX: 'auto',
      overflowY: 'hidden',
      position: 'absolute',
      textAlign: 'center',
      top: 0,
      zIndex: 0,
      MozWindowDragging: 'drag',
    },
    inactive: {
      display: 'none'
    },
    previews: {
      // This is important. We need previews to make space around itself.
      // Margin doesn't play well with scroll -- the right-hand edge will get
      // cut off, so we turn on the traditional CSS box model and use padding.
      boxSizing: 'content-box',
      height: '100%',
      margin: '0 auto',
      padding: '0 200px'
    }
  });

  const ghostPreview = html.div({
    style: style.cardholder
  }, [
    html.div({
      key: 'ghost',
      className: 'card',
      style: Style(stylePreview.card, stylePreview.ghost)
    })
  ]);


  const viewPreviews = (loaders, pages, cards, selected, address) =>
    loaders
      .map((loader, index) =>
        render(`Preview@${loader.id}`, viewPreview,
               loader,
               pages.get(index),
               cards.get(index),
               index === selected,
               forward(address, action =>
                                WebView.ByID({id: loader.id, action}))));

  const viewContainer = (styles, ...children) =>
    // Set the width of the previews element to match the width of each card
    // plus padding.
    html.div({
      key: 'preview-container',
      style: styles
    }, [
      html.div({
        key: 'preview-content',
        style: Style(style.previews, style.shrinkable)
      }, children)
    ]);

  const viewInactive = (loaders, pages, cards, selected, address) =>
    viewContainer(Style(style.scroller, style.inactive),
                  ghostPreview,
                  ...viewPreviews(loaders, pages, cards, selected, address));

  const viewInEditMode = (loaders, pages, cards, selected, address) =>
    viewContainer(style.scroller,
                  ghostPreview,
                  ...viewPreviews(loaders, pages, cards, selected, address));

  const viewInCreateMode = (loaders, pages, cards, selected, address) =>
    // Pass selected as `-1` so none is highlighted.
    viewContainer(style.scroller,
                  ghostPreview,
                  ...viewPreviews(loaders, pages, cards, -1, address));

  const view = (mode, ...etc) =>
    mode === 'show-web-view' ? viewInactive(...etc) :
    mode === 'create-web-view' ? viewInCreateMode(...etc) :
    viewInEditMode(...etc);
  exports.view = view;
