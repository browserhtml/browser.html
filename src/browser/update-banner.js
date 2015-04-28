/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const Component = require('omniscient');
  const {DOM} = require('react');
  const {sendEventToChrome} = require('./actions');
  const {mix} = require('common/style');
  const {Record} = require('typed-immutable/index');

  // Model

  const Updates = Record({
    appUpdateAvailable: Boolean(false),
    runtimeUpdateAvailable: Boolean(false)
  });

  Updates.setAppUpdateAvailable = updates => updates.set('appUpdateAvailable', true);
  Updates.setRuntimeUpdateAvailable = updates => updates.set('runtimeUpdateAvailable', true);

  // Style

  const styleContainer = {
    position: 'absolute',
    bottom: 10,
    width: 400,
    left: 'calc(50vw - 200px)',
    backgroundColor: 'rgba(36,60,83,0.95)',
    borderRadius: 4,
    padding: 8,
    color: 'white',
    transition: 'opacity 500ms ease-in',
    fontWeight: '100',
    cursor: 'default'
  };

  const styleHiddenContainer = {
    opacity: 0,
    pointerEvents: 'none',
  };

  const styleButton = {
    padding: '8px 20px',
    backgroundColor: 'rgb(115,206,113)',
    borderRadius: 4,
    float: 'right',
    cursor: 'pointer'
  };

  const styleMessage = {
    float: 'left',
    padding: 8
  };

  // View

  Updates.render = Component(({updates}) => {

    let style = styleContainer;
    if (!updates.appUpdateAvailable &&
        !updates.runtimeUpdateAvailable) {
      style = mix(style, styleHiddenContainer);
    }

    const buttonMessage = 'Apply' + (updates.runtimeUpdateAvailable ? ' (restart required)' : '');

    return DOM.div({
      style
    }, [
      DOM.div({
        key: 'bannerMessage',
        style: styleMessage
      }, 'Hey! An update just for you!'),
      DOM.div({
        key:  'bannerButton',
        style: styleButton,
        onClick: event => {
          // FIXME: Work around issue #339
          const sendEventToChrome = require('./actions').sendEventToChrome;
          if (updates.runtimeUpdateAvailable && updates.appUpdateAvailable) {
            console.error('Not supported yet: clear-cache-and-restart');
            sendEventToChrome('clear-cache-and-restart')
          }
          if (updates.runtimeUpdateAvailable && !updates.appUpdateAvailable) {
            console.error('Not supported yet: restart');
            sendEventToChrome('restart')
          }
          if (!updates.runtimeUpdateAvailable && updates.appUpdateAvailable) {
            sendEventToChrome('clear-cache-and-reload');
          }
        }
      }, buttonMessage)
    ]);
  });

  exports.Updates = Updates;
});
