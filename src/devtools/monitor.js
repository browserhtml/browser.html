/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*::
import type {Init, Update, View, Model, Action} from "../../type/devtools/monitor";
import type {Effects} from "reflex/type/effects"
*/

import * as Reflex from "reflex";

const forward = Reflex.forward;
const none = Reflex.Effects.none;

export const Enable =
  { type: "Enable"
  }

export const Disable =
  { type: "Disable"
  }

export const Toggle =
  { type: "Toggle"
  }

const ComponentAction = action =>
  ( { type: "Component"
    , source: action
    }
  );


export const initializer = /*::<model, action, init:Init<model, action>>*/
  (init/*:init*/)/*:Init<Model<model>, Action<action>>*/ =>
  (...args) => {
    const [component, fx] = init(...args);
    const monitor =
      { component
      , isEnabled: true
      }

    return [ monitor, fx.map(ComponentAction) ];
  };

const report = (model, action) => {
  console.error('Unknown action was recieved by a monitor ', action);
  return [model, none];
}

const updateComponentWith = (update, model, action) => {
  if (model.isEnabled) {
    console.log('>>> Action:', action);

    if (console.group) {
      console.group();
    }
  }

  const [component, fx] = update(model.component, action);

  if (model.isEnabled) {
    if (console.groupEnd) {
      console.groupEnd();
    }

    console.log('<<< Model: ', component);
    console.log('<<< Effects: ', fx);
  }

  const monitor =
    { component
    , isEnabled: model.isEnabled
    }

  return [ monitor, fx.map(ComponentAction) ];
}

export const updater = /*::<model, action, update:Update<model, action>>*/
  (update/*:update*/)/*:Update<Model<model>, Action<action>>*/ =>
  (model, action) =>
    ( action.type === 'Enable'
    ? [ { isEnabled: true
        , component: model.component
        }
      , none
      ]
    : action.type === 'Disable'
    ? [ { isEnabled: false
        , component: model.component
        }
      , none
      ]
    : action.type === 'Toggle'
    ? [ { isEnabled: !model.isEnabled
        , component: model.component
        }
      , none
      ]
    : action.type === 'Component'
    ? updateComponentWith(update, model, action.source)

    : report(model, action)
    );


export const viewer = /*::<model, action, view:View<model, action>>*/
  (view/*:view*/)/*:View<model, action>*/ =>
  (model, address) =>
  view(model.component, forward(address, ComponentAction));
