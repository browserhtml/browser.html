/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Style, StyleSheet} from '../../common/style';
import {html, thunk, forward, Effects} from 'reflex';
import {compose} from '../../lang/functional';
import {merge, always, tagged, batch} from "../../common/prelude"
import {cursor} from "../../common/cursor"
import {ok, error} from "../../common/result";
import * as Unknown from '../../common/unknown';
import * as Focusable from '../../common/focusable';
import * as Editable from '../../common/editable';
import * as TextInput from '../../common/text-input';


import type {Address, DOM} from "reflex";
import type {Value} from '../../common/settings';

export type {Value}
export type Model =
  { value: Value
  , input: TextInput.Model
  , isValid: boolean
  , isEditing: boolean
  }

export type Action =
  | { type: "Edit" }
  | { type: "Abort" }
  | { type: "Submit" }
  | { type: "Save"
    , save: Value
    }
  | { type: "Change"
    , change: Value
    }
  | { type: "TextInput"
    , textInput: TextInput.Action
    }


const TextInputAction =
  (action:TextInput.Action):Action =>
  ( action.type === "Blur"
  ? Abort
  : { type: "TextInput"
    , textInput: action
    }
  );


export const Edit:Action = { type: "Edit" };
export const Abort:Action = { type: "Abort" };
export const Submit:Action = { type: "Submit" };

const Save =
  action =>
  ( { type: "Save"
    , save: action
    }
  );

export const Change =
  (action:Value):Action =>
  ( { type: "Change"
    , change: action
    }
  );

const FocusInput:Action = TextInputAction(TextInput.Focus);
const DisableInput:Action = TextInputAction(TextInput.Disable);
const EnableInput:Action = TextInputAction(TextInput.Enable);
const ChangeInput = compose(TextInputAction, TextInput.Change);



export const init =
  (value:Value):[Model, Effects<Action>] => {
    const [input, fx] = TextInput.init
      ( ( value == null
        ? ''
        : JSON.stringify(value)
        )
      , null
      , ''
      , true
      );

    const model =
      { value
      , input
      , isValid: true
      , isEditing: false
      };

    return [ model, fx.map(TextInputAction) ];
  }

const edit = model =>
  batch
  ( update
  , merge(model, {isEditing: true, isValid: true})
  , [ EnableInput
    , FocusInput
    ]
  );

const abort = model =>
  batch
  ( update
  , merge(model, {isEditing: false})
  , [ DisableInput
    , ChangeInput
      ( model.value == null
      ? ''
      : JSON.stringify(model.value)
      )
    ]
  );

const submit = model => {
  const change = parseInput(model.input.value);
  const result =
    ( change.isOk
    ? [ merge(model, {isEditing: false})
      , Effects.receive(Save(change.value))
      ]
    : [ merge(model, {isValid: false})
      , Effects.none
      ]
    );

  return result
};


const change = (model, value) =>
  batch
  ( update
  , ( merge
      ( model
      , { value
        , isEditing: false
        , isValid: true
        }
      )
    )
  , [ DisableInput
    , ChangeInput
      ( value == null
      ? `""`
      : JSON.stringify(value)
      )
    ]
  );

const updateTextInput = cursor
  ( { get: model => model.input
    , set: (model, input) => merge(model, {input})
    , tag: TextInputAction
    , update: TextInput.update
    }
  );

const parseInput =
  input => {
    try {
      return ok(JSON.parse(input));
    } catch (reason) {
      return error(reason);
    }
  };

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === 'Edit'
  ? edit(model)
  : action.type === 'Abort'
  ? abort(model)
  : action.type === 'Submit'
  ? submit(model)
  : action.type === 'Save'
  ? change(model, action.save)
  : action.type === 'Change'
  ? change(model, action.change)
  : action.type === 'TextInput'
  ? updateTextInput(model, action.textInput)
  : Unknown.update(model, action)
  );


const styleSheet = StyleSheet.create
  ( { json: {}
    , string: {}
    , number:
      { border: 'none'
      , backgroundColor: 'inherit'
      , color: 'inherit'
      }
    , boolean:
      { cursor: 'pointer'
      , textDecoration: 'underline'
      }
    , hidden:
      { display: "none"
      }
    , visible:
      {}
    }
  );


const viewNumber = (value, address, contextStyle) =>
  html.input
  ( { type: 'number'
    , style: Style(styleSheet.number, contextStyle)
    , value
    , onClick:
      event =>
        ( event.altKey
        ? address(Edit)
        : null
        )
    , onChange:
      event =>
        address(Save(event.target.valueAsNumber))
    }
  );

const viewString = (value, address, contextStyle) =>
  html.code
  ( { style: Style(styleSheet.string, contextStyle)
    , onClick: forward(address, always(Edit))
    }
  , [ `"${value}"`
    ]
  );

const viewBoolean = (value, address, contextStyle) =>
  html.code
  ( { style: Style(styleSheet.boolean, contextStyle)
    , onClick:
      event =>
        ( event.altKey
        ? address(Edit)
        : address(Save(!value))
        )
    }
  , [ value.toString()
    ]
  );

const viewJSON = (value, address, contextStyle) =>
  html.code
  ( { style: Style(styleSheet.json, contextStyle)
    , onClick: forward(address, always(Edit))
    }
  , [ JSON.stringify(value)
    ]
  );

const viewValue = (value, address, contextStyle) => {
  switch (typeof(value)) {
    case "number":
      return viewNumber(value, address, contextStyle)
    case "string":
      return viewString(value, address, contextStyle)
    case "boolean":
      return viewBoolean(value, address, contextStyle)
    default:
      return viewJSON(value, address, contextStyle)
  }
}

const viewInput = TextInput.view
  ( "input"
  , StyleSheet.create
    ( { base:
        { fontFamily: 'inherit'
        , fontSize: 'inherit'
        , color: 'inherit'
        , width: 'calc(100% - 10px)'
        , border: 'none'
        , backgroundColor: 'rgba(255,255,255,0.2)'
        , color: 'rgba(255,255,255,0.7)'
        , borderRadius: '5px 5px 5px 5px'
        , padding: 5
        }
      , enabled:
        {
        }
      , disabled:
        { display: 'none'

        }
      }
    )
  );


export const view =
  (model:Model, address:Address<Action>):DOM =>
  html.form
  ( { onKeyDown:
      event => {
        ( event.key === 'Enter'
        ? address(Submit)
        : event.key === 'Escape'
        ? address(Abort)
        : null
        )
      }
    , onSubmit:
        event => {
          event.preventDefault();
        }
    }
  , [ thunk
      ( 'value'
      , viewValue
      , model.value
      , address
      , ( model.isEditing
        ? styleSheet.hidden
        : styleSheet.visible
        )
      )
    , thunk
      ( 'input'
      , viewInput
      , model.input
      , forward(address, TextInputAction)
      )
    ]
  )
