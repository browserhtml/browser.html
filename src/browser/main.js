/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  'use strict';
  const {Element, Event, ChromeEvent, VirtualAttribute} = require('../common/element');

  const getOwnerWindow = node => node.ownerDocument.defaultView;

  // TODO: All of these events can be expressed using external services which is
  // probably what we should do.

  // Define custom `main` element with a custom `scrollGrab` attribute
  // that maps to same named proprety.
  const Main = Element('div', {
    windowTitle: VirtualAttribute((node, current, past) => {
      node.ownerDocument.title = current;
    }),
    scrollGrab: VirtualAttribute((node, current, past) => {
      node.scrollgrab = current;
    }),
    onWindowFocus: Event('focus', getOwnerWindow),
    onWindowBlur: Event('blur', getOwnerWindow),
    onKeyDown: Event('keydown', getOwnerWindow),
    onKeyUp: Event('keyup', getOwnerWindow),
    onUnload: Event('unload', getOwnerWindow),
    onOpenWindow: ChromeEvent('mozbrowseropenwindow')
  });

  exports.Main = Main;
