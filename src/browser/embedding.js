/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Manages events coming from gecko.

(function() {

  'use strict';

  function dispatchEventToGecko(name, payload) {
    let details = payload || {};
    details.type = name;
    let event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozContentEvent', true, true, details);
    window.dispatchEvent(event);
  }

  function handleEvent(evt) {
    let type = evt.detail.type;

    switch (type) {
      case 'remote-debugger-prompt':
        // Always allow remote debugging for now.
        dispatchEventToGecko('remote-debugger-prompt', {value: true});
        break;
      case 'update-available':
        // Always download updates.
        dispatchEventToGecko('update-available-result', {result: 'download'});
        break;
      case 'update-downloaded':
      case 'update-prompt-apply':
        dispatchEvent(new CustomEvent('runtime-update-available'));
        break;
      default:
        console.log('Unknown mozChromeEvent: ' + type);
    }
  }

  function checkUpdate() {
    let event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozContentEvent', true, true,
                          {type: 'force-update-check'});
    window.dispatchEvent(event);
  }

  window.addEventListener('mozChromeEvent', handleEvent, false);

  // Trigger a forced update check after 5s to not slow down startup.
  // TODO: delay until we're online if needed.
  window.setTimeout(checkUpdate, 5000);
})();
