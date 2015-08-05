/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

  const composedStyles = Object.create(null);

  const ID = Symbol('style-sheet/id');
  var id = 0;

  class StyleSheet {
    constructor(sheet) {
      for (var name in sheet) {
        const style = sheet[name]
        if (style && typeof(style) === 'object' && sheet.hasOwnProperty(name)) {
          style[ID] = ++id;
          this[name] = style;
        }
      }
    }
    static create(sheet) {
      return new this(sheet);
    }
  }
  exports.StyleSheet = StyleSheet;

  const Style = (...styles) => {
    var id = '0';

    var length = styles.length;
    var index = 0;
    while (index < length) {
      const style = styles[index];
      if (style) {
        if (style[ID]) {
          id = id ? `${id}+${style[ID]}` : id;
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

    if (id && !composedStyles[id]) {
      composedStyles[id] = Object.assign({[ID]: id}, ...styles);
    }

    return composedStyles[id] || Object.assign({}, ...styles);
  }
  exports.Style = Style;

  exports.StyleSheet = StyleSheet
