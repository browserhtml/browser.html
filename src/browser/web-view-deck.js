/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';


  const {Record, Union, List, Maybe} = require('common/typed');
  const {html, render} = require('reflex');
  const WebView = require('./web-view');
  const Shell = require('./web-shell');
  const Thumbnail = require('service/thumbnail');
  const Pallet = require('service/pallet');
  const URI = require('common/url-helper');
  const Input = require('./web-input');

  // Model
  const EntryModel = Record({
    selected: 0,
    view: WebView.Model,
  }, 'WebView.Entry');

  const Model = Record({
    selected: Maybe(Number),
    nextID: 0,
    entries: List(EntryModel)
  }, 'WebViews');
  exports.Model = Model;

  // Actions


  const {Open, OpenInBackground, Close} = WebView;
  const {Load} = WebView.Action;
  const {Enter} = Input.Action;


  const SelectByOffset = Record({
    offset: Number,
  }, 'WebViews.SelectByOffset');

  const SelectByID = Record({
    id: String
  }, 'WebViews.SelectByID');

  const SelectByIndex = Record({
    index: Number
  }, 'WebViews.SelectByIndex');


  const Action = Union({SelectByIndex, SelectByID, SelectByOffset,
                        Open, OpenInBackground, Close, Enter,
                        WebView: WebView.Action});
  exports.Action = Action;



  // Takes `entires` and a `from` entry (from with in it) and returns
  // an `entry` that is `n` positions away in an ordered `entries`. In other
  // word this function lets find nth item to the left (if n < 0) or right
  // (if n > 0) of the given entry.
  const relativeOf = (entries, from, n) => {
    const loopLength = entries.size;
    const position = entries.indexOf(from) + n;
    const loops = Math.trunc(position / loopLength);
    return position - loops * loopLength;
  }

  const indexByID = (state, id) =>
    id === '@selected' ? state.selected :
    state.entries.findIndex(({view}) => view.id === id);

  const indexByOffset = ({entries}, index, offset) =>
    relativeOf(entries, entries.get(index), offset);

  const viewByID = (state, id) => {
    const index = indexByID(state, id);
    const entry = state.entries.get(index);
    return entry && entry.view;
  }
  exports.viewByID = viewByID;


  const select = (state, index) => {
    const from = state.getIn(['entries', state.selected, 'view']);
    const to = state.getIn(['entries', index, 'view']);
    return !to ? state : state.merge({
      selected: index,
      entries: state
                .entries
                .setIn([index, 'selected'], Date.now())
                .setIn([index, 'view', 'shell', 'isFocused'],
                       from.shell.isFocused)
    });
  };
  exports.select = select;

  const selectByID = (state, id) =>
    select(state, indexByID(state, id));
  exports.selectByID = selectByID;

  const unselect = state =>
    state.remove('selected');
  exports.unselect = unselect;


  const close = (state, id) => {
    const index = indexByID(state, id);
    if (index === null) {
      return state
    } else {
      return state.merge({
        entries: state.entries.remove(index),
        selected: null
      })
    }
  }

  const load = (state, action) => {
    const index = indexByID(state, action.id);
    const path = ['entries', index, 'view'];
    const selected = state.getIn(path);
    return !selected ?
            open(state, action.uri) :
           URI.getOrigin(selected.uri) !== URI.getOrigin(action.uri) ?
            open(state, action.uri) :
           state.setIn(path, WebView.update(selected, action));
  };

  const open = (state, uri) =>
    state.merge({
      nextID: state.nextID + 1,
      selected: state.entries.size,
      entries: state
                .entries
                .push(EntryModel({
                  selected: Date.now(),
                  view: WebView.Model({
                    uri, id: String(state.nextID),
                    shell: Shell.Model({isFocused: true}),
                  })
                }))
    });

  const openInBackground = (state, uri) => state.merge({
    nextID: state.nextID + 1,
    entries: state.entries.push(Entry.Model({
      view: WebView.Model({uri, id: String(state.nextID)})
    }))
  });

  const updateWebView = (state, action) => {
    const index = indexByID(state, action.id);
    const isFocusChange = action instanceof Shell.Action.Focus;
    // If entry does not exist.
    if (index === null) {
      return state
    }

    const path = ['entries', index, 'view'];

    // If focus is moved to a non selected web-view we do select it.
    if (isFocusChange && state.selected !== index) {
      return state.merge({
        selected: index,
        entries: state.entries.mergeIn([index], {
          selected: Date.now(),
          view: WebView.update(state.getIn(path), action)
        })
      })
    } else {
      return state.setIn(path, WebView.update(state.getIn(path), action))
    }
  }

  const update = (state, action) =>
    action instanceof Load ?
      load(state, action) :
    action instanceof Open ?
      open(state, action.uri) :
    action instanceof OpenInBackground ?
      openInBackground(state, action.uri) :
    action instanceof Close ?
      close(state, action.id) :
    action instanceof SelectByOffset ?
      select(state, indexByOffset(state, state.selected, action.offset)) :
    action instanceof SelectByID ?
      selectByID(state, action.id) :
    action instanceof Enter ?
      selectByID(state, action.id) :
    action instanceof SelectByIndex ?
      select(state, action.index) :
    WebView.Action.isTypeOf(action) ?
      updateWebView(state, action) :
    state;
  exports.update = update;

  // View

  const view = (isActive, state, address) => {
    const selected = state.entries.get(state.selected);

    return html.div({
      key: 'web-views',
      style: {
        transform: `scale(${isActive ? 1 : 0})`
      },
    }, state.entries.map(({view}) =>
      render(`web-view@${view.id}`,
             WebView.view,
             view.id,
             view.uri,
             view.shell,
             view.page,
             view.navigation,
             view === selected.view,
             address)));
  };
  exports.view = view;

});
