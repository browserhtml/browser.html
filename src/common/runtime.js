/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Manages events coming from gecko.

define((require, exports, module) => {
  'use strict';

  const {Record, Union, Any} = require('common/typed');

  // Event

  const Unknown = Record({
    type: String,
    detail: Any
  }, 'Runtime.Event.Unknown');

  const RemoteDebugRequest = Record({
    type: 'remote-debugger-prompt'
  }, 'Runtime.Event.RemoteDebugRequest');

  const UpdateAvailable = Record({
    type: 'update-available'
  }, 'Runtime.Event.UpdateAvailable');

  const UpdateDownloaded = Record({
    type: 'update-downloaded'
  }, 'Runtime.Event.UpdateDownloaded');




  const Event = Union({
    Unknown,
    RemoteDebugRequest,
    UpdateAvailable,
    UpdateDownloaded
  });
  exports.Event = Event;


  // Actions

  const CheckUpdate = Record({
    type: 'force-update-check'
  }, 'Runtime.Action.CheckUpdate');

  const RemoteDebugResponse = Record({
    type: 'remote-debugger-prompt',
    value: Boolean
  }, 'Runtime.Action.RemoteDebugResponse');

  const DownloadUpdate = Record({
    type: 'update-available-result',
    result: 'download'
  }, 'Runtime.Action.DownloadUpdate');

  const Restart = Record({
    type: 'restart',
  }, 'Runtime.Action.Restart');

  const CleanRestart = Record({
    type: 'clear-cache-and-restart'
  }, 'Runtime.Action.CleanRestart');

  const CleanReload = Record({
    type: 'clear-cache-and-reload'
  }, 'Runtime.Action.CleanReload');

  const Shutdown = Record({
    type: 'shutdown-application'
  }, 'Runtime.Action.Shutdown');

  const Minimize = Record({
    type: 'minimize-native-window'
  }, 'Runtime.Action.Minimize');

  const Maximize = Record({
    type: 'toggle-fullscreen-native-window'
  }, 'Runtime.Action.Maximize');

  const Action = Union({
    CheckUpdate,
    RemoteDebugResponse,
    DownloadUpdate,
    Restart,
    CleanRestart,
    CleanReload,
    Shutdown,
    Minimize,
    Maximize
  });
  exports.Action = Action;

  const Unsupported = Union({
    Restart, CleanRestart
  }, 'Runtime.UnsupportedAction');


  const Incoming = ({detail}) =>
    detail.type === 'remote-debugger-prompt' ? RemoteDebugRequest() :
    detail.type === 'update-available' ? UpdateAvailable() :
    detail.type === 'update-downloaded' ? UpdateDownloaded() :
    detail.type === 'update-prompt-apply' ? UpdateDownloaded() :
    Unknown({type: detail.type, detail});

  const service = address => {
    // Start listening for runtime events.
    window.addEventListener('mozChromeEvent', address.pass(Incoming));

    return action => {
      if (action instanceof RemoteDebugRequest) {
        address.receive(RemoteDebugResponse({value: true}));
      } else if (action instanceof UpdateDownloaded) {
        address.receive(DownloadUpdate());
      } else if (action instanceof Unknown) {
        console.warn(`Unknown runtime event ${action}`)
      } else if (Action.isTypeOf(action)) {
        window.dispatchEvent(new CustomEvent('mozContentEvent', {
          bubles: true,
          cancelable: false,
          detail: action.toJSON()
        }));

        if (Unsupported.isTypeOf(action)) {
          console.warn(`Unsupported runtime action triggered ${action}`);
        }
      }
    }
  };

  exports.service = service;
});
