/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define((require, exports, module) => {

  'use strict';

  const {Record, List, Typed, Type, Any, Union, Maybe} = require('typed-immutable/index');

  const isTypeOf = function(value) {
    for (var Type of this.variants) {
      if (value instanceof Type) {
        return true
      }
      else if (Type.isTypeOf && Type.isTypeOf(value)) {
        return true
      }
    }
    return false
  }

  const TypeUnion = types => {
    const variants = [];
    const Type = function(value) {
      return prototype[Typed.read](value);
    }
    Type.variants = variants;
    Type.isTypeOf = isTypeOf;

    for (var name in types) {
      if (types.hasOwnProperty(name) &&
          name[0].toUpperCase() === name[0])
      {
        const type = types[name]
        variants.push(type);
        Type[name] = type;
      }
    }

    const prototype = Union(...variants);
    Type.toString = prototype[Type.typeName];
    Type.prototype = prototype;

    return Type;
  }

  exports.Record = Record;
  exports.List = List;
  exports.Typed = Typed;
  exports.Type = Type;
  exports.Any = Any;
  exports.Maybe = Maybe;
  exports.Union = TypeUnion;
})
