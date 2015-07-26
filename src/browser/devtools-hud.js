/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html} = require('reflex');
  const {Style, StyleSheet} = require('common/style');
  const {Record} = require('common/typed');
  const Settings = require('service/settings');

  // Model

  const Model = Record({
    enableHUD: false,
    enableRemoteDevtools: false,
    settings: Record({
      'apz.overscroll.enabled': false,
      'debug.fps.enabled': false,
      'debug.paint-flashing.enabled': false,
      'layers.low-precision': false,
      'layers.low-opacity': false,
      'layers.draw-borders': false,
      'layers.draw-tile-borders': false,
      'layers.dump': false,
      'layers.enable-tiles': false,
      'layers.async-pan-zoom.enabled': false
    })
  });
  exports.Model = Model;

  const SettingDescriptions = {
    'apz.overscroll.enabled': 'Enable overscroll effect',
    'debug.fps.enabled': 'FPS',
    'debug.paint-flashing.enabled': 'Paint flashing',
    'layers.low-precision': 'Low precision buffer & paint',
    'layers.low-opacity': 'Low precision opacity',
    'layers.draw-borders': 'Draw layer borders',
    'layers.draw-tile-borders': 'Draw tile borders',
    'layers.dump': 'Layers dump',
    'layers.enable-tiles': 'Enable tiles',
    'layers.async-pan-zoom.enabled': 'Enable APZC (restart required)'
  };


  // Action

  const ToggleDevtoolsHUD = Record({
    description: 'Toggle DevTools HUD'
  }, 'DevtoolsHUD.ToggleHUD')

  exports.ToggleDevtoolsHUD = ToggleDevtoolsHUD;

  // update

  const update = (state, action) => {

    const updateSettingIfNeeded = (name, value) => {
      if (name in state.get('settings')) {
        state = state.setIn(['settings', name], value);
      }
      if (name == 'debugger.remote-mode') {
        state = state.set('enableRemoteDevtools', value == 'adb-devtools');
      }
    }

    if (action instanceof Settings.Changed) {
      updateSettingIfNeeded(action.name, action.value);
    }

    if (action instanceof Settings.Fetched) {
      for (var setting of action.settings) {
        var [name, value] = setting;
        updateSettingIfNeeded(name, value);
      }
    }

    if (action instanceof ToggleDevtoolsHUD) {
      state = state.set('enableHUD', !state.get('enableHUD'));
    }
    return state;
  }
  exports.update = update;


  // FIXME: how can I avoid this ugly hack?
  // I want to call Settings.Fetch only once
  // to initialize the Model values.
  var fetched = false;
  const fetchInitialValuesIfNeeded = (state, address) => {
    if (fetched) {
      return;
    }
    fetched = true;
    for (var name of [...state.get('settings').keys()]) {
      address.receive(Settings.Fetch({
        id: 'devtools:fetch' + name,
        query: name}));
    }
    var name = 'debugger.remote-mode';
    address.receive(Settings.Fetch({
      id: 'devtools:fetch:debugger.remote-mode',
      query: name}));
  }

  const style = StyleSheet.create({
    checkbox: {
      marginRight: 6,
      MozAppearance: 'checkbox',
    },
    label: {
      padding: 6,
      MozUserSelect: 'none',
      display: 'block',
    },
    container: {
      padding: 10,
      position: 'absolute',
      bottom: 10,
      left: 10,
      width: '300px',
      height: '350px',
      color: 'black',
      backgroundColor: 'white',
      border: '2px solid #F06',
      overflow: 'scroll',
    },
    containerHidden: {
      display: 'none',
    },
    containerVisible: {
      display: 'block',
    },
  });

  const view = (state, address) => {

    fetchInitialValuesIfNeeded(state, address);

    const settingsCheckboxes =
      [...state.get('settings').keys()].map(settingName => html.label({
        key: settingName,
        style: style.label,
      }, [
        html.input({
          type: 'checkbox',
          checked: state.getIn(['settings', settingName]),
          style: style.checkbox,
          onChange: e => {
            var setting = {};
            setting[settingName] = e.target.checked;
            navigator.mozSettings.createLock().set(setting);
          }
        }), SettingDescriptions[settingName]
      ]));

    return html.div({
      key: 'devtools-toolbox',
      style: Style(style.container,
          state.enableHUD ? style.containerVisible : style.containerHidden),
    }, [
      html.label({
        key: 'enableRemoteDevtools',
        style: style.label,
      }, [
        html.input({
          type: 'checkbox',
          checked: state.get('enableRemoteDevtools'),
          style: style.checkbox,
          onChange: e => {
            navigator.mozSettings.createLock().set({
              'debugger.remote-mode': e.target.checked ? 'adb-devtools' : 'disabled'
            });
          }
        }), 'Enable Remote DevTools'
      ]), settingsCheckboxes]);
  };

  exports.view = view;
});
