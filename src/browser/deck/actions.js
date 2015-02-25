/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {curry, compose, identity, True, False} = require('lang/functional');

  // Curried function that takes `name -> target` and returns
  // `target.get(name)`. Useful for getting value of the field
  // in immutable data structures and cursors.
  const get = curry((name, target) => target.get(name));

  // Curried function that takes `p -> items` and returs
  // `items.findIndex(p)` useful for finding index of item in
  // immutable collections and cursors.
  const findIndex = curry((p, items) => items.findIndex(p));

  // High oreder function that takes `p -> items` returns
  // `items.find(p)` useful for finding item in the immutable
  // collections and cursors.
  const find = curry((p, items) => items.find(p));


  // ## Overview
  //
  // Below function are used transforming state of the deck which
  // is represented as an immutable collection of items. API is
  // designed such that single item in the collection can be
  // **active** (visible web viewer is an example of active item).
  // Also single item can be **selected**, selected item may not
  // be an active item, since selection is used to represent transitive
  // state (ctl+tab selects a tab while release of keys activates
  // seleceted tab).

  // True if given item is active.
  const isActive = get('isActive');
  // True if given item is selected.
  const isSelected = get('isSelected');

  // Returuns index of active item from given deck `items`.
  const indexOfActive = findIndex(isActive);

  // Returns index of selected item from given deck `items`.
  const indexOfSelected = findIndex(isSelected);

  // Returns active item from a given deck `items`.
  const active = find(isActive);

  // Returns selected item from a given deck `items`.
  const selected = find(isSelected);


  // `indexOfNext` and `indexOfPrevious` encode tab switching logic that takes
  // into account weather given `index` matches first / last item in the deck
  // `items`.
  const indexOfNext = (items, index) => {
    const isLast = index == items.count() - 1;
    return isLast ? 0 : index + 1;
  };

  const indexOfPrevious = (items, index) => {
    const isFirst = index == 0;
    return isFirst ? items.count() - 1 : index - 1;
  }

  const transition = (unmark, mark) => (items, from, to) =>
    from == to ? items : items.update(from, unmark).update(to, mark);

  const advance = (transition, indexOfFrom, indexOfTo) => items => {
    const from = indexOfFrom(items);
    const to = indexOfTo(items, from);
    return transition(items, from, to);
  };

  const asSelected = item => item.update('isSelected', True);
  const asActive = item => item.update('isActive', True);

  const asUnselected = item => item.update('isSelected', False);
  const asInactive = item => item.update('isActive', False);

  const switchSelected = transition(asUnselected, asSelected);
  const switchActive = transition(asInactive, asActive);

  const select = (items, item) =>
    switchSelected(items, indexOfSelected(items), items.indexOf(item));

  // Takes `items` and selects item previous to currently selected one.
  // If selected item is first item, then last item is selected.
  const selectPrevious = advance(switchSelected,
                                 indexOfSelected,
                                 indexOfPrevious);
  const selectNext = advance(switchSelected,
                             indexOfSelected,
                             indexOfNext);

  // Takes deck `items` and activates selected item.
  const activate = items => {
    const from = indexOfActive(items);
    const to = indexOfSelected(items);

    return switchActive(items, from, to);
  }

  const activateNext = compose(activate, selectNext);
  const activatePrevious = compose(activate, selectPrevious);

  // Take an `items` and optional `p` predicate function and removes
  // first item where `p(item)` is true. If item to be removed happens
  // to be selected or active then it takes care of activating / selecting
  // different item according to logic explained in the inline comments
  // below.
  const remove = (items, p=exports.isActive) => {
    const target = items.findIndex(p);
    const selected = indexOfSelected(items);
    const active = indexOfActive(items);

    const isActive = target == active;
    const isSelected = target == selected;
    const isLast = target == items.count() - 1;

    if (isActive) {
      if (isSelected) {
        // If target is selected & active item that is also
        // a last one, activate previous and remove the target.
        if (isLast) {
          return activatePrevious(items).remove(target);
        }
        // If target is selected & active item but isn't a
        // a last on, activate next & remove the target.
        else {
          return activateNext(items).remove(target);
        }
      }
      // If target is active but different one is selected then
      // activate selection and remove this item.
      else {
        return activate(items).remove(target);
      }
    } else {
      if (isSelected) {
        // If target isn't active but is selected and happens to be the last
        // one, then select previous item and remove target.
        if (isLast) {
          return selectPrevious(items).remove(target);
        }
        // If target isn't active but is selected and does not happen to be
        // the last one, then select next item and remove target.
        else {
          return selectNext(items).remove(target);
        }
      }
      // If target neither selected nor active just remove it.
      else {
        return items.remove(target);
      }
    }
  };

  // Utility function that deselects currently selected item. Note that this
  // function will put `items` into state with no selection, there for it must
  // be used as a part of larger transform that will take care of selecting some
  // item. Also note that non of the tranfrom functions can not be used on a result
  // of this function as they assume to have a selected item.
  const deselect = items => items.update(indexOfSelected(items), asUnselected);

  // Utility function that deactivates currently active item. Note that this
  // function will put `items` into state with no active `item`, there for it
  // mest be used as a part of larger transform that takes care of activating
  // some `item`. Also keep in mind that most transform function can not be used
  // on a result of this function as they assume to have an active item.
  const deactivate = items => items.update(indexOfActive(items), asInactive);

  const insert = (items, item, index) => {
    // Define a composed function that transforms given `items` in three
    // steps (Note that compose is from right to left):
    // 1. If given `item` is marked as active, deactivate item from `items`
    //    that is active, otherwise use `identity` function to pass `items`
    //    as is to a next step.
    // 2. If give `item` is marked selected, deselect item from the `items`
    //    that is selected, otherwise use `identity` function to pass `items`
    //    as is to a next step.
    // 3. Inject item into a given `index`.
    const update = compose(items => items.splice(index, 0, item),
                           isSelected(item) ? deselect : identity,
                           isActive(item) ? deactivate : identity);

    return update(items);
  }

  // Appends `item` to the deck `items`. If appended `item` is marked
  // as `selected` or `active` also takes care of
  const append = (items, item) => insert(items, item, items.count());

  const prepend = (items, item) => insert(items, item, 0);

  // Exports:

  exports.isSelected = isSelected;
  exports.asSelected = asSelected;
  exports.asUnselected = asUnselected;
  exports.indexOfSelected = indexOfSelected;
  exports.selected = selected;
  exports.select = select;
  exports.selectNext = selectNext;
  exports.selectPrevious = selectPrevious;

  exports.isActive = isActive;
  exports.asActive = asActive;
  exports.asInactive = asInactive;
  exports.indexOfActive = indexOfActive;
  exports.active = active;
  exports.activate = activate;
  exports.activateNext = activateNext;
  exports.activatePrevious = activatePrevious;

  exports.remove = remove;
  exports.insert = insert;
  exports.append = append;
  exports.prepend = prepend;
});
