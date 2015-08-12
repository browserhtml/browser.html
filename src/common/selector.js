/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

import {Record, Maybe, Union} from '../common/typed';

export const Next = Record({
  description: 'Select an entry following a selected one',
  loop: true
}, 'WebViews.Next');

export const Previous = Record({
  description: 'Select an entry preceeding selected one',
  loop: true
}, 'WebView.Previous');

export const ByOffset = Record({
  description: 'Select an entry by an offset relative to selected one',
  offset: Number,
  loop: true
}, 'Selector.ByOffset');

export const ByIndex = Record({
  description: 'Select an entry with by an entry index',
  index: Number
}, 'Selector.ByIndex');

export const Action = Union({Next, Previous, ByOffset, ByIndex});

// Update

export const indexOfOffset = (index, size, offset, loop) => {
  const position = index + offset;
  if (loop) {
    const index = position - Math.trunc(position / size) * size
    return index < 0 ? index + size :  index
  } else {
    return Math.min(size - 1, Math.max(0, position))
  }
}

export const indexOf = (index, size, action) =>
  action instanceof Next ?
    indexOfOffset(index, size, 1, action.loop) :
  action instanceof Previous ?
    indexOfOffset(index, size, -1, action.loop) :
  action instanceof ByIndex ?
    indexOfOffset(0, size, action.index) :
  action instanceof ByOffset ?
    indexOfOffset(index, size, action.offset, action.loop) :
  state;
