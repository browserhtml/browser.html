/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Manages events coming from gecko.
  'use strict';

  const {Record, Union, Any} = require('typed-immutable');

  // Actions

  const Unknown = Record({
    type: String,
    detail: Any
  }, 'Runtime.Unknown');
  exports.Unknown = Unknown;

  const RemoteDebugRequest = Record({
    type: 'remote-debugger-prompt'
  }, 'Runtime.RemoteDebugRequest');
  exports.RemoteDebugRequest = RemoteDebugRequest;

  const UpdateAvailable = Record({
    type: 'update-available'
  }, 'Runtime.UpdateAvailable');
  exports.UpdateAvailable = UpdateAvailable;

  const UpdateDownloaded = Record({
    type: 'update-downloaded'
  }, 'Runtime.UpdateDownloaded');
  exports.UpdateDownloaded = UpdateDownloaded;


  const CheckUpdate = Record({
    type: 'force-update-check'
  }, 'Runtime.CheckUpdate');
  exports.CheckUpdate = CheckUpdate;

  const RemoteDebugResponse = Record({
    type: 'remote-debugger-prompt',
    value: Boolean
  }, 'Runtime.RemoteDebugResponse');
  exports.RemoteDebugResponse = RemoteDebugResponse;

  const DownloadUpdate = Record({
    type: 'update-available-result',
    result: 'download'
  }, 'Runtime.DownloadUpdate');
  exports.DownloadUpdate = DownloadUpdate;

  const Restart = Record({
    type: 'restart',
  }, 'Runtime.Restart');
  exports.Restart = Restart;

  const CleanRestart = Record({
    type: 'clear-cache-and-restart'
  }, 'Runtime.CleanRestart');
  exports.CleanRestart = CleanRestart;

  const CleanReload = Record({
    type: 'clear-cache-and-reload'
  }, 'Runtime.CleanReload');
  exports.CleanReload = CleanReload;

  const Shutdown = Record({
    type: 'shutdown-application'
  }, 'Runtime.Shutdown');
  exports.Shutdown = Shutdown;

  const Minimize = Record({
    type: 'minimize-native-window'
  }, 'Runtime.Minimize');
  exports.Minimize = Minimize;

  const Maximize = Record({
    type: 'toggle-fullscreen-native-window'
  }, 'Runtime.Maximize');
  exports.Maximize = Maximize;

  const LiveReload = Record({
    description: 'Action is triggered when application JS is hot swapped'
  }, 'Runtime.LiveReload');
  exports.LiveReload = LiveReload;


  const Action = Union(
    Unknown, RemoteDebugRequest, UpdateAvailable, UpdateDownloaded,
    CheckUpdate, RemoteDebugResponse, DownloadUpdate, Restart,
    CleanRestart, CleanReload, Shutdown, Minimize, Maximize
  );
  exports.Action = Action;


  const Incoming = ({detail}) =>
    detail.type === 'remote-debugger-prompt' ? RemoteDebugRequest() :
    detail.type === 'update-available' ? UpdateAvailable() :
    detail.type === 'update-downloaded' ? UpdateDownloaded() :
    detail.type === 'update-prompt-apply' ? UpdateDownloaded() :
    Unknown({type: detail.type, detail});

  const service = address => {
    // Start listening for runtime events.
    const handler = event => address(Incoming(event));
    window.addEventListener('mozChromeEvent', handler);

    return action => {
      if (action instanceof LiveReload) {
        window.removeEventListener('mozChromeEvent', handler);
      } else if (action instanceof RemoteDebugRequest) {
        address(RemoteDebugResponse({value: true}));
      } else if (action instanceof UpdateDownloaded) {
        address(DownloadUpdate());
      } else if (action instanceof Unknown) {
        console.warn(`Unknown runtime event ${action}`)
      } else if (action instanceof CheckUpdate ||
                 action instanceof RemoteDebugResponse ||
                 action instanceof DownloadUpdate ||
                 action instanceof Restart ||
                 action instanceof CleanRestart ||
                 action instanceof CleanReload ||
                 action instanceof Shutdown ||
                 action instanceof Minimize ||
                 action instanceof Maximize)
      {
        window.dispatchEvent(new CustomEvent('mozContentEvent', {
          bubles: true,
          cancelable: false,
          detail: action.toJSON()
        }));

        if (action instanceof Restart) {
          console.warn(`Unsupported runtime action triggered ${action}`);
        }
      }
    }
  };

  exports.service = service;
