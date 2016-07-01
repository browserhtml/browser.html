/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge, batch, tag, tagged} from "../../../common/prelude";
import {Style, StyleSheet} from '../../../common/style';
import * as Unknown from '../../../common/unknown';
import {cursor} from '../../../common/cursor';
import * as Input from './input';
import * as Output from './output';


import type {Address, DOM} from "reflex"

export type ID = string

export type Model =
  { id: ID
  , input: Input.Model
  , output: Output.Model
  }

export type Action =
  | { type: "Remove" }
  | { type: "Print", print: Output.Model }
  | { type: "Submit", submit: Input.Model }
  | { type: "Output", output: Output.Action }
  | { type: "Input", input: Input.Action }


export const Print =
  (output:Output.Model):Action =>
  ( { type: "Print"
    , print: output
    }
  )

export const Remove:Action =
  { type: "Remove"
  }

const InputAction =
  (action:Input.Action):Action =>
  ( action.type === "Submit"
  ? { type: "Submit"
    , submit: action.submit
    }
  : { type: "Input"
    , input: action
    }
  );

const OutputAction =
  (action:Output.Action):Action =>
  ( { type: "Output"
    , output: action
    }
  );

export const Edit:Action =
  InputAction(Input.Edit);


export const init =
  (id:ID):[Model, Effects<Action>] => {
    const [input, inputFX] = Input.init(0, '', true);
    const [output, outputFX] = Output.init(0);
    const model =
      { id
      , input
      , output
      };

    const fx = Effects.batch
      ( [ inputFX.map(InputAction)
        , outputFX.map(OutputAction)
        ]
      );

    return [model, fx];
  };

const updateInput = cursor
  ( { get: model => model.input
    , set: (model, input) => merge(model, {input})
    , tag: InputAction
    , update: Input.update
    }
  );

const updateOutput = cursor
  ( { get: model => model.output
    , set: (model, output) => merge(model, {output})
    , tag: OutputAction
    , update: Output.update
    }
  );

const print =
  (model, output) =>
  updateOutput
  ( model
  , { type: "Print"
    , source: output
    }
  );

const submit =
  (model, input) =>
  updateInput
  ( model
  , { type: "Submit"
    , submit: input
    }
  );

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === 'Input'
  ? updateInput(model, action.input)
  : action.type === 'Submit'
  ? submit(model, action.submit)
  : action.type === 'Output'
  ? updateOutput(model, action.output)
  : action.type === 'Print'
  ? print(model, action.print)
  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create
  ( { base:
      { padding: '10px'
      , whiteSpace: 'pre'
      , borderLeft: '3px solid'
      , borderColor: '#073642'
      , borderLeftColor: '#073642'
      , borderBottom: '1px dotted #073642'
      , position: 'relative'
      }
    , editing:
      { borderLeftColor: '#586e75'
      }
    , displaying:
      {
      }
    , modified:
      { borderLeftColor: '#b58900'
      }
    , saved:
      {
      }
    }
  );


export const render =
  (model:Model, address:Address<Action>):DOM =>
  html.form
  ( { id: `cell-${model.id}`
    , style: Style
      ( styleSheet.base
      , ( model.input.isEditing
        ? styleSheet.editing
        : styleSheet.displaying
        )
      , ( model.input.version !== model.output.version
        ? styleSheet.modified
        : styleSheet.saved
        )
      )
    , onSubmit:
        event =>
        event.preventDefault()
    }
  , [ Input.view(model.input, forward(address, InputAction))
    , Output.view(model.output, forward(address, OutputAction))
    ]
  );

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk(model.id, render, model, address);
