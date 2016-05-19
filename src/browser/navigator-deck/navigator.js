/* @flow */

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
import * as Header from './navigator/Header';

import {readTitle, isSecure, isDark, canGoBack} from './navigator/web-view/util';

/*::
import type {Address, DOM} from "reflex"
import type {ID, URI} from "./navigator/web-view"

export type Flags =
  { id: ID
  , output: Output.Flags
  , input: Input.Flags
  , overlay: Overlay.Flags
  , assistant: Assistant.Flags
  }

export type Action =
  | { type: "NoOp" }

  // Card
  | { type: "Deactivate" }
  | { type: "Activate" }
  | { type: "Deselect" }
  | { type: "Select" }
  | { type: "Close" }


  // Input
  | { type: "CommitInput" }
  | { type: "SubmitInput" }
  | { type: "EscapeInput" }
  | { type: "FocusInput" }
  | { type: "AbortInput" }
  | { type: "SuggestNext" }
  | { type: "SuggestPrevious" }
  | { type: "Input", input: Input.Action }

  // Output
  | { type: "GoBack" }
  | { type: "FocusOutput" }
  // | { type: "PushedDown" }
  | { type: "Output", output: Output.Action }

  // Assistant
  | { type: "Suggest", suggest: Assistant.Suggestion }
  | { type: "Assistant", assistant: Assistant.Action }

  // Overlay
  | { type: "Overlay", overlay: Overlay.Action }

  // Header
  | { type: "ShowTabs" }
  | { type: "OpenNewTab" }
  | { type: "EditInput" }
  | { type: "Header", header: Header.Action }

  // Internal
  | { type: "ActivateAssistant"}
  | { type: "DeactivateAssistant" }
  | { type: "SetSelectedInputValue", value: string }

  // // Embedder
  | { type: "Navigate", uri: URI }
  | { type: "Open", options: Output.Options }
*/

const SubmitInput = { type: "SubmitInput" }
const EscapeInput = { type: "EscapeInput" }
const FocusInput = { type: "FocusInput" }
const CommitInput = { type: "CommitInput" }
const SuggestNext = { type: "SuggestNext" }
const SuggestPrevious = { type: "SuggestPrevious" }
const GoBack = { type: "GoBack" }
const OpenNewTab = { type: "OpenNewTab"};
const AbortInput = { type: "AbortInput" };

const tagInput =
  action => {
    switch (action.type) {
      case "Submit":
        return SubmitInput
      case "Abort":
        return EscapeInput
      case "Focus":
        return FocusInput
      case "Query":
        return CommitInput
      case "SuggestNext":
        return SuggestNext
      case "SuggestPrevious":
        return SuggestPrevious
      default:
        return { type: 'Input', input: action }
    }
  }

const tagAssistant =
  action => {
    switch (action.type) {
      case "Suggest":
        return { type: "Suggest", suggest: action.suggest }
      default:
        return { type: "Assistant", assistant: action }
    }
  }

const tagOverlay =
  action => {
    switch (action.type) {
      default:
        return { type: "Overlay", overlay: action }
    }
  }


const tagOutput =
  action => {
    switch (action.type) {
      case "Create":
        return OpenNewTab
      case "Focus":
        return FocusOutput
      case "Close":
        return Close;
      case "Open":
        return { type: "Open", options: action.options }
      default:
        return { type: "Output", output: action }
    }
  };

const tagHeader =
  action => {
    switch (action.type) {
      case "EditInput":
        return EditInput
      case "ShowTabs":
        return ShowTabs
      case "OpenNewTab":
        return OpenNewTab
      case "GoBack":
        return GoBack
      default:
        return { type: "Header", header: action }
    }
  }


const ShowTabs = { type: "ShowTabs" };
const OpenNewTab = { type: "OpenNewTab"};
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

export class Model {
  /*::
  id: ID;
  output: Output.Model;
  input: Input.Model;
  overlay: Overlay.Model;
  assistant: Assistant.Model;
  */
  constructor(
    id/*:ID*/
  , input/*:Input.Model*/
  , output/*:Output.Model*/
  , assistant/*:Assistant.Model*/
  , overlay/*:Overlay.Model*/
  ) {
    this.id = id
    this.input = input
    this.output = output
    this.assistant = assistant
    this.overlay = overlay
  }
}

const assemble =
  ( id
  , [input, $input]
  , [output, $output]
  , [assistant, $assistant]
  , [overlay, $overlay]
  ) => {
    const model = new Model
      ( id
      , input
      , output
      , assistant
      , overlay
      )

    const fx = Effects.batch
      ( [ $input.map(tagInput)
        , $output.map(tagOutput)
        , $overlay.map(tagOverlay)
        , $assistant.map(tagAssistant)
        ]
      )

    return [model, fx]
  }

export const init =
  (options/*:Flags*/)/*:[Model, Effects<Action>]*/ =>
  assemble
  ( options.id
  , Input.init(options.input)
  , Output.init(options.id, options.output)
  , Assistant.init(options.assistant)
  , Overlay.init(options.overlay)
  )

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    console.log(action)
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
      case 'AbortInput':
        return abortInput(model);
      case 'SuggestNext':
        return suggestNext(model);
      case 'SuggestPrevious':
        return suggestPrevious(model);
      case 'Input':
        return updateInput(model, action.input);

      // Output
      case 'GoBack':
        return goBack(model);
      case 'FocusOutput':
        return focusOutput(model);
      case 'EditInput':
        return editInput(model);
      case 'Output':
        return updateOutput(model, action.output);

      // Assistant
      case 'Suggest':
        return suggest(model, action.suggest);
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
    , AbortInput
    , FocusOutput
    ]
  );

const focusInput =
  model =>
  updateInput(model, Input.Focus);

const abortInput =
  model =>
  updateInput(model, Input.Abort);


const suggestNext =
  model =>
  updateAssistant(model, Assistant.SuggestNext);

const suggestPrevious =
  model =>
  updateAssistant(model, Assistant.SuggestPrevious);

const focusOutput =
  model =>
  updateOutput(model, Output.Focus);

const goBack =
  model =>
  updateOutput(model, Output.GoBack);

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
    , set:
      (model, input) =>
      new Model
      ( model.id
      , input
      , model.output
      , model.assistant
      , model.overlay
      )
    , update: Input.update
    , tag: tagInput
    }
  );

const updateOutput = cursor
  ( { get: model => model.output
    , set:
      (model, output) =>
      new Model
      ( model.id
      , model.input
      , output
      , model.assistant
      , model.overlay
      )
    , update: Output.update
    , tag: tagOutput
    }
  );

const updateAssistant = cursor
  ( { get: model => model.assistant
    , set:
      (model, assistant) =>
      new Model
      ( model.id
      , model.input
      , model.output
      , assistant
      , model.overlay
      )
    , update: Assistant.update
    , tag: tagAssistant
    }
  );

const updateOverlay = cursor
  ( { get: model => model.overlay
    , set:
      (model, overlay) =>
      new Model
      ( model.id
      , model.input
      , model.output
      , model.assistant
      , overlay
      )
    , update: Overlay.update
    , tag: tagOverlay
    }
  );

export const render =
  (model/*:Model*/, address/*:Address<Action>*/)/*:DOM*/ =>
  html.dialog
  ( { className: `navigator id-${model.id} ${mode(model.output)}`
    , open: true
    , style: Style.mix
      ( styleSheet.base
      , ( isDark(model.output)
        ? styleSheet.dark
        : styleSheet.bright
        )
      , styleBackground(model.output)
      )
    }
  , [ Header.view
      ( readTitle(model.output, 'Untitled')
      , isSecure(model.output)
      , canGoBack(model.output)
      , forward(address, tagHeader)
      )
    , Input.view(model.input, forward(address, tagInput))
    , Assistant.view(model.assistant, forward(address, tagAssistant))
    , Output.view(model.output, forward(address, tagOutput))
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
      , background: 'white'
      , display: 'block'
      }
    , dark:
      { color: 'rgba(255, 255, 255, 0.8)'
      , borderColor: 'rgba(255, 255, 255, 0.2)'
      }
    , bright:
      { color: 'rgba(0, 0, 0, 0.8)'
      , borderColor: 'rgba(0, 0, 0, 0.2)'
      }
    }
  );

const styleBackground =
  model =>
  ( model.page.pallet.background
  ? { backgroundColor: model.page.pallet.background
    }
  : null
  )

const mode =
  model =>
  ( isDark(model)
  ? 'dark'
  : 'bright'
  )
