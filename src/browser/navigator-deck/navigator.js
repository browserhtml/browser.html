/* @noflow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, forward, thunk} from "reflex"
import {merge, always, batch} from "../../common/prelude";
import {cursor} from "../../common/cursor";
import * as Style from "../../common/style";

import * as Assistant from "./navigator/assistant";
import * as Overlay from './navigator/overlay';
import * as Input from "./navigator/input";
import * as Output from "./navigator/web-view";
import * as Unknown from "../../common/unknown";
import * as URL from '../../common/url-helper';

/*::
import type {Address, DOM} from "reflex"
import type {ID, URI} from "./web-view"

export type Options =
  { id: ID
  , output: Output.Options
  , input: Input.Flags;
  , overlay: Overlay.Flags;
  , assistant: Assistant.Flags;
  }

export type Model  =
  { id: ID
  , input: Input.Model
  , output: Output.Model
  , overlay: Overlay.Model
  , assistant: Assistant.Model
  }

export type Action =
  | { type: "NoOp" }

  // Input
  | { type: "CommitInput" }
  | { type: "SubmitInput" }
  | { type: "EscapeInput" }
  | { type: "FocusInput" }
  | { type: "SuggestNext" }
  | { type: "SuggestPrevious" }
  | { type: "Input", input: Input.Action }

  // Output
  | { type: "FocusOutput" }
  | { type: "ShowTabs" }
  | { type: "CreateTab" }
  | { type: "EditInput" }
  | { type: "PushedDown" }
  | { type: "Output", output: Output.Action }

  // Assistant
  | { type: "Suggest", suggestion: Assistant.Suggestion }
  | { type: "Assistant", assistant: Assistant.Action }

  // Internal
  | { type: "ActivateAssistant"}
  | { type: "DeactivateAssistant" }
  | { type: "SetSelectedInputValue", value: string }

  // Embedder
  | { type: "Navigate", uri: URI }
  | { type: "Close" }
  | { type: "Open", options: Output.Options }
*/

const TagInput = action =>
  ( action.type === "Submit"
  ? SubmitInput
  : action.type === 'Abort'
  ? EscapeInput
  : action.type === 'Focus'
  ? FocusInput
  : action.type === 'Query'
  ? CommitInput
  : action.type === 'SuggestNext'
  ? SuggestNext
  : action.type === 'SuggestPrevious'
  ? SuggestPrevious
  : { type: 'Input'
    , input: action
    }
  );

const SubmitInput = { type: "SubmitInput" };
const EscapeInput = { type: "EscapeInput" };
const FocusInput = { type: "FocusInput" };
const CommitInput = { type: "CommitInput" };
const SuggestNext = { type: "SuggestNext" };
const SuggestPrevious = { type: "SuggestPrevious" };


const TagAssistant =
  action =>
  ( action.type === 'Suggest'
  ? { type: "Suggest"
    , suggestion: action.source
    }
  : { type: "Assistant"
    , assistant: action
    }
  );

const TagOutput =
  action =>
  ( action.type === 'ShowTabs'
  ? ShowTabs
  : action.type === "Create"
  ? CreateTab
  : action.type === "Edit"
  ? EditInput
  : action.type === "Focus"
  ? FocusOutput
  : action.type === "Close"
  ? Close
  : action.type === "Open"
  ? { type: "Open", options: action.options }
  : { type: "Output", output: action }
  );

const ShowTabs = { type: "ShowTabs" };
const CreateTab = { type: "CreateTab"};
const EditInput = { type: "EditInput" };
const FocusOutput = { type: "FocusOutput" };
const BlurOutput = { type: "BlurOutput" };
const Close = { type: "Close" };

export const Navigate =
  ( destination/*:string*/)/*:Action*/ =>
  ( { type: "Navigate"
    , uri: URL.read(destination)
    }
  )

const ActivateAssistant = { type: "ActivateAssistant" }
const DeactivateAssistant = { type: "DeactivateAssistant" }

const SetSelectedInputValue =
  value =>
  ( { type: "SetSelectedInputValue"
    , value
    }
  )


export const init =
  (options/*:Options*/)/*:[Model, Effects<Action>]*/ => {
    const id = options.id;
    const [input, $input] = Input.init(false, false, options.input);
    const [output, $output] = Output.init(id, options.output);
    const [assistant, $assistant ] = Assistant.init(options.assistant);
    const [overlay, $overlay ] = Overlay.init(options.overlay);
    const model =
      { id
      , input
      , output
      , overlay
      , assistant
      }

    const fx = Effects.batch
      ( [ $input.map(TagInput)
        , $output.map(TagOutput)
        , $assistant.map(TagAssistant)
        ]
      )

    return [model, fx]
  }

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case 'NoOp':
        return nofx(model);

      // Input
      case 'CommitInput':
        return commitInput(model);
      case 'SubmitInput':
        return submitInput(model);
      case 'EscapeInput':
        return escapeInput(model);
      case 'FocusInput':
        return focusInput(model);
      case 'SuggestNext':
        return suggestNext(model);
      case 'SuggestPrevious':
        return suggestPrevious(model);
      case 'Input':
        return updateInput(model, action.input);

      // Output
      case 'FocusOutput':
        return focusOutput(model);
      case 'EditInput':
        return editInput(model);
      case 'Output':
        return updateOutput(model, action.output);

      // Assistant
      case 'Suggest':
        return suggest(model, action.suggestion);
      case 'Assistant':
        return updateAssistant(model, action.assistant);

      // Internal
      case 'ActivateAssistant':
        return activateAssistant(model);
      case 'DeactivateAssistant':
        return deactivateAssistant(model);
      case 'SetSelectedInputValue':
        return setSelectedInputValue(model, action.value);

      default:
        return Unknown.update(model, action);
    }
  };

const nofx =
  model =>
  [ model
  , Effects.none
  ];

const commitInput =
  model =>
  updateAssistant
  ( model
  , Assistant.Query(model.input.value)
  )

const submitInput =
  model =>
  batch
  ( update
  , model
  , [ FocusOutput
    , Navigate(model.input.value)
    ]
  );

const escapeInput =
  model =>
  batch
  ( update
  , model
  , [ DeactivateAssistant
    , FocusOutput
    ]
  );

const focusInput =
  model =>
  updateInput(model, Input.Focus);

const suggestNext =
  model =>
  updateAssistant(model, Assistant.SuggestNext);

const suggestPrevious =
  model =>
  updateAssistant(model, Assistant.SuggestPrevious);

const focusOutput =
  model =>
  updateOutput(model, Output.Focus);


const editInput =
  model =>
  batch
  ( update
  , model
  , [ FocusInput
    , ActivateAssistant
      // @TODO: Do not use `model.output.navigation.currentURI` as it ties it
      // to webView API too much.
    , SetSelectedInputValue(model.output.navigation.currentURI)
    ]
  )

const suggest =
  (model, suggestion) =>
  updateInput
  ( model
  , Input.Suggest
    ( { query: model.assistant.query
      , match: suggestion.match
      , hint: suggestion.hint
      }
    )
  )

const activateAssistant =
  model =>
  updateAssistant
  ( model
  , Assistant.Open
  )

const deactivateAssistant =
  model =>
  updateAssistant
  ( model
  , Assistant.Close
  )

const setSelectedInputValue =
  (model, value) =>
  updateInput
  ( model
  , Input.EnterSelection(value)
  )

const updateInput = cursor
  ( { get: model => model.input
    , set: (model, input) => merge(model, {input})
    , update: Input.update
    , tag: TagInput
    }
  );

const updateOutput = cursor
  ( { get: model => model.output
    , set: (model, output) => merge(model, {output})
    , update: Output.update
    , tag: TagOutput
    }
  );

const updateAssistant = cursor
  ( { get: model => model.assistant
    , set: (model, assistant) => merge(model, {assistant})
    , update: Assistant.update
    , tag: TagAssistant
    }
  );


export const render =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.div
  ( { className: `navigator-${model.id}`
    , style: styleSheet.base
    }
  , [ Input.view(model.input, forward(address, TagInput))
    , Assistant.view(model.assistant, forward(address, TagAssistant))
    , Output.view(model.output, forward(address, TagOutput))
    ]
  )

export const view =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  thunk
  ( model.id
  , render
  , model
  , address
  )

const styleSheet = Style.createSheet
  ( { base:
      { width: '100%'
      , height: '100%'
      , position: 'absolute'
      , top: 0
      , left: 0
      , overflow: 'hidden'
      }
    }
  );
