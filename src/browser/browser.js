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
  const {Element, Event, VirtualAttribute, Attribute} = require('./element');
  const {KeyBindings} = require('./keyboard');
  const {zoomIn, zoomOut, zoomReset, open,
         goBack, goForward, reload, stop, title} = require('./web-viewer/actions');
  const {focus, showTabStrip, hideTabStrip, select: selectField,
         writeSession, resetSession, resetSelected} = require('./actions');
  const {indexOfSelected, indexOfActive, isActive, order,
         selectNext, selectPrevious, select, activate,
         reorder, reset, previewed, remove, append} = require('./deck/actions');
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
    onAppUpdateAvailable: Event('app-update-available', getOwnerWindow)
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

  const addTab = item => items => append(items, item);

  const openTab = (items) =>
    append(items, open({isSelected: true,
                        isFocused: false,
                        isActive: true}));

  const loadURI = curry((webViewer, uri) =>
    webViewer.merge({uri, isFocused: true}));

  // If closing viewer, replace it with a fresh one & select it.
  // This avoids code branching down the pipe that otherwise will
  // need to deal with 0 viewer & no active viewer case.
  const close = p => items =>
    items.count() > 1 ? remove(items, p) :
    items.set(0, open({isSelected: true, isActive: true}));

  const closeTab = item =>
    close(x => x.get('id') == item.get('id'));


  const edit = edit => cursor => cursor.update(edit);

  const onSelectNext = throttle(edit(selectNext), 200)
  const onSelectPrevious = throttle(edit(selectPrevious), 200);

  const switchTab = (items, to) =>
    to ? activate(select(items, to)) : items;

  switchTab.toIndex = index => items => switchTab(items, order(items).get(index));
  switchTab.toLast = items => switchTab(items, order(items).last());


  let onTabSwitch;
  {
    const modifier = os.platform() == 'darwin' ? 'meta' : 'alt';

    onTabSwitch = KeyBindings({
      [`${modifier} 1`]: edit(switchTab.toIndex(0)),
      [`${modifier} 2`]: edit(switchTab.toIndex(1)),
      [`${modifier} 3`]: edit(switchTab.toIndex(2)),
      [`${modifier} 4`]: edit(switchTab.toIndex(3)),
      [`${modifier} 5`]: edit(switchTab.toIndex(4)),
      [`${modifier} 6`]: edit(switchTab.toIndex(5)),
      [`${modifier} 7`]: edit(switchTab.toIndex(6)),
      [`${modifier} 8`]: edit(switchTab.toIndex(7)),
      [`${modifier} 9`]: edit(switchTab.toLast),
    });
  };

  const onDeckBinding = KeyBindings({
    'accel t': edit(openTab),
    'accel w': edit(close(isActive)),
    'control tab': onSelectPrevious,
    'control shift tab': onSelectNext,
    'meta shift ]':onSelectPrevious,
    'meta shift [': onSelectNext,
    'ctrl pagedown': onSelectPrevious,
    'ctrl pageup': onSelectNext,
  });

  const onDeckBindingRelease = KeyBindings({
    'control': edit(compose(reorder, activate)),
    'meta': edit(compose(reorder, activate))
  });

  const onBrowserBinding = KeyBindings({
    'accel shift backspace': edit(resetSession),
    'accel shift s': writeSession
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
    const dashboardItems = dashboard.get('items');
    const isDashboardActive = activeWebViewerCursor.get('uri') === null;

    const isAwesomebarActive = inputCursor.get('isFocused');

    const isTabStripVisible = isDashboardActive ||
                              (tabStripCursor.get('isActive') && !isAwesomebarActive);

    const theme = Browser.readTheme(activeWebViewerCursor);

    const suggestionsCursor = immutableState.cursor('suggestions');

    return DOM.div({
    }, [Main({
      windowTitle: title(selectedWebViewerCursor),
      scrollGrab: true,
      className: ClassSet({
        'moz-noscrollbars': true,
        isdark: theme.isDark,
        windowFocused: immutableState.get('isDocumentFocused'),
        showtabstrip: isTabStripVisible,
        scrollable: !inputCursor.get('isFocused') && !isTabStripVisible
      }),
      onDocumentUnload: event => writeSession(immutableState),
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
    }, [
      NavigationPanel({
        key: 'navigation',
        inputCursor,
        tabStripCursor,
        theme,
        rfaCursor,
        suggestionsCursor,
        webViewerCursor: selectedWebViewerCursor,
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
          onClose: item => webViewersCursor.update(closeTab(item))
        })
      ]),
      Awesomebar({
        key: 'awesomebar',
        suggestionsCursor,
        inputCursor,
        isAwesomebarActive,
        theme
      }, {
        onOpen: loadURI(activeWebViewerCursor)
      }),
      DOM.div({
        key: 'tabstripkillzone',
        className: ClassSet({
          tabstripkillzone: true,
          'tabstripkillzone-hidden': !isTabStripVisible || isDashboardActive
        }),
        onMouseEnter: event => hideTabStrip(tabStripCursor)
      }),
      Dashboard({
        key: 'dashboard',
        items: dashboardItems,
        hidden: !isDashboardActive
      }, {
        onOpen: loadURI(activeWebViewerCursor)
      }),
      WebViewer.Deck({
        key: 'web-viewers',
        className: 'iframes',
        hidden: isDashboardActive,
        items: webViewersCursor
      }, {
        onClose: item => webViewersCursor.update(closeTab(item)),
        onOpen: item => webViewersCursor.update(addTab(item))
      })
    ]),
    DOM.div({
      key: 'appUpdateBanner',
      className: ClassSet({
        appupdatebanner: true,
        active: immutableState.get('appUpdateAvailable')
      }),
    }, [
      'Hey! An update just for you!',
      DOM.div({
        key: 'appUpdateButton',
        className: 'appupdatebutton',
        onClick: e => window.location.reload(true)
      }, 'Apply')
    ])]);
  })
  // Create a version of readTheme that will return from cache
  // on repeating calls with an equal cursor.
  Browser.readTheme = Component.cached(readTheme);

  // Exports:

  exports.Main = Main;
  exports.Browser = Browser;

});
