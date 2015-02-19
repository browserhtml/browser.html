/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Manages events coming from gecko.

(function() {

  'use strict';

  function handleEvent(evt) {
    let type = evt.detail.type;

    switch (type) {
      case 'remote-debugger-prompt':
        // Always allow remote debugging for now.
        let event = document.createEvent('CustomEvent');
        event.initCustomEvent('mozContentEvent', true, true,
                              {type: 'remote-debugger-prompt',
                               value: true});
        window.dispatchEvent(event);
        break;
      default:
        console.log('Unknown mozChromeEvent: ' + type);
    }
  }

  window.addEventListener('mozChromeEvent', handleEvent, false);

})();
