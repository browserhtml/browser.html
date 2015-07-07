/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html} = require('reflex');
  const {StyleSheet, Style} = require('common/style');
  const {Record, Union} = require('common/typed');
  const Runtime = require('common/runtime');
  const Update = require('service/update');

  // Model

  const Model = Record({
    appUpdateAvailable: false,
    runtimeUpdateAvailable: false
  });
  exports.Model = Model;

  // Actions


  const {ApplicationUpdate} = Update.Action;
  const {UpdateDownloaded: RuntimeUpdate} = Runtime.Event;

  const Action = Union({ApplicationUpdate, RuntimeUpdate});
  exports.Action = Action;

  // Update

  const update = (state, action) =>
    action instanceof ApplicationUpdate ? state.set('appUpdateAvailable', true) :
    action instanceof RuntimeUpdate ? state.set('runtimeUpdateAvailable', true) :
    state;
  exports.update = update;

  // Style

  const style = StyleSheet.create({
    container: {
      position: 'fixed',
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
    },
    hidden: {
      opacity: 0,
      pointerEvents: 'none',
    },
    button: {
      padding: '8px 20px',
      backgroundColor: 'rgb(115,206,113)',
      color: 'inherit',
      borderRadius: 4,
      float: 'right',
      cursor: 'pointer'
    },
    message: {
      float: 'left',
      padding: 8
    }
  });

  // View

  const {Restart, CleanRestart, CleanReload} = Runtime.Action;

  const view = ({runtimeUpdateAvailable, appUpdateAvailable}, address) => {
    const message = runtimeUpdateAvailable ? ' (restart required)' : '';
    const action = runtimeUpdateAvailable && appUpdateAvailable ? CleanRestart() :
                   runtimeUpdateAvailable ? Restart() :
                   appUpdateAvailable ? CleanReload() :
                   null;

    return html.div({
      style: Style(style.container,
                   action ? style.visible : style.hidden)
    }, [
      html.div({
        key: 'bannerMessage',
        style: style.message
      }, 'Hey! An update just for you!'),
      html.button({
        key:  'bannerButton',
        style: style.button,
        onClick: action && address.send(action)
      }, `Apply ${message}`)
    ]);
  };

  exports.view = view;
});
