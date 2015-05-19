/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Component = require('omniscient');
  const {DOM} = require('react');
  const {compose} = require('lang/functional');
  const {Editable} = require('common/editable');
  const {KeyBindings} = require('common/keyboard');
  const ClassSet = require('common/class-set');
  const {mix} = require('common/style');
  const os = require('common/os');
  const {WindowBar} = require('./window-bar');
  const {LocationBar} = require('./location-bar');
  const {Suggestions} = require('./suggestion-box');
  const {Previews} = require('./preview-box');
  const {WebViewBox, WebView} = require('./web-view');
  const {Dashboard} = require('./dashboard');
  const {readDashboardNavigationTheme} = require('./dashboard/actions');
  const {activate: activateStrip, readInputURL,
         deactivate, writeSession, resetSession, resetSelected} = require('./actions');
  const {indexOfSelected, indexOfActive, isActive, active, selected,
         selectNext, selectPrevious, select, activate,
         reorder, reset, remove, insertBefore,
         isntPinned, isPinned} = require('./deck/actions');
  const {readTheme} = require('./theme');
  const {Main} = require('./main');
  const {Updates} = require('./update-banner');
  const {History, Page} = require('common/history');

  const editWith = edit => {
    if (typeof (edit) !== 'function') {
      throw TypeError('Must be a function')
    }
    return submit => submit(edit);
  }

  const onNavigation = KeyBindings({
    'accel l': editWith(LocationBar.enter),
    'accel t': editWith(Editable.focus)
  });

  const onTabStripKeyDown = KeyBindings({
    'control tab': editWith(activateStrip),
    'control shift tab': editWith(activateStrip),
    'meta shift ]': editWith(activateStrip),
    'meta shift [': editWith(activateStrip),
    'meta t': editWith(activateStrip),
  });
  const onTabStripKeyUp = KeyBindings({
    'control': editWith(deactivate),
    'meta': editWith(deactivate)
  });

  const onViewerBinding = (() => {
    const modifier = os.platform() == 'linux' ? 'alt' : 'accel';
    return KeyBindings({
      'accel =': editWith(WebView.zoomIn),
      'accel -': editWith(WebView.zoomOut),
      'accel 0': editWith(WebView.zoomReset),
      [`${modifier} left`]: editWith(WebView.goBack),
      [`${modifier} right`]: editWith(WebView.goForward),
      'escape': editWith(WebView.stop),
      'accel r': editWith(WebView.reload),
      'F5': editWith(WebView.reload),
    });
  })();

  const loadURI = (uri, viewer) => viewers => {
    const target = viewer || active(viewers);
    return viewers.mergeIn([viewers.indexOf(target)],
                           {uri, isFocused: true});
  }

  const openTab = uri => items =>
    insertBefore(items,
                 WebView.open({uri,
                               isSelected: true,
                               isFocused: true,
                               isActive: true}),
                 isntPinned);

  const openTabBg = uri => items =>
    insertBefore(items, WebView.open({uri}), isntPinned);

  const clearActiveInput = viewers =>
    viewers.setIn([indexOfActive(viewers), 'userInput'], '');

  const navigateTo = location => viewers => {
    const uri = readInputURL(location);
    const navigate = !isPinned(active(viewers)) ? loadURI(uri) :
                     compose(openTab(uri), clearActiveInput);

    return navigate(viewers);
  };

  // If closing viewer, replace it with a fresh one & select it.
  // This avoids code branching down the pipe that otherwise will
  // need to deal with 0 viewer & no active viewer case.
  const close = p => items =>
    !isPinned(items.find(p)) ? remove(items, p) : items;

  const closeTab = id =>
    close(x => x.get('id') == id);


  const switchTab = (items, to) =>
    to ? activate(select(items, tab => tab === to)) : items;

  switchTab.toIndex = index => items => switchTab(items, items.get(index));
  switchTab.toLast = items => switchTab(items, items.last());
  switchTab.toDashboard = switchTab.toIndex(0);


  const onTabSwitch = (() => {
    const modifier = os.platform() == 'darwin' ? 'meta' : 'alt';
    return KeyBindings({
      [`${modifier} 1`]: editWith(switchTab.toIndex(1)),
      [`${modifier} 2`]: editWith(switchTab.toIndex(2)),
      [`${modifier} 3`]: editWith(switchTab.toIndex(3)),
      [`${modifier} 4`]: editWith(switchTab.toIndex(4)),
      [`${modifier} 5`]: editWith(switchTab.toIndex(5)),
      [`${modifier} 6`]: editWith(switchTab.toIndex(6)),
      [`${modifier} 7`]: editWith(switchTab.toIndex(7)),
      [`${modifier} 8`]: editWith(switchTab.toIndex(8)),
      [`${modifier} 9`]: editWith(switchTab.toLast),
    });
  })();

  const onDeckBinding = KeyBindings({
    'accel t': editWith(switchTab.toDashboard),
    'accel w': editWith(close(isActive)),
    'control tab': editWith(selectNext),
    'control shift tab': editWith(selectPrevious),
    'meta shift ]': editWith(selectNext),
    'meta shift [': editWith(selectPrevious),
    'ctrl pagedown': editWith(selectNext),
    'ctrl pageup': editWith(selectPrevious),
  });

  const onDeckBindingRelease = KeyBindings({
    'control': editWith(compose(reorder, activate)),
    'meta': editWith(compose(reorder, activate))
  });

  const onBrowserBinding = KeyBindings({
    'accel shift backspace': editWith(resetSession),
    'accel shift s': editWith(writeSession),
    'accel u': edit => edit(state =>
      state.updateIn('webViews', openTab(`data:application/json,${JSON.stringify(root, null, 2)}`)))
  });

  const In = (...path) => edit => state =>
    state.updateIn(path, edit);

  // CSS

  const styleMain = {
    height: '100vh',
    width: '100vw',
    color: 'black',
    overflowY: 'scroll',
    scrollSnapType: 'mandatory',
    scrollSnapDestination: '0 0',
    position: 'relative'
  };


  // History API hooks
  const history = new History({trackTopPages: true});

  const beginVisit = ({webView, time}) => {
    history.edit(Page.from(webView), Page.beginVisit({id: webView.id, time}));
  };

  const endVisit = ({webView, time}) => {
    history.edit(Page.from(webView), Page.endVisit({id: webView.id, time}));
  };

  const changeTitle = ({webView, title}) => {
    history.edit(Page.from(webView), page => page.set('title', title));
  };

  const changeImage = ({webView, image}) => {
    history.edit(Page.from(webView), page => page.set('image', image));
  };

  const changeIcon = ({webView, icon}) => {
    history.edit(Page.from(webView), page => page.set('icon', icon))
  };



  // Browser is a root component for our application that just delegates
  // to a core sub-components here.
  const Browser = Component('Browser', (state, {step: edit}) => {
    const webViews = state.get('webViews');

    const editWebViews = compose(edit, In('webViews'));
    const editSelectedWebView = compose(edit, In('webViews',
                                                indexOfSelected(webViews)));
    const editTabStrip = compose(edit, In('tabStrip'));
    const editInput = compose(edit, In('input'));
    const editRfa = compose(edit, In('rfa'));
    const editDashboard = compose(edit, In('dashboard'));
    const editSuggestions = compose(edit, In('suggestions'));
    const editUpdates = compose(edit, In('updates'));

    const selectedWebView = selected(webViews);
    const activeWebView = active(webViews);
    const tabStrip = state.get('tabStrip');
    const input = state.get('input');
    const rfa = state.get('rfa');
    const dashboard = state.get('dashboard');
    const suggestions = state.get('suggestions');
    const isDocumentFocused = state.get('isDocumentFocused');
    const updates = state.get('updates');

    const isDashboardActive = activeWebView.get('uri') === null;
    const isLocationBarActive = input.get('isFocused');
    const isTabStripActive = tabStrip.get('isActive');

    const isTabStripVisible = isDashboardActive ||
                              (isTabStripActive && !isLocationBarActive);

    const isTabstripkillzoneVisible = (
      // Show when tabstrip is visible, except on dashboard
      (isTabStripActive && !isDashboardActive) ||
      // Also show when Awesomebar is active
      isLocationBarActive
    );

    const theme = isDashboardActive ?
      readDashboardNavigationTheme(dashboard) :
      Browser.readTheme(activeWebView);

    return DOM.div({
      key: 'root',
    }, [Main({
      key: 'main',
      windowTitle: selectedWebView.title || selectedWebView.uri,
      scrollGrab: true,
      style: mix(styleMain,
                 (input.get('isFocused') || isTabStripVisible) ?
                   {overflowY: 'hidden'} : {}),
      className: ClassSet({
        'moz-noscrollbars': true,
        showtabstrip: isTabStripVisible,
      }),
      onDocumentUnload: event => writeSession(state),
      onDocumentFocus: event => edit(state => state.set('isDocumentFocused', true)),
      onDocumentBlur: event => edit(state => state.set('isDocumentFocused', false)),
      onDocumentKeyDown: compose(onNavigation(editInput),
                                 onTabStripKeyDown(editTabStrip),
                                 onViewerBinding(editSelectedWebView),
                                 onDeckBinding(editWebViews),
                                 onTabSwitch(editWebViews),
                                 onBrowserBinding(edit)),
      onDocumentKeyUp: compose(onTabStripKeyUp(editTabStrip),
                               onDeckBindingRelease(editWebViews)),
      onAppUpdateAvailable: event => editUpdates(Updates.setAppUpdateAvailable),
      onRuntimeUpdateAvailable: event => editUpdates(Updates.setRuntimeUpdateAvailable),
      onOpenWindow: event => editWebViews(openTab(event.detail.url))
    }, [
      WindowBar({
        key: 'navigation',
        input,
        tabStrip,
        theme,
        rfa,
        suggestions,
        isDocumentFocused,
        webView: selectedWebView,
      }, {
        onNavigate: location => editWebViews(navigateTo(location)),
        editTabStrip,
        editSelectedWebView,
        editRfa,
        editInput,
        editSuggestions
      }),
      Previews.render(Previews({
        items: webViews,
        theme
      }), {
        onMouseLeave: event => editWebViews(compose(reorder, reset)),
        onSelect: id => editWebViews(items => select(items, item => item.get('id') == id)),
        onActivate: id => editWebViews(items => activate(items, item => item.get('id') == id)),
        onClose: id => editWebViews(closeTab(id)),
        edit: editWebViews,
        theme
      }),
      Suggestions.render({
        key: 'awesomebar',
        isLocationBarActive,
        suggestions,
        theme
      }, {
        onOpen: uri => editWebViews(navigateTo(uri))
      }),
      DOM.div({
        key: 'tabstripkillzone',
        className: ClassSet({
          tabstripkillzone: true,
          'tabstripkillzone-hidden': !isTabstripkillzoneVisible
        }),
        onMouseEnter: event => {
          editWebViews(reset);
          editTabStrip(deactivate);
        }
      }),
      Dashboard({
        key: 'dashboard',
        dashboard,
        hidden: !isDashboardActive
      }, {
        onOpen: uri => editWebViews(openTab(uri)),
        edit: editDashboard
      }),
      WebViewBox.render('web-view-box', WebViewBox({
        isActive: !isDashboardActive,
        items: webViews,
      }), {
        beginVisit, endVisit, changeIcon, changeTitle, changeImage,
        onClose: id => editWebViews(closeTab(id)),
        onOpen: uri => editWebViews(openTab(uri)),
        onOpenBg: uri => editWebViews(openTabBg(uri)),
        edit: editWebViews
      })
    ]),
    Updates.render({key: 'updates-banner', updates})
    ]);
  })
  // Create a version of readTheme that will return from cache
  // on repeating calls with an equal cursor.
  Browser.readTheme = Component.cached(readTheme);

  // Exports:

  exports.Browser = Browser;

});
