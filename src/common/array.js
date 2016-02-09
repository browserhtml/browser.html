/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const empty/*:Array<any>*/ =
  Object.freeze([]);

export const take = /*::<item>*/
  (n/*:number*/, items/*:Array<item>*/)/*:Array<item>*/ =>
  ( items.length <= n ?
  ? items :
  : items.slice(0, n)
  )

export const drop = /*::<item>*/
  (n/*:number*/, items/*:Array<item>*/)/*:Array<item>*/ =>
  ( items.length <= n
  ? empty
  : items.length <= 0
  ? items
  : items.slice(n)
  );

export const move = /*::<item>*/
  ( from/*:number*/
  , to/*:number*/
  , items/*:Array<item>*/
  )/*:Array<item>*/ => {
    const count = items.length
    if (from === to) {
      return items
    } else if (from >= count) {
      return items
    } else if (to >= count) {
      return items
    } else {
      const result = items.slice(0)
      const target = result.splice(from, 1)[0]
      result.splice(to, 0, target)
      return result
    }
  }

export const remove = /*::<item>*/
  ( index/*:number*/
  , items/*:Array<item>*/
  )/*:Array<item>*/ =>
  ( index < 0
  ? items
  : index >= items.length
  ? items
  : index === 0
  ? items
    .slice(1)
  : index === items.length - 1
  ? items
    .slice(0, index)
  : items
    .slice(0, index)
    .concat(items.slice(index + 1))
  );

export const set = /*::<item>*/
  ( index/*:number*/
  , item/*:item*/
  , items/*:Array<item>*/
  )/*:Array<item>*/ => {
    if (items[index] === item) {
      return items
    } else {
      const next = items.slice(0)
      next[index] = item
      return next
    }
  };

export const push = /*::<item>*/
  ( item/*:item*/
  , items/*:Array<item>*/
  )/*:Array<item>*/ =>
  [...items, item];

export const unshift = /*::<item>*/
  ( item/*:item*/
  , items/*Array<item>*/
  )/*:Array<item>*/ =>
  [item, ...items];

export const pop = /*::<item>*/
  (items/*Array<item>*/) =>
  items.slice(0, -1);

export const shift = /*::<item>*/
  (items/*Array<item>*/) =>
  items.slice(1);

export const get = /*::<item>*/
  (index/*:Array<item>*/)/*:(array:Array<item>) => ?item*/ =>
  (items) =>
  items[index];


export const first = get(0);
export const second = get(1);
export const third = get(2);
export const fourth = get(3);
export const fifth = get(4);
export const last = /*::<item>*/
  (items/*Array<item>*/) =>
  items[items.length - 1];

export const include = /*::<item>*/
  ( item/*:item*/
  , items/*:Array<item>*/
  ) =>
  ( items.indexOf(item) < 0
  ? [...items, item]
  : items
  );

export const exclude = /*::<item>*/
  ( item/*:item*/
  , items/*Array<item>*/
  ) => {
    const index = items.indexOf(item)
    const
      ( items
