/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


export type Name = string

export type Value
  = string
  | number
  | boolean

export type Selector = string

export type Rules =
  { [key:Name]: Value }

export type Sheet =
  {[key:Selector]: ?Rules}


const composedStyles = Object.create(null);

// Flow's support for computed properties is weak, especially for symbols.
// There for we trick flow into thinking that `ID` is a string.
// See: https://github.com/facebook/flow/issues/252
const ID = Symbol('style-sheet/id')/*::.toString()*/;
var id = 0;

export const StyleSheet = {
  create: <sheet:Sheet>(sheet:sheet):sheet => {
    // @FlowIssue: Flow does not seem to get it's same type.
    const result:sheet = {}
    for (var name in sheet) {
      if (sheet.hasOwnProperty(name)) {
        const style = sheet[name]
        if (typeof(style) === 'object' && style != null) {
          style[ID] = ++id;
          result[name] = style;
        }
        else {
          result[name] = style;
        }
      }
    }

    return result
  }
}

// Mix multiple style objects together. Will memoize the combination of styles
// to minimize object creation. Returns style object that is the result of
// mixing styles together.
export function mix(...styles:Array<?Rules>):Rules {
  var length = styles.length;
  var index = 0;
  var id:?string = null;
  while (index < length) {
    const style = styles[index];
    if (style) {
      if (style[ID]) {
        id = id ? `${String(id)}+${String(style[ID])}` : String(style[ID]);
      } else if (typeof(style) === "object") {
        id = null;
      } else {
        throw TypeError(`Style may only be given objects and falsy values`);
      }
      index = index + 1;
    } else {
      styles.splice(index, 1);
      length = length - 1;
    }
  }

  const composedStyle:?Rules =
    ( id != null
    ? composedStyles[id]
    : null
    );

  if (composedStyle != null) {
    return composedStyle
  }
  else if (id != null) {
    const composedStyle = Object.assign({}, ...styles);
    composedStyle[ID] = id;
    composedStyles[id] = composedStyle;
    return composedStyle;
  }
  else {
    const composedStyle = Object.assign({}, ...styles);
    composedStyle[ID] = null;
    return composedStyle;
  }
}

export const Style = mix

export const createSheet = StyleSheet.create
