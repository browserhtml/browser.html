/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';
  const {Element, Event, ChromeEvent, VirtualAttribute} = require('common/element');

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
    onRuntimeUpdateAvailable: Event('runtime-update-available', getOwnerWindow),
    onOpenWindow: ChromeEvent('mozbrowseropenwindow')
  });

  exports.Main = Main;
})
