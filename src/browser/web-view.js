/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('typed-immutable');
  const {html, thunk:render, forward} = require('reflex');
  const {StyleSheet, Style} = require('../common/style');
  const URI = require('../common/url-helper');
  const Editable = require('../common/editable');
  const Focusable = require('../common/focusable');
  const Progress = require('./web-progress');
  const Shell = require('./web-shell');
  const Navigation = require('./web-navigation');
  const Security = require('./web-security');
  const Page = require('./web-page');
  const Loader = require('./web-loader');
  const Selector = require('../common/selector');
  const Force = require('../service/force');
  const Card = require('./web-card');
  const Sheet = require('./web-sheet');
  const {Effects} = require('reflex');
  const {onAnimationFrame, on, focus, visiblity, zoom, opener, navigate,
         onCanGoBackChange, onCanGoForwardChange} = require('driver');


  // Model
  const Model = Record({
    selected: Maybe(Number),
    previewed: Maybe(Number),
    nextID: 0,

    loader: List(Loader.Model),
    shell: List(Shell.Model),
    page: List(Page.Model),
    progress: List(Progress.Model),
    navigation: List(Navigation.Model),
    security: List(Security.Model),
    card: List(Card.Model),
    sheet: List(Sheet.Model)
  }, 'WebViews');
  exports.Model = Model;

  const get = (state, index) => ({
    loader: state.loader.get(index),
    shell: state.shell.get(index),
    page: state.page.get(index),
    progress: state.progress.get(index),
    navigation: state.navigation.get(index),
    security: state.security.get(index),
    card: state.card.get(index),
    sheet: state.sheet.get(index)
  });
  exports.get = get;

  // Actions

  const Failure = Record({
    description: 'WebView failure',
    detail: Any
  }, 'WebView.Failure');
  exports.Failure = Failure;

  const ContextMenu = Record({
    description: 'WebView requested a context menu',
  }, 'WebView.ContextMenu');
  exports.ContextMenu = ContextMenu;

  const ModalPrompt = Record({
    description: 'WebView requested a modal prompt'
  }, 'WebView.ModalPrompt');
  exports.ModalPrompt = ModalPrompt;

  const Authentificate = Record({
    description: 'WebView requested an authentification'
  }, 'WebView.Authentificate');
  exports.Authentificate = Authentificate;

  const Open = Record({
    opener: Any,
    uri: Maybe(String),
    name: '_blank',
    features: ''
  }, 'WebViews.Open');
  exports.Open = Open;

  const OpenInBackground = Record({
    uri: String,
    inBackground: true
  }, 'WebView.OpenInBackground');
  exports.OpenInBackground = OpenInBackground;

  const Close = Record({
    description: 'close selected web view'
  }, 'WebView.Close');
  exports.Close = Close;

  const SelectByID = Record({
    description: 'Select web-view by an id',
    id: String
  }, 'WebViews.SelectByID');
  exports.SelectByID = SelectByID;

  const None = Record({
    description: 'This is like a null action'
  }, 'WebView.None');
  exports.None = None;


  // Just a union type for all possible actions that are targeted at specific
  // web view.
  const Action = Union(
    Close, Open, OpenInBackground, None,
    Loader.Action, Progress.Action, Navigation.Action, Focusable.Action,
    Page.Action, Security.Action, Shell.Action, Card.Action, Sheet.Action,
    Failure, ContextMenu, ModalPrompt, Authentificate);
  exports.Action = Action;

  // Type contains `id` of the web-view and an `action` that is targeted
  // the web-view that has matching `id`. If `id` is `null` targets currently
  // selected web-view.
  const ByID = Record({
    id: String,
    action: Action
  }, 'WebView.ByID');
  exports.ByID = ByID;

  const BySelected = Record({
    action: Action
  }, 'WebView.BySelected');
  exports.BySelected = BySelected;

  const Select = Record({
    action: Selector.Action
  }, 'WebView.Select');
  exports.Select = Select;

  const Preview = Record({
    action: Selector.Action
  }, 'WebView.Preview');
  exports.Preview = Preview;


  // Update


  const indexByID = (state, id) => {
    const index = state.loader.findIndex(loader => loader.id === id);
    return index < 0 ? null : index;
  };
  exports.indexByID = indexByID;

  // Transformers

  const open = (state, {uri, inBackground, opener}) => activate(state.merge({
    nextID: state.nextID + 1,
    previewed: inBackground ? state.selected + 1 : 0,
    loader: state.loader.unshift(Loader.Model({
      uri, opener, src: uri,
      id: String(state.nextID),
    })),
    shell: state.shell.unshift(Shell.Model({isFocused: !inBackground})),
    page: state.page.unshift(Page.Model()),
    progress: state.progress.unshift(Progress.Model()),
    navigation: state.navigation.unshift(Navigation.Model()),
    security: state.security.unshift(Security.Model()),
    card: state.card.unshift(Card.Model()),
    sheet: state.sheet.unshift(Sheet.init())
  }));
  exports.open = open;

  const closeByIndex = (state, index) =>
    index == null ? state : activate(state.merge({
      previewed: // If view closed is to the right of the previewed one
                 // everything stays as is.
                 index > state.previewed ? state.previewed :
                 // If view closed is to the left of the previewed one
                 // then index of previewed is positive (given that index
                 // is at min 0) so previewed is decremented.
                 index < state.previewed ? state.previewed - 1 :

                 // Otherwise previewed view is being closed.

                 // If it is only view there is no more previewed view so
                 // it is `null`.
                 state.loader.size === 1 ?  null :
                 // If it is a first view new previewed is still the first.
                 index === 0 ? 0 :
                 // otherwise to keep the same view previewed we decrement
                 // (index althoug here it's same as previewd).
                 index - 1,
      loader: state.loader.remove(index),
      shell: state.shell.remove(index),
      page: state.page.remove(index),
      progress: state.progress.remove(index),
      navigation: state.navigation.remove(index),
      security: state.security.remove(index),
      card: state.card.remove(index),
      sheet: state.sheet.remove(index)
    }));
  exports.closeByIndex = closeByIndex;


  const loadByIndex = (state, index, action) => {
    const loader = state.loader.get(index);
    return !loader ?
            open(state, action) :
            changeByIndex(state, index, action);
  };
  exports.loadByIndex = loadByIndex;

  const updateByIndex = (state, n, action) =>
    action instanceof Loader.Load ? loadByIndex(state, n, action) :
    action instanceof Close ? closeByIndex(state, n, action) :
    action instanceof Open ? open(state, action) :
    action instanceof OpenInBackground ? open(state, action) :
    changeByIndex(state, n, action);
  exports.updateByIndex = updateByIndex;

  const changeByIndex = (state, n, action) => {
    const {loader, shell, page, progress, navigation, security, card, sheet} = state;
    return n == null ? state : activate(state.merge({
      selected: action instanceof Focusable.Focus ? n :
               action instanceof Focusable.Focused ? n :
               state.selected,
      loader: loader.set(n, Loader.update(loader.get(n), action)),
      shell: shell.set(n, Shell.update(shell.get(n), action)),
      page: page.set(n, Page.update(page.get(n), action)),
      progress: progress.set(n, Progress.update(progress.get(n), action)),
      security: security.set(n, Security.update(security.get(n), action)),
      navigation: navigation.set(n, Navigation.update(navigation.get(n), action)),
      card: card.set(n, Card.update(card.get(n), action)),
      sheet: sheet.set(n, Sheet.physics(sheet.get(n), action))
    }));
  };


  const stepByIndex = (state, n, action) => {
    if (action instanceof Open) {
      return [open(state, action), Effects.none]
    }

    if (action instanceof OpenInBackground) {
      return [open(state, action), Effects.none]
    }

    if (action instanceof Close) {
      [closeByIndex(state, n, action), Effects.none]
    }

    // If load is initiatied need to update web-view loader & shell to
    // focus given web-view.
    if (action instanceof Loader.Load) {

    }

    // Web view shell update.

    if (action instanceof Focusable.Focus ||
        action instanceof Focusable.Focused) {

      return [
        state.set('selected', n)
             .setIn(['shell', n], Shell.update(shell.get(n), action)),
        Effects.none
      ]
    }

    if (action instanceof VisibilityChanged ||
        action instanceof ZoomIn ||
        action instanceof ZoomOut ||
        action instanceof ResetZoom ||
        action instanceof Focusable.Blur ||
        action instanceof Focusable.Blured) {

    }






  const updateSelected = (state, action) =>
    updateByIndex(state, state.selected, action);

  const activate = state =>
    state.set('selected', state.previewed);
  exports.activate = activate;

  exports.focus = state =>
    state.setIn(['shell', state.selected, 'isFocused'], true)

  const select = (state, action) =>
    activate(state.set('previewed',
                       Selector.indexOf(state.selected,
                                        state.loader.size,
                                        action)));
  exports.select = select;

  const preview = (state, action) =>
    state.set('previewed', Selector.indexOf(state.previewed,
                                            state.loader.size,
                                            action));
  exports.preview = preview;

  const update = (state, action) =>
    action instanceof Select ?
      select(state, action.action) :
    action instanceof Preview ?
      preview(state, action.action) :
    action instanceof ByID ?
      updateByIndex(state, indexByID(state, action.id), action.action) :
    action instanceof BySelected ?
      updateByIndex(state, state.selected, action.action) :
    action instanceof Open ?
      open(state, action) :
    action instanceof OpenInBackground ?
      open(state, action) :
    state;
  exports.update = update;


  const reportUnknown = action => {
    console.warn(`Unsupported action ${action} received on web-view`)
    return action
  }

  const step = (state, action) =>
    action instanceof Select ?
      [select(state, action.action), Effects.none] :
    action instanceof Preview ?
      [preview(state, action.action), Effects.none] :
    action instanceof ByID ?
      stepByIndex(state, indexByID(state, action.id), action.action) :
    action instanceof BySelected ?
      stepByIndex(state, state.selected, action.action) :
    action instanceof Open ?
      [open(state, action), Effects.none] :
    action instanceof OpenInBackground ?
      [open(state, action), Effects.none] :
      [state, reportUnknown(action)]
    exports.update = update;



  // View

  const webviewStyle = StyleSheet.create({
    base: {
      position: 'absolute',
      MozUserSelect: 'none',
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      zIndex: 2
    },
    motion: {
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.4)',
    },

    navigationArrow: {
      position: 'absolute',
      zIndex: 1,
      fontFamily: 'FontAwesome',
      fontSize: '60px',
      lineHeight: '60px',
      display: 'inline',
      top: '50%',
      marginTop: '-60px'
    },
    forwardArrow: {
      right: '60px',
      content: '\uf054'
    },
    backArrow: {
      left: '60px',
      content: '\uf053'
    },

    active: {
      zIndex: 2,
    },
    inactive: {
      display: 'none',
    },
    passive: {
      visibility: 'hidden',
    },
    perspective: {
      perspective: '100vw',
      transformStyle: 'preserve-3d',
      height: 'inherit',
      width: 'inherit'
    }
  });

  // See: https://dxr.mozilla.org/mozilla-central/source/dom/interfaces/events/nsIDOMSimpleGestureEvent.idl?offset=100#108-109
  const DIRECTION_LEFT = 4;
  const DIRECTION_RIGHT = 8;


  const decodeSwapeGestureStart = event => {
    if (event.direction === DIRECTION_LEFT ||
        event.direction === DIRECTION_RIGHT)
    {
      event.allowedDirections = DIRECTION_LEFT | DIRECTION_RIGHT;
      event.preventDefault();


      return Sheet.BeginSwipe({
        delta: event.delta,
        timeStamp: performance.now()
      });
    } else {
      return None();
    }
  }

  const decodeSwipeGestureUpdate = event => Sheet.ContinueSwipe({
    delta: event.delta,
    timeStamp: performance.now()
  })

  const decodeSwipeGestureEnd = event => Sheet.ContinueSwipe({
    delta: event.delta,
    timeStamp: performance.now()
  });

  const decodeSwipeGestureStop = event => Sheet.EndSwipe({
    timeStamp: performance.now()
  });

  const viewWebView = (loader, shell, navigation, thumbnail, sheet, isSelected, address) => {
    return html.div({
      key: 'web-view',
      style: Style(webviewStyle.perspective,
                    isSelected ? webviewStyle.active :
                    !thumbnail ? webviewStyle.passive :
                    webviewStyle.inactive),
      MozSwipeGestureStart: on(address, decodeSwapeGestureStart),
      MozSwipeGestureUpdate: on(address, decodeSwipeGestureUpdate),
      MozSwipeGestureEnd: on(address, decodeSwipeGestureEnd),
      MozSwipeGesture: on(address, decodeSwipeGestureStop)
    }, [
      html.figure({
        key: 'goBack',
        style: Style(webviewStyle.navigationArrow,
                     webviewStyle.backArrow,
                     navigation.canGoBack ?
                      {opacity: Math.abs(sheet.value)} :
                      webviewStyle.inactive)
      }, [webviewStyle.backArrow.content]),
      html.figure({
        key: 'goForward',
        style: Style(webviewStyle.navigationArrow,
                     webviewStyle.forwardArrow,
                     navigation.canGoForward ?
                      {opacity: Math.abs(sheet.value)} :
                      webviewStyle.inactive)
      }, [webviewStyle.forwardArrow.content]),
      html.div({
        key: 'perspective',
        style: Style(webviewStyle.base,
                     sheet.isInMotion ? webviewStyle.motion : null,
                     sheet.isInMotion ? {
                        transform: `rotateY(${sheet.angle}deg)
                                    translateZ(${sheet.z}px)
                                    translateX(${sheet.x}px)`
                     } : null,
                     (sheet.isInMotion && !sheet.isForced) ? {
                       transition: `${sheet.releaseDuration}ms transform ease-out`
                     } : null),
      }, [
        viewWebFrame(loader, shell, navigation, thumbnail, isSelected, address)
      ])
    ]);
  };

  const viewWebFrame = (loader, shell, navigation, thumbnail, isSelected, address) => {
    // Do not render anything unless viewer has an `uri`
    if (loader.uri == null) return null;

    const action = forward(address, Event);
    const location = URI.resolve(loader.src);

    return html.iframe({
      id: `web-view-${loader.id}`,
      src: location,
      'data-uri': loader.uri,
      opener: opener(loader.opener),
      className: `web-view ${isSelected ? 'selected' : ''}`,
      style: webviewStyle.base,
      attributes: {
        mozbrowser: true,
        remote: true,
        mozapp: URI.isPrivileged(location) ? URI.getManifestURL().href : void(0),
        mozallowfullscreen: true
      },
      isVisible: visiblity(isSelected || !thumbnail),
      zoom: zoom(shell.zoom),
      navigation: navigate(navigation.state),

      isFocused: focus(shell.isFocused),

      onBlur: on(address, decodeBlur),
      onFocus: on(address, decodeFocus),
      // onMozbrowserAsyncScroll: on(address, decodeAsyncScroll),

      onMozBrowserCanGoBackChange: onCanGoBackChange(address, decodeCanGoBackChange),
      onMozBrowserCanGoForwardChange: onCanGoForwardChange(address, decodeCanGoForwardChange),

      onMozBrowserClose: on(address, decodeClose),
      onMozBrowserOpenWindow: on(address, decodeOpenWindow),
      onMozBrowserOpenTab: on(address, decodeOpenTab),
      onMozBrowserContextMenu: on(address, decodeContexMenu),
      onMozBrowserError: on(address, decodeError),
      onMozBrowserLoadStart: on(address, decodeLoadStart),
      onMozBrowserLoadEnd: on(address, decodeLoadEnd),
      onMozBrowserFirstPaint: on(address, decodeFirstPaint),
      onMozBrowserDocumentFirstPaint: on(address, decodeDocumentFirstPaint),
      // onMozBrowserLoadProgressChange: on(address, decodeProgressChange),
      onMozBrowserLocationChange: on(address, decodeLocationChange),
      onMozBrowserMetaChange: on(address, decodeMetaChange),
      onMozBrowserIconChange: on(address, decodeIconChange),
      onMozBrowserLocationChange: on(address, decodeLocationChange),
      onMozBrowserSecurityChange: on(address, decodeSecurityChange),
      onMozBrowserTitleChange: on(address, decodeTitleChange),
      onMozBrowserShowModalPrompt: on(address, decodeShowModalPrompt),
      onMozBrowserUserNameAndPasswordRequired: on(address, decodeAuthenticate),
      onMozBrowserScrollAreaChanged: on(address, decodeScrollAreaChange),
    });
  };
  exports.viewWebView = viewWebView;

  const webviewsStyle = StyleSheet.create({
    base: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    fadeIn: {
      transition: 'opacity 100ms linear',
      transform: 'scale(1)',
      opacity: 1,
    },
    fadeOut: {
      transition: 'transform 0ms linear 100ms, opacity 100ms linear',
      transform: 'scale(0)',
      opacity: 0,
      pointerEvents: 'none',
    },
    grow: {
      transition: 'transform 200ms linear, opacity 200ms linear',
      transform: 'scale(1)',
      opacity: 1,
    },
    shrink: {
      transition: 'transform 200ms linear, opacity 150ms linear',
      transform: 'scale(0)',
      opacity: 0,
      pointerEvents: 'none',
    },
    hide: {
      transform: 'scale(0)',
      opacity: 0,
      pointerEvents: 'none'
    }
  });

  // Given a mode and transition, returns appropriate style object.
  const getModeStyle =  (mode, transition) =>
    (mode === 'show-web-view' && transition === 'fade') ?
      webviewsStyle.fadeIn :
    (mode === 'show-web-view' && transition === 'zoom') ?
      webviewsStyle.grow :
    (mode === 'create-web-view' && transition === 'fade') ?
      webviewsStyle.fadeOut :
    mode === 'select-web-view' ?
      webviewsStyle.fadeOut :
    (mode === 'edit-web-view' && !transition) ?
      webviewsStyle.hide :
    (mode === 'edit-web-view' && transition === 'fade') ?
      webviewsStyle.fadeOut :
    webviewsStyle.shrink;

  const view = (mode, transition, loader, shell, navigation, page, sheet, address, selected) =>
    html.div({
      key: 'web-views',
      style: Style(webviewsStyle.base, getModeStyle(mode, transition)),
    }, [...loader.map((loader, index) =>
      render(`web-view@${loader.id}`, viewWebView,
              loader,
              shell.get(index),
              navigation.get(index),
              page.get(index).thumbnail,
              sheet.get(index),
              index === selected,
              forward(address, action =>
                // If action is boxed in Force.Action we want to keep it
                // that way.
                action instanceof Force.Action ?
                  action.set('action', ByID({
                    id: loader.id,
                    action: action.action
                  })) :
                  ByID({id: loader.id, action}))))]);
  exports.view = view;

  // Actions that web-view produces but `update` does not handles.


  const decodeDocumentFirstPaint = event =>
    Page.DocumentFirstPaint();

  const decodeFirstPaint = event =>
    Page.FirstPaint();

  const decodeLocationChange = ({target, detail: uri, timeStamp}) =>
    Loader.LocationChanged({uri, timeStamp});

  // TODO: Figure out what's in detail
  const decodeClose = ({detail}) =>
    Close();

  const decodeOpenWindow = ({detail}) =>
    Force.Action({
      action: Open({
        uri: detail.url,
        opener: IFrame.Opener(detail.frameElement),
        name: detail.name,
        features: detail.features
      })
    });

  const decodeOpenTab = ({detail}) =>
    Force.Action({
      action: OpenInBackground({
        uri: detail.url,
        opener: IFrame.Opener(detail.frameElement),
      })
    });

  // TODO: Figure out what's in detail
  const decodeContexMenu = ({detail}) =>
    ContextMenu();

  // TODO: Figure out what's in detail
  const decodeShowModalPrompt = ({detail}) =>
    ModalPrompt();

  // TODO: Figure out what's in detail
  const decodeAuthenticate = ({detail}) =>
    Authentificate();

  // TODO: Figure out what's in detail
  const decodeError = ({detail}) =>
    Failure({detail});


  const decodeFocus = (_) =>
    Focusable.Focused();

  const decodeBlur = (_) =>
    Focusable.Blured();

  const decodeCanGoBackChange = ({detail: value}) =>
    Navigation.CanGoBackChanged({value});

  const decodeCanGoForwardChange = ({detail: value}) =>
    Navigation.CanGoForwardChanged({value});

  const decodeLoadStart = ({target, timeStamp}) =>
    Progress.LoadStarted({uri: target.dataset.uri, timeStamp});

  const decodeLoadEnd = ({target, timeStamp}) =>
    Progress.LoadEnded({uri: target.dataset.uri, timeStamp});

  const decodeTitleChange = ({target, detail: title}) =>
    Page.TitleChanged({uri: target.dataset.uri, title});

  const decodeIconChange = ({target, detail: icon}) =>
    Page.IconChanged({uri: target.dataset.uri, icon});

  const decodeMetaChange = ({detail: {content, name}}) =>
    Page.MetaChanged({content, name});

  // TODO: Figure out what's in detail
  const decodeAsyncScroll = ({detail}) =>
    Page.Scrolled();

  const decodeScrollAreaChange = ({target, detail}) =>
    Page.OverflowChanged({
      overflow: detail.height > target.parentNode.clientHeight
    });

  const decodeSecurityChange = ({detail}) =>
    Security.SecurityChanged({
      state: detail.state,
      extendedValidation: detail.extendedValidation
    });
