/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  'use strict';

  const {thunk:render, html, Address, Application} = require('reflex');
  const {Record, Any, Maybe, Union} = require('typed-immutable');
  const {Map} = require('immutable');
  const Settings = require('../../service/settings');
  const {StyleSheet, Style} = require('../../common/style');
  const ClassSet = require('../../common/class-set');


  // Model

  const Model = Record({
    settings: Any
  }, 'Settings');
  exports.Model = Model;

  const PendingChange = Record({
    isEditing: true,
    value: Maybe(Union(String, Number, Boolean)),
    input: String
  }, 'PendingChange');

  // Update

  const StartEdit = Record({
    name: String
  }, 'StartEdit');

  const StopEdit = Record({
    name: String
  }, 'StopEdit');

  const CancelEdit = Record({
    name: String,
  }, 'CancelEdit');

  const Edit = Record({
    name: String,
    input: String
  }, 'Edit');

  const Action = Union(StartEdit, StopEdit, CancelEdit, Edit);

  const startEdit = (settings, name) => {
    const change = settings.get(name);
    return change instanceof PendingChange ?
      settings.set(name, change.set('isEditing', true)) :
      settings.set(name, PendingChange({
        value: change,
        input: JSON.stringify(change)
      }));
  }

  const stopEdit = (settings, name) => {
    const change = settings.get(name);
    return change instanceof PendingChange ?
      settings.setIn([name, 'isEditing'], false) :
      settings;
  }

  const cancelEdit = (settings, name) => {
    const change = settings.get(name);
    return change instanceof PendingChange ?
      settings.set(name, change.value) :
      settings;
  }

  const edit = (settings, name, input) => {
    const change = settings.get(name);
    return change instanceof PendingChange ?
      settings.setIn([name, 'input'], input) :
      settings;
  }

  const update = (state, action) =>
    action instanceof StartEdit ?
      state.set('settings', startEdit(state.settings, action.name)) :
    action instanceof StopEdit ?
      state.set('settings', stopEdit(state.settings, action.name)) :
    action instanceof CancelEdit ?
      state.set('settings', cancelEdit(state.settings, action.name)) :
    action instanceof Edit ?
      state.set('settings', edit(state.settings, action.name, action.input)) :
    action instanceof Settings.Changed ?
      state.setIn(['settings', action.name], action.value) :
    action instanceof Settings.Fetched ?
      state.mergeIn(['settings'], action.settings) :
    state;
  exports.update = update;

  // View

  const style = StyleSheet.create({
    edit: {
      fontFamily: 'inherit',
      fontSize: 'inherit',
      color: 'inherit',
      width: 'calc(100% - 10px)',
      border: 'none',
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'rgba(255,255,255,0.7)',
      borderRadius: '5px 5px 5px 5px',
      padding: 5
    },
    error: {
      textDecoration: 'underline wavy red'
    },
    number: {
      border: 'none',
      backgroundColor: 'inherit',
      color: 'inherit'
    },
    boolean: {
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    table: {
      fontSize: 12,
      fontFamily: 'Menlo, Courier, monospace',
      color: 'rgba(255,255,255,0.65)',
      backgroundColor: '#273340',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
    },
    row: {
      borderBottom: '1px dotted rgba(255, 255, 255, 0.2)',
      lineHeight: '25px',
      whiteSpace: 'nowrap',
      padding: '0 5px'
    },
    cell: {
      verticalAlign: 'middle',
      display: 'inline-block',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },
    name: {
      minWidth: 300
    },
    value: {
      width: '100vh',
      padding: '0 0 0 0'
    },

  });

  const viewValue = (name, value, address) => {
    const type = value == null ? 'null' :
          value instanceof PendingChange ? 'pending' :
          typeof(value);

    return type === 'pending' ? viewPending(name, value, address) :
           type === 'number' ? viewNumber(name, value, address) :
           type === 'boolean' ? viewBoolean(name, value, address) :
           viewJSON(name, value, address);
  }

  const viewNumber = (name, value, address) =>
    html.input({
      type: 'number',
      style: style.number,
      value,
      onClick: event => {
        if (event.altKey) {
          address(StartEdit({name}));
        }
      },
      onChange: event => {
        address(Settings.Update({
          name, value: event.target.valueAsNumber
        }));
      }
    });

  const viewBoolean = (name, value, address) =>
    html.code({
      style: style.boolean,
      onClick: event => {
        if (event.altKey) {
          address(StartEdit({name}));
        } else {
          address(Settings.Update({name, value: !value}));
        }
      }
    }, JSON.stringify(value));

  const viewJSON = (name, value, address) =>
    html.code({
      style: style.json,
      onClick: event => {
        address(StartEdit({name}));
      }
    }, JSON.stringify(value));

  const parseInput = input => {
    try {
      return JSON.parse(input)
    } catch(error) {
      return error
    }
  }

  const viewPending = (name, change, address) =>
    change.isEditing ? viewEdit(name, change, address) :
    viewDirty(name, change, address);

  const viewDirty = (name, {input}, address) =>
    html.code({
      style: style.error,
      onClick: event => {
        address(StartEdit({name}))
      }
    }, input);

  const viewEdit = (name, {input, value, isEditing}, address) =>
    html.input({
      type: 'text',
      style: Style(style.edit,
                   parseInput(input) instanceof Error && style.error),
      value: input,
      onKeyUp: event => {
        if (event.key === 'Enter') {
          const result = parseInput(event.target.value);

          if (result instanceof Error) {
            address(StopEdit({name}));
          } else if (result === value) {
            address(CancelEdit({name}));
          } else {
            address(Settings.Update({name, value: result}));
          }
        }

        if (event.key === 'Escape') {
          address(CancelEdit({name}));
        }
      },
      onChange: event => {
        address(Edit({name, input: event.target.value}));
      },
      onBlur: event => {
        const value = parseInput(event.target.value);
        if (value instanceof Error) {
          address(StopEdit({name}));
        } else {
          address(Settings.Update({name, value}));
        }
      }
    });

  const viewSetting = (name, value, address) => html.div({
    style: style.row
  }, [
    html.code({
      key: 'name',
      style: Style(style.cell, style.name),
      title: name
    }, name),
    html.code({
      key: 'value',
      style: Style(style.cell, style.value),
      title: value,
    }, viewValue(name, value, address))
  ]);

  const view = (state, address) => html.div({
    key: 'table',
    style: style.table
  }, [
    ...state.settings.map((value, key) => {
      return render(key, viewSetting, key, value, address);
    }).values(),
    html.meta({
      name: 'theme-color',
      content: `${style.table.backgroundColor}|${style.table.color}`
    })
  ]);
  exports.view = view;

  const address = new Address({
    receive(action) {
      application.receive(action);
      settings(action);
    }
  });

  const application = new Application({
    address, view, update,

    target: document.body,
    state: Model({settings: Map()})
  });

  const settings = Settings.service(address);

  address(Settings.Fetch({id: 'about:settings', query: '*'}));
