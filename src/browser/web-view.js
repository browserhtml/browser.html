/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const {html, render} = require('reflex');
  const {StyleSheet, Style} = require('common/style');
  const URI = require('common/url-helper');
  const Editable = require('common/editable');
  const Focusable = require('common/focusable');
  const IFrame = require('./iframe');
  const Progress = require('./progress-bar');
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

  // All actions that `WebView.update` handles have a an `id` field that refers
  // to the `id` of the `WebView`. As a matter of fact those actions are routed
  // by `WebViews` which is what `id` field needed for. Default `id` is set to
  // `@selected` that and `@previewed` which refer to currently selected /
  // previewed WebView. These actions in fact would have being defined on the
  // `WebViews` instead but that would coused cyrcular dependncy there for we
  // define them here and use them from `WebViews` instead.

  const Open = Record({
    uri: String,
    name: '_blank',
    features: ''
  }, 'WebViews.Open');
  exports.Open = Open;

  const OpenInBackground = Record({
    uri: String
  }, 'WebView.OpenInBackground');
  exports.OpenInBackground = OpenInBackground;

  const Close = Record({
    id: '@selected'
  }, 'WebView.Close');
  exports.Close = Close;

  const SelectByOffset = Record({
    offset: Number,
    loop: true
  }, 'WebViews.SelectByOffset');

  const SelectByID = Record({
    id: String
  }, 'WebViews.SelectByID');

  const SelectByIndex = Record({
    index: Number
  }, 'WebViews.SelectByIndex');


  const Action = Union({
    Open, OpenInBackground, Close,
    SelectByIndex, SelectByID, SelectByOffset,
    Loader: Loader.Action,
    Navigation: Navigation.Action,
    Security: Security.Action,
    Progress: Progress.Action,
    Page: Page.Action,
    Shell: Shell.Action
  });
  exports.Action = Action;



  // Utils

  const indexByID = (state, id) =>
    id === '@selected' ? state.selected :
    state.loader.findIndex(loader => loader.id === id);

  const indexByOffset = (state, offset, loop=true) => {
    const position = state.selected + offset;
    const count = state.loader.size;
    return loop ? position - Math.trunc(position / count) * count :
           Math.min(count - 1, Math.max(0, position));
  }

  const select = (state, action) =>
    action instanceof SelectByOffset ?
      indexByOffset(state, action.offset) :
    action instanceof SelectByID ?
      indexByID(state, action.id) :
    action instanceof SelectByIndex ?
      action.index :
    action instanceof Shell.Action.Focus ?
      indexByID(state, action.id) :
    action instanceof Shell.Action.Focused ?
      indexByID(state, action.id) :
    state.selected;

  // Transformers

  const open = (state, uri, isFocused=true) => state.merge({
    nextID: state.nextID + 1,
    selected: isFocused ? state.entries.size : state.selected,

    loader: state.loader.push(Loader.Model({uri, id: String(state.nextID)})),
    shell: state.shell.push(Shell.Model({isFocused})),
    page: state.page.push(Page.Model()),
    progress: state.progress.push(Progress.Model()),
    navigation: state.navigation.push(Navigation.Model()),
    security: state.security.push(Security.Model())
  });

  const close = (state, id, index=indexByID(state, id)) =>
    index === null ? state :
    state.merge({
      selected: null,

      loader: state.loader.remove(index),
      shell: state.shell.remove(index),
      page: state.page.remove(index),
      progress: state.progress.remove(index),
      navigation: state.navigation.remove(index),
      security: state.security.remove(index)
    });

   const modify = (state, action) => {
     const index = indexByID(state, action.id);
     const {loader, shell, page, progress, navigation, security} = state;
     return index === null ? state : state.merge({
      selected: select(state, action),

      loader: loader.set(index, Loader.update(loader.get(index), action)),
      shell: shell.set(index, Shell.update(shell.get(index), action)),
      page: page.set(index, Page.update(page.get(index), action)),
      progress: progress.set(index, Progress.update(progress.get(index), action)),
      navigation: navigation.set(index, Navigation.update(navigation.get(index), action)),
      security: security.set(index, Security.update(security.get(index), action))
    });
  };

  const load = (state, action) => {
    const index = indexByID(state, action.id);
    const loader = state.loader.get(index);
    return !loader ? open(state, action.uri) :
           URI.getOrigin(loader.uri) !== URI.getOrigin(action.uri) ?
            open(state, action.uri) :
           modify(state, action)
  };

  // Update

  const {Load} = Loader.Action;

  const update = (state, action) =>
    action instanceof Load ?
      load(state, action) :
    action instanceof Open ?
      open(state, action.uri) :
    action instanceof OpenInBackground ?
      open(state, action.uri, false) :
    action instanceof Close ?
      close(state, action.id) :
    Action.isTypeOf(action) ?
      modify(state, action) :
    state;
  exports.update = update;


  // View

  const style = StyleSheet.create({
    base: {
      position: 'absoulte',
      display: 'block',
      height: 'calc(100vh - 28px)',
      MozUserSelect: 'none',
      width: '100vw',
      backgroundColor: '#fff'
    },
    active: {},
    inactive: {
      display: 'none'
    },
    passive: {
      zIndex: -1,
      display: 'block !important',
      position: 'absolute',
      left: 0
    }
  });

  const viewWebView = (loader, shell, thumbnail, isSelected, address) => {
    // Do not render anything unless viewer has an `uri`
    if (!loader.uri) return null;

    const action = address.pass(Event, loader);
    const location = URI.resolve(loader.uri);

    return IFrame.view({
      id: `web-view-${loader.id}`,
      uri: location,
      className: `web-view ${isSelected ? 'selected' : ''}`,
      // This is a workaround for Bug #266 that prevents capturing
      // screenshots if iframe or it's ancesstors have `display: none`.
      // Until that's fixed on platform we just hide such elements with
      // negative index and absolute position.
      style: Style(style.base,
                   isSelected ? style.active :
                   !thumbnail ? style.passive :
                   style.inactive),
      mozbrowser: true,
      remote: true,
      mozapp: URI.isPrivileged(location) ? URI.getManifestURL().href : null,
      mozallowfullscreen: true,
      isVisible: isSelected,
      zoom: shell.zoom,

      isFocused: shell.isFocused,

      onCanGoBackChange: action,
      onCanGoForwardChange: action,
      onBlur: action,
      onFocus: action,
      // onAsyncScroll: action
      onClose: action,
      onOpenWindow: action,
      onOpenTab: action,
      onMenu: action,
      onError: action,
      onLoadStart: action,
      onLoadEnd: action,
      onLoadProgressChange: action,
      onLocationChange: action,
      onMetaChange: action,
      onIconChange: action,
      onLocationChange: action,
      onSecurityChange: action,
      onTitleChange: action,
      onPrompt: action,
      onAuthentificate: action,
      onScrollAreaChange: action,
      onLoadProgressChange: action
    });
  };
  exports.viewWebView = viewWebView;

  const view = (loader, shell, page, address, selected, isActive) => {
    return html.div({
      key: 'web-views',
      style: {
        transform: `scale(${isActive ? 1 : 0})`
      },
    }, loader.map((loader, index) =>
      render(`web-view@${loader.id}`, viewWebView,
             loader,
             shell.get(index),
             page.get(index).thumbnail,
             index === selected,
             address)));
  };
  exports.view = view;

  // Actions that web-view produces but `update` does not handles.

  const Failure = Record({
    id: String,
    detail: Any
  }, 'WebView.Failure');
  exports.Failure = Failure;

  const ContextMenu = Record({
    id: String,
  }, 'WebView.ContextMenu');
  exports.ContextMenu = ContextMenu;

  const ModalPrompt = Record({
    id: String
  }, 'WebView.ModalPrompt');
  exports.ModalPrompt = ModalPrompt;

  const Authentificate = Record({
    id: String,
  }, 'WebView.Authentificate');
  exports.Authentificate = Authentificate;


  const Event = (...args) => {
    const event = args[args.length -1];
    return Event[event.type](...args);
  };

  const {LocationChange} = Loader.Action;
  Event.mozbrowserlocationchange = ({id}, {detail: uri}) =>
    LocationChange({id, uri});

  // TODO: Figure out what's in detail
  Event.mozbrowserclose = ({id}, {detail}) =>
    Close({id});

  Event.mozbrowseropenwindow = ({id}, {detail}) =>
    Open({id,
          uri: detail.url,
          name: detail.name,
          features: detail.features});

  Event.mozbrowseropentab = ({id}, {detail}) =>
    OpenInBackground({id, uri: detail.uri});

  // TODO: Figure out what's in detail
  Event.mozbrowsercontextmenu = ({id}, {detail}) =>
    ContextMenu({id});

  // TODO: Figure out what's in detail
  Event.mozbrowsershowmodalprompt = ({id}, {detail}) =>
    ModalPrompt({id});

  // TODO: Figure out what's in detail
  Event.mozbrowserusernameandpasswordrequired = ({id}, {detail}) =>
    Athentificate({id});

  // TODO: Figure out what's in detail
  Event.mozbrowsererror = ({id}, {detail}) =>
    Failure({id, detail});


  const {Focused, Blured} = Shell.Action;

  Event.focus = ({id}) =>
    Focused({id});

  Event.blur = ({id}) =>
    Blured({id});


  const {CanGoBackChange, CanGoForwardChange} = Navigation.Action;

  Event.mozbrowsergobackchanged = ({id}, {detail: value}) =>
    CanGoBackChange({id, value});

  Event.mozbrowsergoforwardchanged = ({id}, {detail: value}) =>
    CanGoForwardChange({id, value});


  const {LoadStart, LoadEnd, LoadProgress} = Progress.Action;

  Event.mozbrowserloadstart = ({id, uri}, {timeStamp}) =>
    LoadStart({id, uri, timeStamp: performance.now()});

  Event.mozbrowserloadend = ({id, uri}, {timeStamp}) =>
    LoadEnd({id, uri, timeStamp: performance.now()});

  Event.mozbrowserloadprogresschanged = ({id}, {timeStamp}) =>
    LoadProgress({id, timeStamp: performance.now()});

  const {TitleChange, IconChange, MetaChange, OverflowChange, Scroll} = Page.Action;

  Event.mozbrowsertitlechange = ({id, uri}, {detail: title}) =>
    TitleChange({id, uri, title});

  Event.mozbrowsericonchange = ({id, uri}, {detail: {href: icon}}) =>
    IconChange({id, uri, icon});

  Event.mozbrowsermetachange = ({id}, {detail: {content, name}}) =>
    MetaChange({id, content, name});

  // TODO: Figure out what's in detail
  Event.mozbrowserasyncscroll = ({id}, {detail}) =>
    Scroll({id});

  Event.mozbrowserscrollareachanged = ({id}, {target, detail}) =>
    OverflowChange({
      id,
      overflow: detail.height > target.parentNode.clientHeight
    });


  const {SecurityChange} = Security.Action;

  Event.mozbrowsersecuritychange = ({id}, {detail}) =>
    SecurityChange({
      id,
      state: detail.state,
      extendedValidation: detail.extendedValidation
    });
});
