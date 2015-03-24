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
  const {getDashboardThemePatch,
         readDashboardNavigationTheme} = require('./dashboard/actions');
  const {Element, Event, VirtualAttribute, Attribute} = require('./element');
  const {select: selectField} = require('./editable');
  const {KeyBindings} = require('./keyboard');
  const {zoomIn, zoomOut, zoomReset, open,
         goBack, goForward, reload, stop, title} = require('./web-viewer/actions');
  const {focus, showTabStrip, hideTabStrip, readInputURL, sendEventToChrome,
         writeSession, resetSession, resetSelected} = require('./actions');
  const {indexOfSelected, indexOfActive, isActive,
         selectNext, selectPrevious, select, activate,
         reorder, reset, remove, insertBefore,
         isntPinned, isPinned} = require('./deck/actions');
  const {readTheme} = require('./theme');
  const ClassSet = require('./util/class-set');
  const os = require('os');

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
    'accel l': compose(selectField, focus),
    'accel t': focus
  });

  const onTabStripKeyDown = KeyBindings({
    'control tab': showTabStrip,
    'control shift tab': showTabStrip,
    'meta shift ]': showTabStrip,
    'meta shift [': showTabStrip,
    'meta t': showTabStrip,
  });
  const onTabStripKeyUp = KeyBindings({
    'control': hideTabStrip,
    'meta': hideTabStrip
  });

  let onViewerBinding;
  {
    const modifier = os.platform() == 'linux' ? 'alt' : 'accel';

    onViewerBinding = KeyBindings({
      'accel =': zoomIn,
      'accel -': zoomOut,
      'accel 0': zoomReset,
      [`${modifier} left`]: goBack,
      [`${modifier} right`]: goForward,
      'escape': stop,
      'accel r': reload,
      'F5': reload,
    });
  };

  const openTab = uri => items =>
    insertBefore(items, open({uri,
                              isSelected: true,
                              isFocused: true,
                              isActive: true}),
                 isntPinned);

  const navigateTo = (webViewersCursor, webViewerCursor) => location => {
    const uri = readInputURL(location);
    if (isPinned(webViewerCursor)) {
      webViewersCursor.update(openTab(uri));
      webViewerCursor.set('userInput', '');
    } else {
      webViewerCursor.merge({uri, isFocused: true});
    }
  }


  const loadURI = curry((webViewer, uri) =>
    webViewer.merge({uri, isFocused: true}));

  // If closing viewer, replace it with a fresh one & select it.
  // This avoids code branching down the pipe that otherwise will
  // need to deal with 0 viewer & no active viewer case.
  const close = p => items =>
    !isPinned(items.find(p)) ? remove(items, p) : items;

  const closeTab = id =>
    close(x => x.get('id') == id);


  const edit = edit => cursor => cursor.update(edit);

  const onSelectNext = throttle(edit(selectNext), 200)
  const onSelectPrevious = throttle(edit(selectPrevious), 200);

  const switchTab = (items, to) =>
    to ? activate(select(items, to)) : items;

  switchTab.toIndex = index => items => switchTab(items, items.get(index));
  switchTab.toLast = items => switchTab(items, items.last());
  switchTab.toDashboard = switchTab.toIndex(0);


  let onTabSwitch;
  {
    const modifier = os.platform() == 'darwin' ? 'meta' : 'alt';

    onTabSwitch = KeyBindings({
      [`${modifier} 0`]: edit(switchTab.toIndex(0)),
      [`${modifier} 1`]: edit(switchTab.toIndex(1)),
      [`${modifier} 2`]: edit(switchTab.toIndex(2)),
      [`${modifier} 3`]: edit(switchTab.toIndex(3)),
      [`${modifier} 4`]: edit(switchTab.toIndex(4)),
      [`${modifier} 5`]: edit(switchTab.toIndex(5)),
      [`${modifier} 6`]: edit(switchTab.toIndex(6)),
      [`${modifier} 7`]: edit(switchTab.toIndex(7)),
      [`${modifier} 8`]: edit(switchTab.toIndex(8)),
      [`${modifier} 9`]: edit(switchTab.toLast),
    });
  };

  const onDeckBinding = KeyBindings({
    'accel t': edit(switchTab.toDashboard),
    'accel w': edit(close(isActive)),
    'control tab': onSelectNext,
    'control shift tab': onSelectPrevious,
    'meta shift ]':onSelectNext,
    'meta shift [': onSelectPrevious,
    'ctrl pagedown': onSelectNext,
    'ctrl pageup': onSelectPrevious,
  });

  const onDeckBindingRelease = KeyBindings({
    'control': edit(compose(reorder, activate)),
    'meta': edit(compose(reorder, activate))
  });

  const onBrowserBinding = KeyBindings({
    'accel shift backspace': edit(resetSession),
    'accel shift s': writeSession,
    'accel u': root =>
      root.cursor('webViewers').update(openTab(`data:application/json,${JSON.stringify(root, null, 2)}`))
  });


  // Browser is a root component for our application that just delegates
  // to a core sub-components here.
  const Browser = Component('Browser', immutableState => {
    const webViewers = immutableState.get('webViewers');
    const webViewersCursor = immutableState.cursor('webViewers');

    const selectIndex = indexOfSelected(webViewers);
    const activeIndex = indexOfActive(webViewers);

    const selectedWebViewerCursor = webViewersCursor.cursor(selectIndex);
    const activeWebViewerCursor = webViewersCursor.cursor(activeIndex);

    const tabStripCursor = immutableState.cursor('tabStrip');
    const inputCursor = immutableState.cursor('input');

    const rfaCursor = immutableState.cursor('rfa');

    const dashboard = immutableState.get('dashboard');
    const dashboardCursor = immutableState.cursor('dashboard');
    const dashboardItems = dashboard.get('items');
    const isDashboardActive = activeWebViewerCursor.get('uri') === null;

    const isAwesomebarActive = inputCursor.get('isFocused');

    const isTabStripVisible = isDashboardActive ||
                              (tabStripCursor.get('isActive') && !isAwesomebarActive);

    const isTabstripkillzoneVisible = (
      // Show when tabstrip is visible, except on dashboard
      (tabStripCursor.get('isActive') && !isDashboardActive) ||
      // Also show when Awesomebar is active
      isAwesomebarActive
    );

    const theme = isDashboardActive ?
      readDashboardNavigationTheme(dashboard) :
      Browser.readTheme(activeWebViewerCursor);

    const suggestionsCursor = immutableState.cursor('suggestions');

    return DOM.div({
      key: 'root',
    }, [Main({
      key: 'main',
      windowTitle: title(selectedWebViewerCursor),
      scrollGrab: true,
      className: ClassSet({
        'moz-noscrollbars': true,
        isdark: theme.isDark,
        windowFocused: immutableState.get('isDocumentFocused'),
        showtabstrip: isTabStripVisible,
        scrollable: !inputCursor.get('isFocused') && !isTabStripVisible
      }),
      onDocumentUnload: event => writeSession(immutableState.valueOf()),
      onDocumentFocus: event => immutableState.set('isDocumentFocused', true),
      onDocumentBlur: event => immutableState.set('isDocumentFocused', false),
      onDocumentKeyDown: compose(onNavigation(inputCursor),
                                 onTabStripKeyDown(tabStripCursor),
                                 onViewerBinding(selectedWebViewerCursor),
                                 onDeckBinding(webViewersCursor),
                                 onTabSwitch(webViewersCursor),
                                 onBrowserBinding(immutableState)),
      onDocumentKeyUp: compose(onTabStripKeyUp(tabStripCursor),
                               onDeckBindingRelease(webViewersCursor)),
      onAppUpdateAvailable: event => immutableState.set('appUpdateAvailable', true),
      onRuntimeUpdateAvailable: event => immutableState.set('runtimeUpdateAvailable', true),
    }, [
      NavigationPanel({
        key: 'navigation',
        inputCursor,
        tabStripCursor,
        theme,
        rfaCursor,
        suggestionsCursor,
        webViewerCursor: selectedWebViewerCursor,
      }, {
        onNavigate: navigateTo(webViewersCursor, activeWebViewerCursor)
      }),
      DOM.div({key: 'tabstrip',
               style: theme.tabstrip,
               className: 'tabstripcontainer'}, [
        Tab.Deck({
          key: 'tabstrip',
          className: 'tabstrip',
          items: webViewersCursor,
          onMouseLeave: event => webViewersCursor.update(compose(reorder, reset)),
        }, {
          onSelect: item => webViewersCursor.update(items => select(items, item)),
          onActivate: _ => webViewersCursor.update(items => activate(items)),
          onClose: id => webViewersCursor.update(closeTab(id))
        })
      ]),
      Awesomebar({
        key: 'awesomebar',
        suggestionsCursor,
        inputCursor,
        isAwesomebarActive,
        theme
      }, {
        onOpen: uri => {
          if (isPinned(activeWebViewerCursor)) {
            webViewersCursor.update(openTab(uri));
          } else {
            loadURI(activeWebViewerCursor);
          }
        }
      }),
      DOM.div({
        key: 'tabstripkillzone',
        className: ClassSet({
          tabstripkillzone: true,
          'tabstripkillzone-hidden': !isTabstripkillzoneVisible
        }),
        onMouseEnter: event => hideTabStrip(tabStripCursor)
      }),
      Dashboard({
        key: 'dashboard',
        dashboard,
        hidden: !isDashboardActive
      }, {
        onOpen: uri => webViewersCursor.update(openTab(uri)),
        onWallpaperChange: key => dashboardCursor.merge(getDashboardThemePatch(key))
      }),
      WebViewer.Deck({
        key: 'web-viewers',
        className: 'iframes',
        hidden: isDashboardActive,
        items: webViewersCursor
      }, {
        onClose: id => webViewersCursor.update(closeTab(id)),
        onOpen: uri => webViewersCursor.update(openTab(uri))
      })
    ]),
    DOM.div({
      key: 'appUpdateBanner',
      className: ClassSet({
        appupdatebanner: true,
        active: immutableState.get('appUpdateAvailable') || immutableState.get('runtimeUpdateAvailable')
      }),
    }, [
      'Hey! An update just for you!',
      DOM.div({
        key: 'appUpdateButton',
        className: 'appupdatebutton',
        onClick: e => {
          if (immutableState.get('runtimeUpdateAvailable') && immutableState.get('appUpdateAvailable')) {
            // FIXME: Not supported yet
            sendEventToChrome('clear-cache-and-restart')
          }
          if (immutableState.get('runtimeUpdateAvailable') && !immutableState.get('appUpdateAvailable')) {
            // FIXME: Not supported yet
            sendEventToChrome('restart')
          }
          if (!immutableState.get('runtimeUpdateAvailable') && immutableState.get('appUpdateAvailable')) {
            sendEventToChrome('clear-cache-and-reload')
          }
        }
      }, 'Apply' + (immutableState.get('runtimeUpdateAvailable') ? ' (restart required)' : ''))
    ])]);
  })
  // Create a version of readTheme that will return from cache
  // on repeating calls with an equal cursor.
  Browser.readTheme = Component.cached(readTheme);

  // Exports:

  exports.Main = Main;
  exports.Browser = Browser;

});
