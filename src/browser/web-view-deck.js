/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';


  const {Record, Union, List, Maybe} = require('common/typed');
  const {html, render} = require('reflex');
  const WebView = require('./web-view');
  const Shell = require('./web-shell');
  const Input = require('./web-input');
  const Thumbnail = require('service/thumbnail');
  const Pallet = require('service/pallet');
  const URI = require('common/url-helper');

  // Model
  const EntryModel = Record({
    selected: 0,
    view: WebView.Model,
  }, 'WebView.Entry');

  const Model = Record({
    selected: 0,
    previewed: 0,
    nextID: 0,
    entries: List(EntryModel)
  }, 'WebViews');
  exports.Model = Model;

  // Actions


  const {Open, OpenInBackground, Close} = WebView;
  const {Load} = WebView.Action;


  const SelectByOffset = Record({
    offset: Number,
  }, 'WebViews.SelectByOffset');

  const SelectByID = Record({
    id: String
  }, 'WebViews.SelectByID');

  const SelectByIndex = Record({
    index: Number
  }, 'WebViews.SelectByIndex');

  const PreviewByOffset = Record({
    offset: Number
  }, 'WebViews.PreviewRelative');

  const PreviewByID = Record({
    id: String
  }, 'WebViews.PreviewByID');

  const PreviewByIndex = Record({
    index: Number
  }, 'WebViews.PreviewByIndex');


  const Action = Union({PreviewByIndex, PreviewByID, PreviewByOffset,
                        SelectByIndex, SelectByID, SelectByOffset,
                        Open, OpenInBackground, Close,
                        WebView: WebView.Action});
  exports.Action = Action;


  const byRecency = (a, b) =>
    a.view.id === 'about:dashboard' ? -1 :
    a.selected > b.selected ? -1 :
    a.selected < b.selected ? 1 :
    0;

  const order = entries =>
    entries.filter(entry => entry.view.id !== 'about:dashboard');
    // entries.sort(byRecency);
  exports.order = order;

  // Takes `entires` and a `from` entry (from with in it) and returns
  // an `entry` that is `n` positions away in an ordered `entries`. In other
  // word this function lets find nth item to the left (if n < 0) or right
  // (if n > 0) of the given entry.
  const relativeOf = (entries, from, n) => {
    const loopLength = entries.size;
    const ordered = order(entries);
    const position = ordered.indexOf(from) + n + 1;
    const loops = Math.trunc(position / loopLength);
    return ordered.get(position - loops * loopLength);
  }

  const indexByID = (state, id) =>
    id === '@selected' ? state.selected :
    id === '@previewed' ? state.previewed :
    state.entries.findIndex(({view}) => view.id === id);

  const indexByOffset = ({entries}, index, offset) => {
    const target = relativeOf(entries, entries.get(index), offset);
    return entries.indexOf(target);
  }

  const select = (state, index) => {
    const from = state.getIn(['entries', state.selected, 'view']);
    return state.merge({
      selected: index,
      previewed: index,
      entries: state
                .entries
                .setIn([index, 'selected'], Date.now())
                .setIn([index, 'view', 'shell', 'isFocused'],
                       from.shell.isFocused)
                .setIn([index, 'view', 'input', 'isFocused'],
                       from.input.isFocused)
    });
  };


  const close = (state, id) => {
    const index = indexByID(state, id);
    let target = null
    if (index === state.selected) {
      const selected = state.entries.get(index);
      const ordered = order(state.entries);

      target = selected === ordered.last() ?
               relativeOf(state.entries, selected, -1) :
               relativeOf(state.entries, selected, 1);
    } else {
      target = state.entries.get(state.selected);
    }

    const entries = state.entries.remove(index);
    const selected = entries.indexOf(target);
    return state.merge({entries, selected, previewed: selected});
  }

  const load = (state, action) => {
    const index = indexByID(state, action.id);
    const selected = state.entries.get(index).view;
    return selected.id === 'about:dashboard' ?
            open(state, action.uri) :
           URI.getOrigin(selected.uri) !== URI.getOrigin(action.uri) ?
            open(state, action.uri) :
           state.setIn(['entries', index, 'view'],
                       WebView.update(selected, action));
  };

  const open = (state, uri) => {
    const {selected} = state;
    const selectedView = state.entries.get(selected).view;
    return state.merge({
      nextID: state.nextID + 1,
      selected: state.entries.size,
      previewed: state.selected === state.previewed ? state.entries.size :
                 state.previewed,
      entries: state
                .entries
                .setIn([selected, 'view', 'input', 'isFocused'], false)
                .setIn([selected, 'view', 'shell', 'isFocused'], false)
                .push(EntryModel({
                  selected: Date.now(),
                  view: WebView.Model({
                    uri, id: String(state.nextID),
                    shell: Shell.Model({isFocused: true}),
                  })
                }))
    });
  };

  const openInBackground = (state, uri) => state.merge({
    nextID: state.nextID + 1,
    entries: state.entries.push(Entry.Model({
      view: WebView.Model({uri, id: String(state.nextID)})
    }))
  });

  const updateWebView = (state, action) => {
    const index = indexByID(state, action.id);
    const entry = state.entries.get(index);


    const isFocusChange = action instanceof Shell.Action.Focus ||
                          action instanceof Input.Action.Focus ||
                          action instanceof Input.Action.Enter;

    // If focus is moved to a non selected web-view we do select it.
    if (isFocusChange && state.selected !== index) {
      return state.merge({
        selected: index,
        previewed: index,
        entries: state.entries.set(index, entry.merge({
          selected: Date.now(),
          view: WebView.update(entry.view, action)
        }))
      })
    } else {
      return state.setIn(['entries', index, 'view'],
                         WebView.update(entry.view, action))
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
    action instanceof PreviewByOffset ?
      state.set('previewed', indexByOffset(state, state.previewed, action.offset)) :
    action instanceof PreviewByID ?
      state.set('previewed', indexByID(state, action.id)) :
    action instanceof PreviewByIndex ?
      state.set('previewed', action.index) :
    action instanceof SelectByOffset ?
      select(state, indexByOffset(state, state.selected, action.offset)) :
    action instanceof SelectByID ?
      select(state, indexByID(state, action.id)) :
    action instanceof SelectByIndex ?
      select(state, action.index) :
    WebView.Action.isTypeOf(action) ?
      updateWebView(state, action) :
    state;
  exports.update = update;

  // View

  const view = (state, address) => {
    const selected = state.entries.get(state.selected);

    return html.div({
      key: 'web-views',
      style: {
        transform: `scale(${selected.view.input.isFocused ? 0 : 1})`
      },
    }, state.entries.map(({view}) =>
      render(view.id,
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
