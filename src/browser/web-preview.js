/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const {html, render} = require('reflex');
  const WebView = require('./web-view');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const {Style, StyleSheet} = require('common/style');
  const {getDomainName} = require('common/url-helper');

  // Model

  const {PreviewByID, SelectByID} = WebView.Action;
  const Close = (context, event) => {
    if (event.button === 1) {
      event.stopPropagation();
      return WebView.Close(context);
    }
    // We should probably just allow retuning null
    return {}
  }


  // View


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
      fontSize: 16,
      verticalAlign: 'middle',
      cursor: 'default'
    }
  });

  const DashboardIcon = '\uf067';

  const viewControls = (theme, address) => html.div({
    style: styleControls.panel
  }, [
    html.button({
      key: 'dashboard-button',
      style: styleControls.button,
      onClick: address.send(Input.Action.Focus({id: 'about:dashboard'}))
    }, DashboardIcon)
  ]);
  exports.viewControls = viewControls;

  const stylePreview = StyleSheet.create({
    card: {
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
      color: '#444',
      display: 'inline-block',
      height: '300px',
      margin: '0 10px',
      overflow: 'hidden',
      position: 'relative',
      width: '240px'
    },
    selected: {
      boxShadow: '0 0 0 6px rgb(73, 135, 205)'
    },
    header: {
      height: '24px',
      lineHeight: '24px',
      margin: '0px 24px 0px 10px',
      overflow: 'hidden',
      position: 'relative',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    title: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 'bold',
      lineHeight: '18px',
      margin: '0 10px 8px 10px',
      width: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    icon: {
      borderRadius: '3px',
      position: 'absolute',
      right: '4px',
      top: '4px',
      width: '16px',
      height: '16px',
      MozForceBrokenImageIcon: 0
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
      backgroundPosition: 'left top',
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
      height: '72px',
      margin: '0px 10px',
      overflow: 'hidden',
      whiteSpace: 'normal'
    }
  });

  const viewContentsHeroTitleDescription = (name, icon, hero, title, description) => [
    html.header({
        key: 'header',
        style: stylePreview.header,
      }, name),
    html.span({
      key: 'icon',
      alt: '',
      style: Style(stylePreview.icon, {
        backgroundImage: `url(${icon})`
      })
    }),
    html.div({
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
    html.div({
      key: 'title',
      style: stylePreview.title
    }, title),
    html.p({
      key: 'description',
      style: stylePreview.description
    }, description)
  ];

  const viewContentsScreenshot = (name, icon, screenshot) => [
    html.header({
        key: 'header',
        style: stylePreview.header,
      }, name),
    html.span({
      key: 'icon',
      alt: '',
      style: Style(stylePreview.icon, {
        backgroundImage: `url(${icon})`
      })
    }),
    html.div({
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

  const viewPreview = (loader, page, isSelected, address) => {
    const hero = page.hero.get(0);
    const title = page.label || page.title;
    const name = page.name || getDomainName(loader.uri);

    const previewContents =
      hero && title && page.description ?
        viewContentsHeroTitleDescription(name, page.icon, hero, title, page.description) :
        viewContentsScreenshot(name, page.icon, page.thumbnail);

    return html.div({
      className: 'card',
      style: Style(stylePreview.card,
                   isSelected && stylePreview.selected),
      onClick: address.pass(Shell.Action.Focus, loader),
      onMouseUp: address.pass(Close, loader)
    }, previewContents);
  };
  exports.viewPreview = viewPreview;

  const style = StyleSheet.create({
    preview: {
      width: '100vw',
      height: '100vh',
      paddingTop: 'calc(100vh / 2 - 150px)',
      backgroundColor: '#273340',
      overflowX: 'auto',
      position: 'absolute',
      top: 0,
      zIndex: 0,
      MozWindowDragging: "drag"
    }
  });

  const view = (loaders, pages, input, selected, theme, address) =>
    html.div({style: style.preview},
      loaders
        .map((loader, index) =>
          render(`Preview@${loader.id}`, viewPreview,
                 loader, pages.get(index),
                 index === selected, address)));
  exports.view = view;

});
