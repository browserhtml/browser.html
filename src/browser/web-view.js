/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';

  const {Record, Union, List, Maybe, Any} = require('../common/typed');
  const {html, render} = require('reflex');
  const {StyleSheet, Style} = require('../common/style');
  const URI = require('../common/url-helper');
  const Editable = require('../common/editable');
  const Focusable = require('../common/focusable');
  const IFrame = require('./iframe');
  const Progress = require('./web-progress');
  const Shell = require('./web-shell');
  const Navigation = require('./web-navigation');
  const Security = require('./web-security');
  const Page = require('./web-page');
  const Loader = require('./web-loader');

  // Model
  const Model = Record({
    selected: Maybe(Number),
    nextID: 0,

    loader: List(Loader.Model),
    shell: List(Shell.Model),
    page: List(Page.Model),
    progress: List(Progress.Model),
    navigation: List(Navigation.Model),
    security: List(Security.Model),
  }, 'WebViews');
  exports.Model = Model;

  // Returns subset of the model which can be restored acrosse sessions.
  const write = model => model.merge({
    progress: model.progress.map(Progress.write),
    page: model.page.map(Page.write),
    navigation: model.navigation.map(Navigation.write),
    security: model.security.map(Security.write)
  });
  exports.write = write;

  const get = (state, index) => ({
    loader: state.loader.get(index),
    shell: state.shell.get(index),
    page: state.page.get(index),
    progress: state.progress.get(index),
    navigation: state.navigation.get(index),
    security: state.security.get(index)
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
    uri: Maybe(String),
    name: '_blank',
    features: ''
  }, 'WebViews.Open');
  exports.Open = Open;

  const FadeToOpen = Record({
    description: 'Transition to open-web-view mode with fade animation'
  }, 'WebViews.FadeToOpen');
  exports.FadeToOpen = FadeToOpen;

  const OpenInBackground = Record({
    uri: String,
    inBackground: true
  }, 'WebView.OpenInBackground');
  exports.OpenInBackground = OpenInBackground;

  const Close = Record({
    description: 'close selected web view'
  }, 'WebView.Close');
  exports.Close = Close;

  const SelectByOffset = Record({
    description: 'Select web-view by an offset',
    offset: Number,
    loop: true
  }, 'WebViews.SelectByOffset');
  exports.SelectByOffset = SelectByOffset;

  const SelectByID = Record({
    description: 'Select web-view by an id',
    id: String
  }, 'WebViews.SelectByID');
  exports.SelectByID = SelectByID;

  const SelectByIndex = Record({
    description: 'Select web-view by an index',
    index: Number
  }, 'WebViews.SelectByIndex');
  exports.SelectByIndex = SelectByIndex;

  const SelectNext = Record({
    description: 'Select web view following selected one'
  }, 'WebViews.SelectNext');
  exports.SelectNext = SelectNext;

  const SelectPrevious = Record({
    description: 'Select web view preceeding selected one'
  }, 'WebView.SelectPrevious');
  exports.SelectPrevious = SelectPrevious;

  const {Load, LocationChanged} = Loader;
  const {CanGoBackChanged, CanGoForwardChanged} = Navigation;
  const {LoadStarted, LoadEnded} = Progress;
  const {MetaChanged, ThumbnailChanged, TitleChanged,
         IconChanged, Scrolled, OverflowChanged,
         FirstPaint, DocumentFirstPaint,
         AnnounceCuratedColor, PageCardChanged} = Page;
  const {SecurityChanged} = Security;
  const {VisibilityChanged} = Shell;
  const {Focus, Blur, Focused, Blured} = Focusable;


  // Just a union type for all possible actions that are targeted at specific
  // web view.
  const WebViewAction = Union({
    Close, Open, OpenInBackground,
    // Loader
    Load, LocationChanged,
    // Progress
    LoadStarted, LoadEnded,
    // Navigation
    CanGoBackChanged, CanGoForwardChanged,
    // Page
    MetaChanged, ThumbnailChanged, TitleChanged, IconChanged, Scrolled,
    OverflowChanged, PageCardChanged, FirstPaint, DocumentFirstPaint,
    PageCardChanged, AnnounceCuratedColor,
    // Security
    SecurityChanged,
    // Shell
    VisibilityChanged,
    Focus, Blur, Focused, Blured,
    // Other
    Failure, ContextMenu, ModalPrompt, Authentificate
  });
  exports.WebViewAction = WebViewAction;

  // Type contains `id` of the web-view and an `action` that is targeted
  // the web-view that has matching `id`. If `id` is `null` targets currently
  // selected web-view.
  const Action = Record({
    id: Maybe(String),
    action: WebViewAction
  }, 'WebView.Action');
  exports.Action = Action;



  // Update


  const indexByID = (state, id) =>
    id === null ? state.selected :
    id === void(0) ? state.selected :
    id === '@selected' ? state.selected :
    state.loader.findIndex(loader => loader.id === id);
  exports.indexByID = indexByID;

  const indexByOffset = (state, offset, loop) => {
    const position = state.selected + offset;
    const count = state.loader.size;
    if (loop) {
      const index = position - Math.trunc(position / count) * count
      return index < 0 ? index + count :  index
    } else {
      return Math.min(count - 1, Math.max(0, position))
    }
  }
  exports.indexByOffset = indexByOffset;

  const selectByOffset = (state, offset, loop=true) =>
    state.set('selected', indexByOffset(state, offset, loop));
  exports.selectByOffset = selectByOffset;

  const selectByID = (state, id) =>
    state.set('selected', indexByID(state, id));
  exports.selectByID = selectByID;

  const selectByIndex = (state, index) =>
    state.set('selected', index);
  exports.selectByIndex = selectByIndex;

  // Transformers

  const open = (state, {uri, inBackground}) => state.merge({
    nextID: state.nextID + 1,
    selected: inBackground ? state.selected + 1: 0,
    loader: state.loader.unshift(Loader.Model({uri, id: String(state.nextID)})),
    shell: state.shell.unshift(Shell.Model({isFocused: !inBackground})),
    page: state.page.unshift(Page.Model()),
    progress: state.progress.unshift(Progress.Model()),
    navigation: state.navigation.unshift(Navigation.Model()),
    security: state.security.unshift(Security.Model())
  });
  exports.open = open;

  const close = state =>
    closeByIndex(state, state.selected);
  exports.close = close;

  const closeByID = (state, id) =>
    closeByIndex(state, indexByID(state, id));
  exports.closeByID = closeByID;

  const closeByIndex = (state, index) =>
    index === null ? state : state.merge({
      selected: state.loader.size === 1 ?  null :
                index === 0 ? 0 : index - 1,

      loader: state.loader.remove(index),
      shell: state.shell.remove(index),
      page: state.page.remove(index),
      progress: state.progress.remove(index),
      navigation: state.navigation.remove(index),
      security: state.security.remove(index)
    });
  exports.closeByIndex = closeByIndex;


  const load = (state, action) =>
    loadByIndex(state, state.selected, action);
  exports.load = load;

  const loadByID = (state, id, action) =>
    loadByIndex(state, indexByID(id), action);
  exports.loadByID = loadByID;

  const loadByIndex = (state, index, action) => {
    const loader = state.loader.get(index);
    return !loader ?
            open(state, action) :
           loader.uri && (URI.getOrigin(loader.uri) !== URI.getOrigin(action.uri)) ?
            open(state, action) :
            updateByIndex(state, index, Loader.Load(action));
  };
  exports.loadByIndex = loadByIndex;


  const updateByID = (state, id, action) =>
    action instanceof Load ? loadByID(state, id, action) :
    action instanceof Close ? closeByID(state, id) :
    action instanceof Open ? open(state, action) :
    action instanceof OpenInBackground ? open(state, action) :
    updateByIndex(state, indexByID(state, id), action);
  exports.updateByID = updateByID;

  const updateByIndex = (state, n, action) => {
    const {loader, shell, page, progress, navigation, security} = state;
    return n === null ? state : state.merge({
     selected: action instanceof Focus ? n :
               action instanceof Focused ? n :
               state.selected,
     loader: loader.set(n, Loader.update(loader.get(n), action)),
     shell: shell.set(n, Shell.update(shell.get(n), action)),
     page: page.set(n, Page.update(page.get(n), action)),
     progress: progress.set(n, Progress.update(progress.get(n), action)),
     security: security.set(n, Security.update(security.get(n), action)),
     navigation: navigation.set(n, Navigation.update(navigation.get(n), action))
   });
 };

  const update = (state, action) =>
    action instanceof Load ?
      load(state, action) :
    action instanceof Open ?
      open(state, action) :
    action instanceof OpenInBackground ?
      open(state, action) :
    action instanceof Close ?
      close(state) :
    action instanceof SelectByIndex ?
      selectByIndex(state, action.index) :
    action instanceof SelectByID ?
      selectByID(state, action.id) :
    action instanceof SelectByOffset ?
      selectByOffset(state, action.offset, action.loop) :
    action instanceof SelectNext ?
      selectByOffset(state, 1) :
    action instanceof SelectPrevious ?
      selectByOffset(state, -1) :
    // @TODO we explicitly tie ZoomIn/ZoomOut actions to selected webview.
    // It may make more sense in future to include an ID with the action model.
    action instanceof Shell.ResetZoom ?
      updateByID(state, '@selected', action) :
    action instanceof Shell.ZoomIn ?
      updateByID(state, '@selected', action) :
    action instanceof Shell.ZoomOut ?
      updateByID(state, '@selected', action) :
    action instanceof Action ?
      updateByID(state, action.id, action.action) :
    state;
  exports.update = update;


  // View

  const webviewStyle = StyleSheet.create({
    base: {
      position: 'absolute',
      MozUserSelect: 'none',
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      zIndex: 0,
    },
    active: {
      zIndex: 1,
    },
    inactive: {
      display: 'none',
    },
    passive: {
      visibility: 'hidden',
    }
  });

  const viewWebView = (loader, shell, thumbnail, isSelected, address) => {
    // Do not render anything unless viewer has an `uri`
    if (!loader.uri) return null;

    const action = address.pass(Event);
    const location = URI.resolve(loader.uri);

    return IFrame.view({
      id: `web-view-${loader.id}`,
      uri: location,
      className: `web-view ${isSelected ? 'selected' : ''}`,
      // This is a workaround for Bug #266 that prevents capturing
      // screenshots if iframe or it's ancesstors have `display: none`.
      // Until that's fixed on platform we just hide such elements with
      // negative index and absolute position.
      style: Style(webviewStyle.base,
                   isSelected ? webviewStyle.active :
                   !thumbnail ? webviewStyle.passive :
                   webviewStyle.inactive),
      mozbrowser: true,
      remote: true,
      mozapp: URI.isPrivileged(location) ? URI.getManifestURL().href : null,
      mozallowfullscreen: true,
      isVisible: isSelected || !thumbnail,
      zoom: shell.zoom,

      isFocused: shell.isFocused,

      onCanGoBackChanged: action,
      onCanGoForwardChanged: action,
      onBlur: action,
      onFocus: action,
      // onAsyncScroll: action
      onClose: action,
      onOpenWindow: action,
      onOpenTab: action,
      onMenu: action,
      onError: action,
      onLoadStarted: action,
      onLoadEnded: action,
      onFirstPaint: action,
      onDocumentFirstPaint: action,
      onLoadProgressChange: action,
      onLocationChanged: action,
      onMetaChanged: action,
      onIconChanged: action,
      onLocationChanged: action,
      onSecurityChanged: action,
      onTitleChanged: action,
      onPrompt: action,
      onAuthentificate: action,
      onScrollAreaChange: action,
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

  const view = (mode, transition, loader, shell, page, address, selected) =>
    html.div({
      key: 'web-views',
      style: Style(webviewsStyle.base, getModeStyle(mode, transition)),
    }, loader.map((loader, index) =>
      render(`web-view@${loader.id}`, viewWebView,
             loader,
             shell.get(index),
             page.get(index).thumbnail,
             index === selected,
             address.forward(action => Action({id: loader.id, action})))));
  exports.view = view;

  // Actions that web-view produces but `update` does not handles.



  const Event = event =>
    Event[event.type](event);

  Event.mozbrowserdocumentfirstpaint = event =>
    DocumentFirstPaint();

  Event.mozbrowserfirstpaint = event =>
    FirstPaint();

  Event.mozbrowserlocationchange = ({detail: uri}) =>
    LocationChanged({uri});

  // TODO: Figure out what's in detail
  Event.mozbrowserclose = ({detail}) =>
    Close();

  Event.mozbrowseropenwindow = ({detail}) =>
    Open({uri: detail.url,
          name: detail.name,
          features: detail.features});

  Event.mozbrowseropentab = ({detail}) =>
    OpenInBackground({uri: detail.url});

  // TODO: Figure out what's in detail
  Event.mozbrowsercontextmenu = ({detail}) =>
    ContextMenu();

  // TODO: Figure out what's in detail
  Event.mozbrowsershowmodalprompt = ({detail}) =>
    ModalPrompt();

  // TODO: Figure out what's in detail
  Event.mozbrowserusernameandpasswordrequired = ({detail}) =>
    Authentificate();

  // TODO: Figure out what's in detail
  Event.mozbrowsererror = ({detail}) =>
    Failure({detail});


  Event.focus = ({id}) =>
    Focused({id});

  Event.blur = ({id}) =>
    Blured({id});


  Event.mozbrowsergobackchanged = ({detail: value}) =>
    CanGoBackChanged({value});

  Event.mozbrowsergoforwardchanged = ({detail: value}) =>
    CanGoForwardChanged({value});


  Event.mozbrowserloadstart = ({target, timeStamp}) =>
    LoadStarted({uri: target.location});

  Event.mozbrowserloadend = ({target, timeStamp}) =>
    LoadEnded({uri: target.location});

  Event.mozbrowsertitlechange = ({target, detail: title}) =>
    TitleChanged({uri: target.location, title});

  Event.mozbrowsericonchange = ({target, detail: icon}) =>
    IconChanged({uri: target.location, icon});

  Event.mozbrowsermetachange = ({detail: {content, name}}) =>
    MetaChanged({content, name});

  // TODO: Figure out what's in detail
  Event.mozbrowserasyncscroll = ({detail}) =>
    Scrolled();

  Event.mozbrowserscrollareachanged = ({target, detail}) =>
    OverflowChanged({
      overflow: detail.height > target.parentNode.clientHeight
    });

  Event.mozbrowsersecuritychange = ({detail}) =>
    SecurityChanged({
      state: detail.state,
      extendedValidation: detail.extendedValidation
    });
