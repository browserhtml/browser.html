/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  // This module provides functions that can can be used to transform
  // data strucutre representing a deck of items in from of Immutable.List
  // or anything compatible like a Cursor to an Immutable.List.
  //
  //
  // Structure is used to represent collection of items where single item
  // from it could be **selected** and / or **active**. In most cases same
  // item will be both **selected** and **active**, although there may
  // be transitive `deq` states where item **active** will be different
  // from **selected** item. Such state represents state of while switching
  // **active** item from currently **active** to currently **selected**.
  // To picture this think of the app switcher UI, quick hits on `cmd tab`
  // (without releasing keys quickly) selects different application but
  // only releasing keys activates selected application.
  //
  // Items inserted will always be append to the tail of the actual data
  // structure. Sorting is supported through `weight` proprty that is
  // assigned & managed by below transformation fucntions.

  const {curry, compose, identity, True, False} = require('lang/functional');

  // Curried function that takes `name -> target` and returns
  // `target.get(name)`. Useful for getting value of the field
  // in immutable data structures and cursors.
  const get = name => target => target.get(name);

  // Function takes `p` predicate and returns a function which
  // returns an index of a first item form given `items` where
  // `p(item)` is logical `true`.
  const findIndex = p => items => items.findIndex(p);

  // High order function that takes predicate `p` function and
  // returns a function which returs a first item from given
  // `items` where `p(item)` is logical `true`.
  const find = p => items => items.find(p);


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

  // `next` and `previous` encode tab switching logic that treats
  // `items` as a loop where last item is followed by the first
  // one.
  const next = (items, item) => {
    return items.last() === item ? items.first() :
           items.get(items.indexOf(item) + 1);
  };

  const previous = (items, item) => {
    return items.first() === item ? item.last() :
           items.get(items.indexOf(item) - 1);
  }

  const transition = (unmark, mark) => (items, from, to) =>
    from == to ? items : items.update(items.indexOf(from), unmark)
                              .update(items.indexOf(to), mark);

  const advance = (transition, from, to) => items => {
    const source = from(items);
    return transition(items, source, to(items, source));
  }

  const asSelected = item => item.update('isSelected', True);
  const asActive = item => item.update('isActive', True);

  const asUnselected = item => item.update('isSelected', False);
  const asInactive = item => item.update('isActive', False);

  const switchSelected = transition(asUnselected, asSelected);
  const switchActive = transition(asInactive, asActive);

  const select = (items, p) =>
    switchSelected(items, selected(items), items.find(p));

  //  Makes an item leading a `selected` item `selected`.
  const selectPrevious = advance(switchSelected,
                                 selected,
                                 previous);

  // Make an item following a `selected` item `selected`.
  const selectNext = advance(switchSelected,
                             selected,
                             next);

  // Makes `active` item `selected`.
  const reset = items => select(items, isActive);

  // Makes `selected` item `active`.
  const activate = (items, p=isSelected) =>
    switchActive(items, active(items), items.find(p));

  // Makes an item following a `selected` item both `selected` & `active`.
  const activateNext = compose(activate, selectNext);
  // Makes an item leading a `selected` item both `selected` & `active`.
  const activatePrevious = compose(activate, selectPrevious);


  // Item is considered pinned if it's `isPinned` is logical `true`.
  const isPinned = item => item.get('isPinned');
  const isntPinned = item => !item.get('isPinned');

  // Updates `items` such that most recently active item will
  // follow the last pinned item.
  const reorder = items => {
    const item = active(items);
    return isPinned(item) ? items :
           include(items.remove(items.indexOf(item)),
                   item,
                   items.findIndex(isntPinned));
  };


  // Take an `items` and optional `p` predicate function and removes
  // first item where `p(item)` is true. If item to be removed happens
  // to be selected or active then it takes care of activating / selecting
  // different item according to logic explained in the inline comments
  // below.
  const remove = (items, p=isActive) => {
    const target = items.find(p);
    const index = items.indexOf(target);
    const isTargetActive = target == active(items);
    const isTargetSelected = target == selected(items);

    if (isTargetActive) {
      if (isTargetSelected) {
        // If target is selected & active item that is also
        // a last one, activate previous and remove the target.
        if (target === items.last()) {
          return activatePrevious(items).remove(index);
        } else {
          // If target is selected & active item but isn't a
          // a last on, activate next & remove the target.
          return activateNext(items).remove(index);
        }
      } else {
        // If target is active but different one is selected then
        // activate selected and remove this item.
        return activate(items).remove(index);
      }
    } else {
      if (isTargetSelected) {
        // If target isn't active but is selected and happens to be the last
        // one, then select previous item and remove target.
        if (target === items.last()) {
          return selectPrevious(items).remove(index);
        } else {
          // If target isn't active but is selected and does not happen to be
          // the last one, then select next item and remove target.
          return selectNext(items).remove(index);
        }
      } else {
        // If target neither selected nor active just remove it.
        return items.remove(index);
      }
    }
  };

  // Utility function that deselects currently selected item. Note that this
  // function will put `items` into state with no selection, there for it must
  // be used as a part of larger transform that will take care of selecting some
  // item. Also note that non of the tranfrom functions can be used on a result
  // of this function as they assume to have a selected item.
  const deselect = items => items.update(indexOfSelected(items), asUnselected);

  // Utility function that deactivates currently active item. Note that this
  // function will put `items` into state with no active `item`, there for it
  // mest be used as a part of larger transform that takes care of activating
  // some `item`. Also keep in mind that most transform function can not be used
  // on a result of this function as they assume to have an active item.
  const deactivate = items => items.update(indexOfActive(items), asInactive);

  const include = (items, item, n) =>
    n === 0 ? items.unshift(item) :
    n < 0 ? items.push(item) :
    n >= items.count() ? items.push(item) :
    items.take(n).push(item).concat(items.skip(n));

  const insert = (items, item, n) => {
    const edit = compose(items => include(items, item, n),
                         isActive(item) ? deactivate : identity,
                         isSelected(item) ? deselect : identity);
    return edit(items);
  }

  const insertBefore = (items, item, p) =>
    insert(items, item, items.findIndex(p));

  const insertAfter = (items, item, p) =>
    insert(items, item, items.findIndex(p) + 1);


  // Exports:

  exports.isSelected = isSelected;
  exports.asSelected = asSelected;
  exports.asUnselected = asUnselected;
  exports.indexOfSelected = indexOfSelected;
  exports.selected = selected;
  exports.select = select;
  exports.reset = reset;
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

  exports.reorder = reorder;

  exports.remove = remove;
  exports.insertAfter = insertAfter;
  exports.insertBefore = insertBefore;

  exports.isPinned = isPinned;
  exports.isntPinned = isntPinned;
});
