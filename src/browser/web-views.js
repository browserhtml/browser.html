/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../type/browser/web-views" */

import {html, thunk, Effects, forward} from "reflex";
import * as Driver from "driver";
import {merge, always} from "../common/prelude";
import * as WebView from "../browser/web-view";
import {Style, StyleSheet} from "../common/style";

export const initial = {
  nextID: 0,
  // @TODO selected field should probably live elsewhere and be maintained
  // by a different component.
  selected: -1,
  active: -1,
  entries: []
};

export const SelectNext = ({
  type: "WebViews.SelectRelative",
  offset: 1
});

export const SelectPrevious = ({
  type: "WebViews.SelectRelative",
  offset: -1
});

export const ActivateSelected = ({
  type: "WebViews.ActivateSelected"
});

export const indexByID/*:type.indexByID*/ = (model, id) =>
  model.entries.findIndex(entry => entry.id === id);

export const open/*:type.open*/ = (model, options) => {
  const next = merge(model, {
    nextID: model.nextID + 1,
    selected: model.selected + 1,
    active: model.active + 1,
    entries: [WebView.open(model.nextID, options), ...model.entries]
  });

  return options.inBackground ?
    next :
    activateByID(next, model.nextID)
};

export const navigateTo = (model, uri) => {
  if (model.active < 0) {
    return [
      open(model, {uri, inBackground: false, name: '', features: ''}),
      Effects.none
    ]
  } else {
    return stepByActive(model, WebView.asLoad(uri))
  }
}

export const indexOfOffset/*:type.indexByOffset*/ = (index, size, offset, loop) => {
  const position = index + offset;
  if (size === 0) {
    return - 1
  } else if (loop) {
    const index = position - Math.trunc(position / size) * size
    return index < 0 ? index + size :  index
  } else {
    return Math.min(size - 1, Math.max(0, position))
  }
}

export const selectByIndex/*:type.selectByIndex*/ = (model, index) => {
  // If selection does not change return model back.
  if (index === model.selected) {
    return [model, Effects.none];
  }
  // if selection is out of the bound log warning and return model back.
  else if (index < 0 || index >= model.entries.length) {
    console.warn(`Can not select WebView under ${index} index as it does not exists`, model);
    return [model, Effects.none];
  }
  else {
    const {selected} = model;
    const entries = model.entries.slice(0);

    // Initially there are no web-views and there for none is selected, we need
    // in such case nothing needs to be unselected.
    if (selected >= 0) {
      const [unselect, unselectFx] = WebView.unselect(entries[selected]);
      const [select, selectFx] = WebView.select(entries[index]);
      entries[selected] = unselect
      entries[index] = select

      return [
        merge(model, {selected: index, entries}),
        Effects.batch([
          unselectFx.map(asByID(unselect.id)),
          selectFx.map(asByID(select.id))
        ])
      ]
    }
    else {
      // Mark web-view we intend to select as selected.
      const [select, fx] = WebView.select(entries[index])
      entries[index] = selected
      return [
        merge(model, {selected: index, entries}),
        fx.map(asByID(select.id))
      ];
    }
  }
}

export const selectByID/*:type.selectByID*/ = (model, id) =>
  selectByIndex(model, indexByID(model, id));

export const selectByOffset/*:type.selectByOffset*/ = (model, offset) =>
  selectByIndex(model, indexOfOffset(model.selected,
                                      model.entries.length,
                                      offset,
                                      true));

export const activateByIndex/*:type.activateByIndex*/ = (model, index) => {
  if (index === model.active) {
    return model
  }
  else if (index < 0 || index >= model.entries.length) {
    console.warn(`Can not activate WebView under ${index} index as it does not exists`, model);
    return model;
  }
  else {
    const {selected, active} = model;
    const entries = model.entries.slice(0);
    const count = entries.length;

    if (selected >= 0 && selected !== index && selected < count) {
      entries[selected] = merge(entries[selected], {isSelected: false});
    }

    if (active >= 0 && active !== index && active < count) {
      entries[active] = WebView.deactivate(entries[active]);
    }

    entries[index] = WebView.activate(merge(entries[index], {isSelected: true}));

    return merge(model, {selected: index, active: index, entries});
  }
}

export const activateSelected/*:type.activateSelected*/ = (model) =>
  activateByIndex(model, model.selected);

export const activateByID/*:type.activateByID*/ = (model, id) =>
  activateByIndex(model, indexByID(model, id));

export const closeByIndex/*:type.closeByIndex*/ = (model, index) => {
  if (index < 0 || index >= model.entries.length) {
    console.warn(`Can not close WebView for the index: ${index}:`, model);
    return model;
  } else {
    const {selected, active, entries} = model;
    const count = entries.length;

    const nextIndex
        // If index of the view being closed comes after the currently selected
        // view, selection index is not affected.
      = index > selected ?
          selected :
        // If index of the view being closed comes before the curretly selected
        // view, selection index is decremented to point to the new index of
        // the view.
        index < selected ?
          selected - 1 :

        // If we got this far than view being closed is currently selected. This
        // case has it's own branched logic described below.

        // If there was only one view than there is no selected view and index
        // is set to -1.
        count === 1 ?
          -1 :
        // If the view being closed is the first one selection is moved to the
        // following view - first view remains selected.
        selected === 0 ?
          0 :
          // Otherwise selection is kept for the same index although actual view
          // will be different.
          selected - 1;

      return activateByIndex(merge(model, {entries: remove(entries, index)}),
                              nextIndex)
  }
};

export const closeActive/*:type.closeActive*/ = model =>
  closeByIndex(model, model.active);

export const closeByID/*:type.closeByID*/ = (model, id) =>
  closeByIndex(model, indexByID(model, id))

export const stepByActive/*:type.stepByActive*/ = (model, action) =>
  action.type === "WebView.Close" ?
    [closeActive(model), Effects.none] :
    stepByIndex(model, model.active, action);

export const stepByID/*:type.stepByActive*/ = (model, id, action) =>
  action.type === "WebView.Activate" ?
    [activateByID(model, id), Effects.none] :
  action.type === "WebView.Close" ?
    [closeByID(model, id), Effects.none] :
  action.type === "WebView.Select" ?
    selectByID(model, id) :
    stepByIndex(model, indexByID(model, id), action);

const remove = (array, index) =>
    index < 0 ?
      array :
    index >= array.length ?
      array :
    index === 0 ?
      array.slice(1) :
    index === array.length - 1 ?
      array.slice(0, index) :
      array.slice(0, index).concat(array.slice(index + 1));

const set = (array, index, item) => {
  const items = array.slice(0)
  items[index] = item
  return items
}

export const getByID = (model, id) =>
  getByIndex(model, id);

export const getActive = (model) =>
  getByIndex(model, model.active);

export const getByIndex = (model, index) =>
  index < 0 ? null :
  index >= model.entries.length ? null :
  model.entries[index];

// Check if active webview is dark.
export const isDark = model => {
  const active = getActive(model);
  return active ? WebView.isDark(active) : false;
}

export const stepByIndex/*:type.stepByIndex*/ = (model, index, action) => {
  const {entries} = model;
  if (index < 0 || index >= entries.length) {
    console.warn(`WebView by index: ${index} is not found:`, model);
    return [model, Effects.none];
  } else {
    const [entry, fx] = WebView.step(entries[index], action);
    return [
      merge(model, {entries: set(entries, index, entry)}),
      fx.map(asByID(entry.id))
    ];
  }
}


export const step/*:type.step*/ = (model, action) => {
  if (action.type === "Focusable.FocusRequest") {
    return stepByActive(model, action);
  }
  if (action.type === "WebViews.NavigateTo") {
    return navigateTo(model, action.uri);
  }
  else if (action.type === "WebViews.Open") {
    return [open(model, action.options), Effects.none];
  }
  else if (action.type === "WebViews.Open!WithMyIFrameAndInTheCurrentTick") {
    return [open(model, action.options), Driver.force];
  }
  else if (action.type === "WebViews.SelectRelative") {
    return selectByOffset(model, action.offset);
  }
  else if (action.type === "WebViews.ActivateSelected") {
    return [activateSelected(model), Effects.none];
  }
  else if (action.type === "WebViews.ByActive") {
    return stepByActive(model, action.action);
  }
  else if (action.type === "WebViews.ByID") {
    return stepByID(model, action.id, action.action);
  }
  else {
    console.warn(`WebViews module does not know how to handle ${action.type}`, action);
    return [model, Effects.none];
  }
}

export const asOpen = ({uri, inBackground, name, features}) => ({
  type: "WebViews.Open",
  options: {
    uri,
    inBackground: inBackground == null ? false : inBackground,
    name: name == null ? '' : name,
    features: features == null ? '' : features
  }
});

export const asByID/*:type.asByID*/
  = id => action => ({type: "WebViews.ByID", id, action});

export const asByActive/*:type.asByActive*/
  = action => ({type: "WebViews.ByActive", action});

export const CloseActive = asByActive(WebView.Close);
export const asCloseActive = always(CloseActive);

export const asNavigateTo/*:type.asNavigateTo*/
  = uri => ({type: "WebViews.NavigateTo", uri});

const style = StyleSheet.create({
  webviews: {
    // @TODO box shadow slows down animations significantly (Gecko)
    // boxShadow: '0 50px 80px rgba(0,0,0,0.25)',
    // @WORKAROUND use percent instead of vw/vh to work around
    // https://github.com/servo/servo/issues/8754
    height: '100%',
    width: '100%',
    left: 0,
    overflow: 'hidden', // necessary to clip the radius
    position: 'absolute', // to position webviews relatively to stack
    top: 0,
    willChange: 'transform',
    // WARNING: will slow down animations! (Gecko)
    // xBorderRadius: '4px',
  }
});

export const view/*:type.view*/ = (model, address, modeStyle) =>
  html.div({
    className: 'webviews-stack',
    style: Style(style.webviews, modeStyle)
  }, model
      .entries
      .map(entry => thunk(entry.id,
                          WebView.view,
                          entry,
                          forward(address, asByID(entry.id)))))
