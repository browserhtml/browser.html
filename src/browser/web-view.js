/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, Union, List, Maybe, Any} = require('common/typed');
  const {html} = require('reflex');
  const {mix} = require('common/style');
  const URI = require('common/url-helper');
  const Editable = require('common/editable');
  const Focusable = require('common/focusable');
  const IFrame = require('./iframe');
  const Progress = require('./progress-bar');
  const Shell = require('./web-shell');
  const Navigation = require('./web-navigation');
  const Security = require('./web-security');
  const Input = require('./web-input');
  const Page = require('./web-page');
  const Suggestions = require('./suggestion-box');
  const Loader = require('./web-loader');

  // Model
  const Model = Record({
    id: String,
    uri: Maybe(String),
    input: Input.Model,
    security: Security.Model,
    navigation: Navigation.Model,
    progress: Progress.Model,
    page: Page.Model,
    shell: Shell.Model,
    suggestions: Suggestions.Model
  });
  exports.Model = Model;

  // Returns subset of the model which can be restored acrosse sessions.
  const persistent = state =>
    state.remove('progress')
         .removeIn(['page', 'thumbnail'])
         .remove('navigation')
         .remove('security');
  exports.persistent = persistent;


  // Actions

  // All actions that `WebView.update` handles have a an `id` field that refers
  // to the `id` of the `WebView`. As a matter of fact those actions are routed
  // by `WebViews` which is what `id` field needed for. Default `id` is set to
  // `@selected` that and `@previewed` which refer to currently selected /
  // previewed WebView. These actions in fact would have being defined on the
  // `WebViews` instead but that would coused cyrcular dependncy there for we
  // define them here and use them from `WebViews` instead.



  const {Load, LocationChange} = Loader.Action;

  const Action = Union({
    Load, LocationChange,
    Navigation: Navigation.Action,
    Security: Security.Action,
    Progress: Progress.Action,
    Page: Page.Action,
    Shell: Shell.Action,
    Input: Input.Action,
    Suggestions: Suggestions.Action
  });
  exports.Action = Action;


  // Update

  const load = (state, uri=state.input.value) => Model({
    uri,
    input: uri !== state.uri ? state.input.clear('value') : state.input,
    id: state.id,
    shell: state.shell.set('isFocused', true)
  });
  exports.load = load;

  const update = (state, action) =>
    action instanceof Load ? load(state, action.uri) :
    action instanceof LocationChange ?
      state.merge({uri: action.uri,
                   input: state.id === 'about:dashboard' ? state.input :
                          state.input.set('value', action.uri)
                  }) :
    action instanceof Shell.Action.Focus ?
      state.merge({shell: Shell.update(state.shell, action),
                   input: state.id === 'about:dashboard' ? state.input :
                          state.input.set('value', state.uri)}) :
    Input.Action.isTypeOf(action) ?
      state.set('input', Input.update(state.input, action)) :
    Navigation.Action.isTypeOf(action) ?
      state.set('navigation', Navigation.update(state.navigation, action)) :
    Progress.Action.isTypeOf(action) ?
      state.merge({
        progress: Progress.update(state.progress, action),
        navigation: action instanceof LoadStart ? state.navigation.clear() :
                    state.navigation
      }) :
    Shell.Action.isTypeOf(action) ?
      state.set('shell', Shell.update(state.shell, action)) :
    Security.Action.isTypeOf(action) ?
      state.set('security', Security.update(state.security, action)) :
    Page.Action.isTypeOf(action) ?
      state.set('page', Page.update(state.page, action)) :
    Suggestions.Action.isTypeOf(action) ?
      state.set('suggestions', Suggestions.update(state.suggestions, action)) :
    state;

  exports.update = update;


  // View

  const base = {
    display: 'block',
    height: 'calc(100vh - 28px)',
    MozUserSelect: 'none',
    width: '100vw',
    backgroundColor: '#fff'
  };

  const offScreen = {
    zIndex: -1,
    display: 'block !important',
    position: 'absolute',
    left: 0
  };

  const hidden = {
    display: 'none'
  };

  const view = (id, uri, shell, page, navigation, isSelected, address) => {
    // Do not render anything unless viewer has an `uri`
    if (!uri) return null;

    console.log('render web-view')

    const style = base;

    const action = address.pass(Event, {id, uri});
    const location = URI.resolve(uri);

    return IFrame.view({
      id: `web-view-${id}`,
      // This is a workaround for Bug #266 that prevents capturing
      // screenshots if iframe or it's ancesstors have `display: none`.
      // Until that's fixed on platform we just hide such elements with
      // negative index and absolute position.
      style: isSelected ? style :
             !page.thumbnail ? mix(style, offScreen) :
             mix(style, hidden),
      isBrowser: true,
      isRemote: true,
      mozApp: URI.isPrivileged(location) ? URI.getManifestURL().href : null,
      allowFullScreen: true,
      isVisible: isSelected,
      zoom: shell.zoom,
      isFocused: shell.isFocused,
      uri: location,
      readyState: navigation.state,

      onCanGoBackChange: action,
      onCanGoForwardChange: action,
      onBlur: action,
      onFocus: action,
      // onAsyncScroll: action
      onClose: action,
      onOpenWindow: action,
      onOpenTab: action,
      onContextMenu: action,
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
  exports.view = view;


  // Actions that web-view produces but `update` does not handles.


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


  const {Focus, Blur} = Shell.Action;

  Event.focus = ({id}) =>
    Focus({id});

  Event.blur = ({id}) =>
    Blur({id});


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
