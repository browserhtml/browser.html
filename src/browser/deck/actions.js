/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  // Return `true` if given deck item is selected one.
  const isSelected = item => item.get('isSelected');

  // Takes `f` edit function and returs the function that
  // takes `items` list and optional `isMatch` function, invoking
  // which will swap first item form items on which
  // `isMatch(item)` is `true` with `f(item)`. If `isMatch` is
  // not provided selected item is swapped.
  const edit = f => (items, isMatch=isSelected) => {
    const index = items.findIndex(isMatch);
    return items.set(index, f(items.get(index)));
  }

  // Takes item and toggles it's selection state, meaning if it is
  // selected it will be updated not to, and if it isn't it will update
  // to be selected.
  const toggle = item => item.set('isSelected', !isSelected(item));
  // Takes `items` and returs the index of the selected one.
  const selectedIndex = items => items.findIndex(isSelected);

  // Takes `items` and returs the selected one.
  const selected = items => items.find(isSelected);

  // Takes `items` and switches selection `from` index `to` given index.
  const switchSelected = (items, from, to) =>
    from == to ? items : items.withMutations(items =>
      items.update(from, toggle)
           .update(to, toggle));
  // Takes `items` and select item next to currently selected one,
  // unless it's last one in which case it selects the first item.
  // If only item is contained nothing happens.
  const selectNext = items => {
    const from = selectedIndex(items);
    const isFromLast = from == items.count() - 1;
    const to = isFromLast ? 0 : from + 1;

    return switchSelected(items, from, to);
  };

  // Takes `items` and selects item previous to currently selected one.
  // If selected item is first item, then last item is selected.
  const selectPrevious = items => {
    const from = selectedIndex(items);
    const isFromFirst = from == 0;
    const to = isFromFirst ? items.count() - 1 : from - 1;

    return switchSelected(items, from, to);
  };

  // Takes `items` and `shouldSelecet` predicate and switches selection
  // from currently selected item to the first item for which `shouldSelect(item)`
  // is true.
  const select = (items, shouldSelect) => {
    const from = items.findIndex(isSelected);
    const to = items.findIndex(shouldSelect);
    return switchSelected(items, from, to);
  };

  // Take an `items` and optionally `shouldClose` function and updates items
  // to exclude first one for which `shouldClose(item)` is `true`. If `shouldClose`
  // is ommited returns items without item that is selected. If item excluded was
  // selected next item will be selected, unless selected item was last in which
  // case previous item will be selected.
  const remove = (items, shouldClose=isSelected) => {
    const closing = items.findIndex(shouldClose);
    const selected = items.findIndex(isSelected);
    const isCLosingSelected = closing == selected;
    const isLast = isCLosingSelected && closing == items.count() - 1;
    const reselected = !isCLosingSelected ? items :
                       isLast ? selectPrevious(items) :
                       selectNext(items);
    return reselected.remove(closing);
  };

  // Returns index of the last item from the given `items`.
  const isLast = (item, items) => item.equals(items.last());

  // Inesrts item after first item for which `shouldFollow(item)` is true,
  // if `shouldFollow` is ommited inserts item after last item.
  const insertAfter = (items, item, shouldFollow=isLast) => items => {
    const after = items.findIndex(item => shouldFollow(item, items));
    return items.slice(0, after).push(item).concat(items.slice(after));
  };

  const append = (items, item) => items.push(item);

  const isFirst = (item, items) => item.equals(items.first());

  // Inesrts item before first item for which `shouldFollow(item)` is true,
  // if `shouldFollow` is ommited inserts item before first item.
  const insertBefore = (items, item, shouldLead=isFirst) => items => {
    const before = items.findIndex(item => shouldLead(item, items));
    return before == 0 ? items.unshift(item) :
           items.slice(0, before - 1).push(item).concat(items.slice(before - 1));
  };

  const prepend = (items, item) => items.unshift(item);

  // Exports:

  exports.isSelected = isSelected;
  exports.edit = edit;
  exports.toggle = toggle;
  exports.selectedIndex = selectedIndex;
  exports.selected = selected;
  exports.switchSelected = switchSelected;
  exports.selectNext = selectNext;
  exports.selectPrevious = selectPrevious;
  exports.select = select;
  exports.remove = remove;
  exports.insertAfter = insertAfter;
  exports.append = append;
  exports.insertBefore = insertBefore;
  exports.prepend = prepend;

});
