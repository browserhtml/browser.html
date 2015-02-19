/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

'use strict';

const Component = require('omniscient');
const {DOM} = require('react');
const {NavigationPanel} = require('./navigation-panel');
const {WebViewer} = require('./web-viewer');
const {Tab} = require('./page-switch');
const {Element, Event, Field, Attribute} = require('./element');
const {KeyBindings} = require('./keyboard');
const {zoomIn, zoomOut, zoomReset, open,
       goBack, goForward, reload, stop} = require('./web-viewer/actions');
const {focus, showTabStrip, hideTabStrip} = require('./actions');
const {selectedIndex, selectNext, selectPrevious,
       remove, toggle, append, select} = require('./deck/actions');
const {readTheme} = require('./theme');

const getOwnerWindow = node => node.ownerDocument.defaultView;
// Define custom `main` element with a custom `scrollGrab` attribute
// that maps to same named proprety.
const Main = Element('main', {
  os: Attribute('os'),
  title: Field((node, current, past) => {
    node.ownerDocument.title = current;
  }),
  scrollGrab: Field((node, current, past) => {
    node.scrollgrab = current;
  }),
  onDocumentFocus: Event('focus', getOwnerWindow),
  onDocumentBlur: Event('blur', getOwnerWindow),
  onDocumentKeyDown: Event('keydown', getOwnerWindow),
  onDocumentKeyUp: Event('keyup', getOwnerWindow)
});

const onNavigation = KeyBindings({
  'accel l': focus,
  'accel t': focus
});

const onTabStripKeyDown = KeyBindings({
  'control tab': showTabStrip,
  'control shift tab': showTabStrip
});
const onTabStripKeyUp = KeyBindings({
  'control': hideTabStrip
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

const openTab = items => {
  const item = open();
  return select(append(items, item), x => x == item);
}

// If closing viewer, replace it with a fresh one & select it.
// This avoids code branching down the pipe that otherwise will
// need to deal with 0 viewer & no active viewer case.
const closeTab = items =>
  items.count() > 1 ? remove(items) : items.set(0, toggle(open()));

const edit = edit => cursor => cursor.update(edit);
const onDeckBinding = KeyBindings({
  'accel t': edit(openTab),
  'accel w': edit(closeTab),
  'control tab': edit(selectNext),
  'control shift tab': edit(selectPrevious),
  'meta shift ]': edit(selectNext),
  'meta shift [': edit(selectPrevious),
  'ctrl pagedown': edit(selectNext),
  'ctrl pageup': edit(selectPrevious)
//  'accel shift backspace': clearSession(options),
//  'accel shift s': saveSession(options)
});

// Functional composition
const compose = (...fns) => {
  const [init, ...steps] = fns.reverse();
  return (...args) =>
    steps.reduce((x, step) => step(x), init(...args));
}

// Browser is a root component for our application that just delegates
// to a core sub-components here.
const Browser = Component(options => {
  const index = selectedIndex(options.get('webViewers'));
  const webViewers = options.cursor('webViewers');
  const webViewer = webViewers.cursor(index);

  const tabStrip = webViewer.cursor('tabStrip');
  const input = options.cursor('input');

  const isTabStripVisible = tabStrip.get('isActive') &&
                            webViewers.count() > 1;

  const theme = readTheme(webViewer);

  return  Main({
    os: options.get('os'),
    title: webViewer.get('uri'),
    scrollGrab: true,
    className: 'moz-noscrollbars' +
               (theme.isDark ? ' isdark' : '') +
               (options.get('isDocumentFocused') ? ' windowFocused' : '') +
               (isTabStripVisible ? ' showtabstrip' : ''),
    onDocumentFocus: event => options.set('isDocumentFocused', true),
    onDocumentBlur: event => options.set('isDocumentFocused', false),
    onDocumentKeyDown: compose(onNavigation(input),
                               onTabStripKeyDown(tabStrip),
                               onViewerBinding(webViewer),
                               onDeckBinding(webViewers)),
    onDocumentKeyUp: onTabStripKeyUp(tabStrip),
  }, [
    NavigationPanel({
      key: 'navigation',
      input, webViewer, tabStrip, theme,
      title: webViewer.get('title'),
    }),
    DOM.div({key: 'tabstrip',
             style: theme.tabstrip,
             className: 'tabstripcontainer'}, [
      Tab.Deck({key: 'tabstrip',
                className: 'tabstrip',
                items: webViewers})
    ]),
    DOM.div({key: 'tabstripkillzone',
             className: 'tabstripkillzone',
             onMouseEnter: event => tabStrip.set("isActive", false)}),

    WebViewer.Deck({key: 'deck',
                    className: 'iframes',
                    items: webViewers}),
  ]);
});

// Exports:

exports.Main = Main;
exports.Browser = Browser;

});
