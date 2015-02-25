/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Component = require('omniscient');
  const {DOM} = require('react');
  const {compose, throttle} = require('lang/functional');
  const {NavigationPanel} = require('./navigation-panel');
  const {WebViewer} = require('./web-viewer');
  const {Tab} = require('./page-switch');
  const {Element, Event, Field, Attribute} = require('./element');
  const {KeyBindings} = require('./keyboard');
  const {zoomIn, zoomOut, zoomReset, open,
         goBack, goForward, reload, stop, title} = require('./web-viewer/actions');
  const {focus, showTabStrip, hideTabStrip,
         writeSession, resetSession, resetSelected} = require('./actions');
  const {indexOfSelected, indexOfActive, isActive,
         selectNext, selectPrevious, select, activate,
         previewed, remove, append} = require('./deck/actions');
  const {readTheme} = require('./theme');

  const getOwnerWindow = node => node.ownerDocument.defaultView;
  // Define custom `main` element with a custom `scrollGrab` attribute
  // that maps to same named proprety.
  const Main = Element('main', {
    os: Attribute('os'),
    windowTitle: Field((node, current, past) => {
      node.ownerDocument.title = current;
    }),
    scrollGrab: Field((node, current, past) => {
      node.scrollgrab = current;
    }),
    onDocumentFocus: Event('focus', getOwnerWindow),
    onDocumentBlur: Event('blur', getOwnerWindow),
    onDocumentKeyDown: Event('keydown', getOwnerWindow),
    onDocumentKeyUp: Event('keyup', getOwnerWindow),
    onDocumentUnload: Event('unload', getOwnerWindow)
  });

  const onNavigation = KeyBindings({
    'accel l': focus,
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

  const onViewerBinding = KeyBindings({
    'accel =': zoomIn,
    'accel -': zoomOut,
    'accel 0': zoomReset,
    'accel left': goBack,
    'accel right': goForward,
    'escape': stop,
    'accel r': reload,
    'F5': reload
  });


  const addTab = item => items => append(items, item);

  const openTab = (items) =>
    append(items, open({isSelected: true,
                        isActive: true}));

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

  const onDeckBinding = KeyBindings({
    'accel t': edit(openTab),
    'accel w': edit(close(isActive)),
    'control tab': onSelectNext,
    'control shift tab': onSelectPrevious,
    'meta shift ]': onSelectNext,
    'meta shift [': onSelectPrevious,
    'ctrl pagedown': onSelectNext,
    'ctrl pageup': onSelectPrevious
  });

  const onDeckBindingRelease = KeyBindings({
    'control': activate,
    'meta': activate
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

    const isTabStripVisible = tabStripCursor.get('isActive');

    const theme = readTheme(activeWebViewerCursor);

    return Main({
      os: immutableState.get('os'),
      windowTitle: title(selectedWebViewerCursor),
      scrollGrab: true,
      className: 'moz-noscrollbars' +
                 (theme.isDark ? ' isdark' : '') +
                 (immutableState.get('isDocumentFocused') ? ' windowFocused' : '') +
                 (isTabStripVisible ? ' showtabstrip' : '') +
                 (inputCursor.get('isFocused') ? '' : ' scrollable'),
      onDocumentUnload: event => writeSession(immutableState),
      onDocumentFocus: event => immutableState.set('isDocumentFocused', true),
      onDocumentBlur: event => immutableState.set('isDocumentFocused', false),
      onDocumentKeyDown: compose(onNavigation(inputCursor),
                                 onTabStripKeyDown(tabStripCursor),
                                 onViewerBinding(selectedWebViewerCursor),
                                 onDeckBinding(webViewersCursor),
                                 onBrowserBinding(immutableState)),
      onDocumentKeyUp: compose(onTabStripKeyUp(tabStripCursor),
                               onDeckBindingRelease(webViewersCursor))
    }, [
      NavigationPanel({
        key: 'navigation',
        inputCursor,
        tabStripCursor,
        theme,
        webViewerCursor: selectedWebViewerCursor,
      }),
      DOM.div({key: 'tabstrip',
               style: theme.tabstrip,
               className: 'tabstripcontainer'}, [
        Tab.Deck({key: 'tabstrip',
                  className: 'tabstrip',
                  items: webViewersCursor,

                  onSelect: item => webViewersCursor.update(items => select(items, item)),
                  onActivate: _ => webViewersCursor.update(items => activate(items)),
                  onClose: item => webViewersCursor.update(closeTab(item))
                 })
      ]),
      DOM.div({key: 'tabstripkillzone',
               className: 'tabstripkillzone',
               onMouseEnter: event => {
                 resetSelected(webViewersCursor);
                 hideTabStrip(tabStripCursor);
               }
              }),

      WebViewer.Deck({key: 'web-viewers',
                      className: 'iframes',
                      items: webViewersCursor,
                      onClose: item => webViewersCursor.update(closeTab(item)),
                      onOpen: item => webViewersCursor.update(addTab(item))
                     })
    ]);
  });

  // Exports:

  exports.Main = Main;
  exports.Browser = Browser;

});
