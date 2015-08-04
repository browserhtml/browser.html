/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {html} = require('reflex');
  const {Record} = require('common/typed');
  const {Style, StyleSheet} = require('common/style');

  // Model

  const Model = Record({
    mode: 'bottom',
  });
  exports.Model = Model;

  // Action

  const TabModeChange = Record({
    mode: String
  }, 'Tabs.TabModeChange');
  exports.TabModeChange = TabModeChange;

  // update

  const update = (state, action) =>
    action instanceof TabModeChange ?
      state.set('mode', action.mode) :
    state;
  exports.update = update;

  // Views

  const style = StyleSheet.create({
    button: {
      MozUserSelect: 'none',
      fontFamily: 'FontIon',
      width: 16,
      margin: 6,
      lineHeight: '16px',
      textAlign: 'center',
      alignSelf: 'center',
      border: '0.5px solid #CBCBCB',
      borderRadius: '100px',
      backgroundColor: '#DDD',
      MozUserSelect: 'none',
    }
  });

  const tabSwitcherView = (state, address) =>
    html.div({
      style: {
        display: 'flex',
        alignSelf: 'center',
      }
    }, [
      html.div({style: style.button}, '\uf43C'),
      html.select({
        style: {
          display: 'block',
          opacity: 0,
          width: 16,
          height: 16,
          margin: '6px 6px 6px -22px',
          fontSize: 0,
        },
        key: 'tab-switcher',
        name: 'select',
        value: state.mode,
        onChange: address.pass(e => TabModeChange({mode: e.target.value})),
      }, [
        html.option({value: 'none'}, 'No tabs'),
        html.option({value: 'bottom'}, 'Bottom tabs'),
        html.option({value: 'side'}, 'Side tabs'),
        html.option({value: 'smallside'}, 'Small side tabs'),
      ]),
   ]);

  exports.tabSwitcherView = tabSwitcherView;

});


