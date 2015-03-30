/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Component = require('omniscient');
  const {DOM} = require('react');
  const {compose, throttle, curry} = require('lang/functional');
  const {NavigationPanel} = require('./navigation-panel');
  const {Awesomebar} = require('./awesomebar');
  const {WebViewer} = require('./web-viewer');
  const {Tab} = require('./page-switch');
  const {Dashboard} = require('./dashboard');
  const {readDashboardNavigationTheme} = require('./dashboard/actions');
  const {Element, Event, VirtualAttribute, Attribute} = require('./element');
  const {select: selectField} = require('./editable');
  const {KeyBindings} = require('./keyboard');
  const {zoomIn, zoomOut, zoomReset, open,
         goBack, goForward, reload, stop, title} = require('./web-viewer/actions');
  const {focus, activate: activateStrip, readInputURL, sendEventToChrome,
         deactivate, writeSession, resetSession, resetSelected} = require('./actions');
  const {indexOfSelected, indexOfActive, isActive, active, selected,
         selectNext, selectPrevious, select, activate,
         reorder, reset, remove, insertBefore,
         isntPinned, isPinned} = require('./deck/actions');
  const {readTheme} = require('./theme');
  const ClassSet = require('./util/class-set');
  const os = require('os');

  const editWith = edit => submit => submit(edit);


  const getOwnerWindow = node => node.ownerDocument.defaultView;
  // Define custom `main` element with a custom `scrollGrab` attribute
  // that maps to same named proprety.
  const Main = Element('main', {
    windowTitle: VirtualAttribute((node, current, past) => {
      node.ownerDocument.title = current;
    }),
    scrollGrab: VirtualAttribute((node, current, past) => {
      node.scrollgrab = current;
    }),
    onDocumentFocus: Event('focus', getOwnerWindow),
    onDocumentBlur: Event('blur', getOwnerWindow),
    onDocumentKeyDown: Event('keydown', getOwnerWindow),
    onDocumentKeyUp: Event('keyup', getOwnerWindow),
    onDocumentUnload: Event('unload', getOwnerWindow),
    onAppUpdateAvailable: Event('app-update-available', getOwnerWindow),
    onRuntimeUpdateAvailable: Event('runtime-update-available', getOwnerWindow)
  });

  const onNavigation = KeyBindings({
    'accel l': editWith(compose(selectField(), focus)),
    'accel t': editWith(focus)
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

  let onViewerBinding;
  {
    const modifier = os.platform() == 'linux' ? 'alt' : 'accel';

    onViewerBinding = KeyBindings({
      'accel =': editWith(zoomIn),
      'accel -': editWith(zoomOut),
      'accel 0': editWith(zoomReset),
      [`${modifier} left`]: editWith(goBack),
      [`${modifier} right`]: editWith(goForward),
      'escape': editWith(stop),
      'accel r': editWith(reload),
      'F5': editWith(reload),
    });
  };

  const loadURI = (uri, viewer) => viewers => {
    const target = viewer || active(viewers);
    return viewers.mergeIn([viewers.indexOf(target)],
                           {uri, isFocused: true});
  }

  const openTab = uri => items =>
    insertBefore(items, open({uri,
                              isSelected: true,
                              isFocused: true,
                              isActive: true}),
                 isntPinned);

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
    to ? activate(select(items, to)) : items;

  switchTab.toIndex = index => items => switchTab(items, items.get(index));
  switchTab.toLast = items => switchTab(items, items.last());
  switchTab.toDashboard = switchTab.toIndex(0);


  let onTabSwitch;
  {
    const modifier = os.platform() == 'darwin' ? 'meta' : 'alt';

    onTabSwitch = KeyBindings({
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
  };

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
      state.updateIn('webViewers', openTab(`data:application/json,${JSON.stringify(root, null, 2)}`)))
  });

  const In = (...path) => edit => state =>
    state.updateIn(path, edit);

  // Browser is a root component for our application that just delegates
  // to a core sub-components here.
  const Browser = Component('Browser', (state, {step: edit}) => {
    const webViewers = state.get('webViewers');

    const editViewers = compose(edit, In('webViewers'));
    const editSelectedViewer = compose(edit, In('webViewers',
                                                indexOfSelected(webViewers)));
    const editTabStrip = compose(edit, In('tabStrip'));
    const editInput = compose(edit, In('input'));
    const editRfa = compose(edit, In('rfa'));
    const editDashboard = compose(edit, In('dashboard'));
    const editSuggestions = compose(edit, In('suggestions'));

    const selectedWebViewer = selected(webViewers);
    const activeWebViewer = active(webViewers);
    const tabStrip = state.get('tabStrip');
    const input = state.get('input');
    const rfa = state.get('rfa');
    const dashboard = state.get('dashboard');
    const suggestions = state.get('suggestions');


    const isDashboardActive = activeWebViewer.get('uri') === null;
    const isAwesomebarActive = input.get('isFocused');
    const isTabStripActive = tabStrip.get('isActive');

    const isTabStripVisible = isDashboardActive ||
                              (isTabStripActive && !isAwesomebarActive);

    const isTabstripkillzoneVisible = (
      // Show when tabstrip is visible, except on dashboard
      (isTabStripActive && !isDashboardActive) ||
      // Also show when Awesomebar is active
      isAwesomebarActive
    );

    const theme = isDashboardActive ?
      readDashboardNavigationTheme(dashboard) :
      Browser.readTheme(activeWebViewer);


    return DOM.div({
      key: 'root',
    }, [Main({
      key: 'main',
      windowTitle: title(selectedWebViewer),
      scrollGrab: true,
      className: ClassSet({
        'moz-noscrollbars': true,
        isdark: theme.isDark,
        windowFocused: state.get('isDocumentFocused'),
        showtabstrip: isTabStripVisible,
        scrollable: !input.get('isFocused') && !isTabStripVisible
      }),
      onDocumentUnload: event => writeSession(state),
      onDocumentFocus: event => state.set('isDocumentFocused', true),
      onDocumentBlur: event => state.set('isDocumentFocused', false),
      onDocumentKeyDown: compose(onNavigation(editInput),
                                 onTabStripKeyDown(editTabStrip),
                                 onViewerBinding(editSelectedViewer),
                                 onDeckBinding(editViewers),
                                 onTabSwitch(editViewers),
                                 onBrowserBinding(edit)),
      onDocumentKeyUp: compose(onTabStripKeyUp(editTabStrip),
                               onDeckBindingRelease(editViewers)),
      onAppUpdateAvailable: event =>
        edit(state => state.set('appUpdateAvailable', true)),
      onRuntimeUpdateAvailable: event =>
        edit(state => state.set('runtimeUpdateAvailable', true)),
    }, [
      NavigationPanel({
        key: 'navigation',
        input,
        tabStrip,
        theme,
        rfa,
        suggestions,
        webViewer: selectedWebViewer,
      }, {
        onNavigate: location => editViewers(navigateTo(location)),
        editTabStrip,
        editSelectedViewer,
        editRfa,
        editInput,
        editSuggestions
      }),
      DOM.div({key: 'tabstrip',
               style: theme.tabstrip,
               className: 'tabstripcontainer'}, [
        Tab.Deck({
          key: 'tabstrip',
          className: 'tabstrip',
          items: webViewers,
          In
        }, {
          onMouseLeave: event => editViewers(compose(reorder, reset)),
          onSelect: item => editViewers(items => select(items, item)),
          onActivate: _ => editViewers(activate),
          onClose: id => editViewers(closeTab(id)),
          edit: editViewers
        })
      ]),
      Awesomebar({
        key: 'awesomebar',
        suggestions,
        input,
        isAwesomebarActive,
        theme
      }, {
        onOpen: uri => editViewers(navigateTo(uri))
      }),
      DOM.div({
        key: 'tabstripkillzone',
        className: ClassSet({
          tabstripkillzone: true,
          'tabstripkillzone-hidden': !isTabstripkillzoneVisible
        }),
        onMouseEnter: event => editTabStrip(deactivate)
      }),
      Dashboard({
        key: 'dashboard',
        dashboard,
        hidden: !isDashboardActive
      }, {
        onOpen: uri => editViewers(openTab(uri)),
        edit: editDashboard
      }),
      WebViewer.Deck({
        key: 'web-viewers',
        className: 'iframes',
        hidden: isDashboardActive,
        items: webViewers,
        In
      }, {
        onClose: id => editViewers(closeTab(id)),
        onOpen: uri => editViewers(openTab(uri)),
        edit: editViewers
      })
    ]),
    DOM.div({
      key: 'appUpdateBanner',
      className: ClassSet({
        appupdatebanner: true,
        active: state.get('appUpdateAvailable') ||
                state.get('runtimeUpdateAvailable')
      }),
    }, [
      'Hey! An update just for you!',
      DOM.div({
        key: 'appUpdateButton',
        className: 'appupdatebutton',
        onClick: e => {
          if (state.get('runtimeUpdateAvailable') && state.get('appUpdateAvailable')) {
            // FIXME: Not supported yet
            sendEventToChrome('clear-cache-and-restart')
          }
          if (state.get('runtimeUpdateAvailable') && !state.get('appUpdateAvailable')) {
            // FIXME: Not supported yet
            sendEventToChrome('restart')
          }
          if (!state.get('runtimeUpdateAvailable') && state.get('appUpdateAvailable')) {
            sendEventToChrome('clear-cache-and-reload')
          }
        }
      }, 'Apply' + (state.get('runtimeUpdateAvailable') ? ' (restart required)' : ''))
    ])]);
  })
  // Create a version of readTheme that will return from cache
  // on repeating calls with an equal cursor.
  Browser.readTheme = Component.cached(readTheme);

  // Exports:

  exports.Main = Main;
  exports.Browser = Browser;

});
