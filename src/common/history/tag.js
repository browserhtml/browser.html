/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import * as Tag from "./tag"
*/

import {merge} from "../../common/prelude";
import {exclude, include} from "../../common/array";


export const init =
  (id/*:Tag.ID*/, name/*:Tag.Name*/)/*:Tag.Model*/ =>
  ( { type: "Tag"
    , _id: id
    , _rev: null
    , name
    , items: []
    }
  );

export const addItem =
  ( _id/*:Tag.ID*/
  , model/*:Tag.Model*/
  )/*:Tag.Model*/ =>
  merge
  ( model
  , { items:
      ( model.items.indexOf(_id) < 0
      ? [...model.items, _id]
      : model.items
      )
    }
  );

export const removeItem =
  ( _id/*:Tag.ID*/
  , model/*:Tag.Model*/
  )/*:Tag.Model*/ =>
  merge
  ( model
  , { items: exclude(_id, model.items)
    }
  );

export const addTag = /*::<item:Tag.Target>*/
  ( name/*:Tag.Name*/
  , target/*:item*/
  )/*:item*/ =>
  merge
  ( target
  , { tags: include(name, target.tags)
    }
  );

export const removeTag = /*::<item:Tag.Target>*/
  ( name/*:Tag.Name*/
  , target/*:item*/
  )/*:item*/ =>
  merge
  ( target
  , { tags: exclude(name, target.tags)
    }
  );

export const tag = /*::<item:Tag.Target>*/
  (item/*:item*/, tag/*:Tag.Model*/)/*:[item, Tag.Model]*/ =>
  [ addTag(tag.name, item)
  , addItem(item._id, tag)
  ];


export const untag = /*::<item:Tag.Target>*/
  (item/*:item*/, tag/*:Tag.Model*/)/*:[item, Tag.Model]*/ =>
  [ removeTag(tag.name, item)
  , removeItem(item._id, tag)
  ];
