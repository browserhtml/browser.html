/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, html, forward, thunk} from "reflex"
import {merge, always, batch, nofx} from "../../common/prelude";
import {cursor} from "../../common/cursor";
import * as Style from "../../common/style";

import * as Assistant from "./Navigator/Assistant";
import * as Overlay from "./Navigator/Overlay";
import * as Input from "./Navigator/Input";
import * as Output from "./Navigator/WebView";
import * as Unknown from "../../common/unknown";
import * as URL from '../../common/url-helper';
import * as Header from './Navigator/Header';
import * as Title from './Navigator/Title';
import * as Progress from './Navigator/Progress';
import * as Display from './Navigator/Display';
import * as Animation from "../../common/Animation";
import * as Easing from "eased";
import * as Tab from "../Sidebar/Tab";
import * as Runtime from '../../common/runtime';
import type {Report} from "../IssueReporter";

import {readTitle, isSecure, isDark, canGoBack} from './Navigator/WebView/Util';


import type {Address, DOM} from "reflex"
import type {URI, Time} from "./Navigator/WebView"

export type Flags =
  { output: Output.Flags
  , isPinned?: boolean
  , isInputEmbedded?: boolean
  , input?: Input.Flags
  , overlay?: Overlay.Flags
  , assistant?: Assistant.Flags
  }

export type Action =
  | { type: "NoOp" }

  // Card
  | { type: "Deselect" }
  | { type: "Select" }
  | { type: "Close" }
  | { type: "Closed" }

  // Title
  | { type: "EditInput" }

  // Input
  | { type: "CommitInput" }
  | { type: "SubmitInput" }
  | { type: "EscapeInput" }
  | { type: "ActivateInput" }
  | { type: "AbortInput" }
  | { type: "SuggestNext" }
  | { type: "SuggestPrevious" }
  | { type: "CancelSuggestion" }
  | { type: "Input", input: Input.Action }

  // Output
  | { type: "GoBack" }
  | { type: "GoForward" }
  | { type: "Reload" }
  | { type: "ZoomIn" }
  | { type: "ZoomOut" }
  | { type: "ResetZoom" }
  | { type: "ActivateOutput" }
  | { type: "LoadStart", time: Time }
  | { type: "Connect", time: Time }
  | { type: "LoadEnd", time: Time }
  | { type: "Crash", crash: Report }

  | { type: "Output", output: Output.Action }

  // Assistant
  | { type: "Suggest", suggest: Assistant.Match }
  | { type: "Assistant", assistant: Assistant.Action }

  // Overlay
  | { type: "Overlay", overlay: Overlay.Action }
  | { type: "HideOverlay" }
  | { type: "ShowOverlay" }

  // Progress
  | { type: "Progress", progress: Progress.Action }

  // Header
  | { type: "ShowTabs" }
  | { type: "OpenNewTab" }
  | { type: "EditInput" }
  | { type: "Header", header: Header.Action }

  // Internal
  | { type: "ActivateAssistant"}
  | { type: "DeactivateAssistant" }
  | { type: "ResetAssistant" }
  | { type: "SetSelectedInputValue", value: string }

  // Embedder
  | { type: "Navigate", uri: URI }
  | { type: "Open", open: Flags }

  | { type: "Tab", tab: Tab.Action }

  // Animation
  | { type: "Animation", animation: Animation.Action }
  | { type: "AnimationEnd" }


const SubmitInput = { type: "SubmitInput" }
const EscapeInput = { type: "EscapeInput" }
const ActivateInput = { type: "ActivateInput" }
const CommitInput = { type: "CommitInput" }
const SuggestNext = { type: "SuggestNext" }
const SuggestPrevious = { type: "SuggestPrevious" }
const CancelSuggestion = { type: "CancelSuggestion" }
export const GoBack = { type: "GoBack" }
export const GoForward = { type: "GoForward" }
export const Reload = { type: "Reload" }
export const ZoomOut = { type: "ZoomOut" }
export const ZoomIn = { type: "ZoomIn" }
export const ResetZoom = { type: "ResetZoom" }

const ShowTabs = { type: "ShowTabs" };
const OpenNewTab = { type: "OpenNewTab"};
export const EditInput = { type: "EditInput" };
const ActivateOutput = { type: "ActivateOutput" };
const AbortInput = { type: "AbortInput" };
const HideOverlay = { type: "HideOverlay" };
const ShowOverlay = { type: "ShowOverlay" };

export const Close = { type: "Close" };
export const Closed = { type: "Closed" };
export const Deactivate = { type: "Deactivate" }
export const Activate = { type: "Activate" }
export const Deselect = { type: "Deselect" }
export const Select = { type: "Select" }
export const FocusInput = { type: "Input", input: Input.Activate }
export const HideInput = { type: "Input", input: Input.Hide }
export const FocusOutput = { type: "Output", output: Output.Focus }
export const ClearInput = { type: "Input", input: Input.Clear }

const tagInput =
  action => {
    switch (action.type) {
      case "Submit":
        return SubmitInput
      case "Abort":
        return EscapeInput
      case "Activate":
        return ActivateInput
      case "Query":
        return CommitInput
      case "SuggestNext":
        return SuggestNext
      case "SuggestPrevious":
        return SuggestPrevious
      case "CancelSuggestion":
        return CancelSuggestion;
      default:
        return { type: 'Input', input: action }
    }
  }

const tagAssistant =
  action => {
    switch (action.type) {
      case "Suggest":
        return { type: "Suggest", suggest: action.suggest }
      case "Load":
        return { type: "Navigate", uri: action.load }
      default:
        return { type: "Assistant", assistant: action }
    }
  }

const tagOverlay =
  action => {
    switch (action.type) {
      case "Click":
        return EscapeInput
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
        return ActivateOutput
      case "Close":
        return Close;
      case "Open":
        return { type: "Open", open: { output: action.options } }
      case "LoadStart":
        return action
      case "Connect":
        return action
      case "LoadEnd":
        return action
      case "Crash":
        return action;
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

const tagTitle =
  always({ type: "EditInput" });

const tagProgress =
  action =>
  ( { type: "Progress"
    , progress: action
    }
  )


const tagAnimation =
  action => {
    switch (action.type) {
      case "End":
        return { type: "AnimationEnd" };
      default:
        return { type: "Animation", animation: action }
    }
  };

export const Navigate =
  ( destination:string):Action =>
  ( { type: "Navigate"
    , uri: URL.read(destination)
    }
  )

const ActivateAssistant = { type: "ActivateAssistant" }
const DeactivateAssistant = { type: "DeactivateAssistant" }
const ResetAssistant = { type: "ResetAssistant" }

const SetSelectedInputValue =
  value =>
  ( { type: "SetSelectedInputValue"
    , value
    }
  )

export class Model {

  isSelected: boolean;
  isClosed: boolean;
  isPinned: boolean;
  isInputEmbedded: boolean;
  output: Output.Model;
  input: Input.Model;
  overlay: Overlay.Model;
  assistant: Assistant.Model;
  progress: Progress.Model;
  animation: Animation.Model<Display.Model>;

  constructor(
    isSelected:boolean
  , isClosed:boolean
  , isPinned:boolean
  , isInputEmbedded:boolean
  , input:Input.Model
  , output:Output.Model
  , assistant:Assistant.Model
  , overlay:Overlay.Model
  , progress:Progress.Model
  , animation:Animation.Model<Display.Model>
  ) {
    this.isSelected = isSelected
    this.isClosed = isClosed
    this.isPinned = isPinned
    this.isInputEmbedded = isInputEmbedded
    this.input = input
    this.output = output
    this.assistant = assistant
    this.overlay = overlay
    this.progress = progress
    this.animation = animation
  }
}

const assemble =
  ( isSelected
  , isClosed
  , isPinned
  , isInputEmbedded
  , [input, $input]
  , [output, $output]
  , [assistant, $assistant]
  , [overlay, $overlay]
  , [progress, $progress]
  , [animation, $animation]
  ) => {
    const model = new Model
      ( isSelected
      , isClosed
      , isPinned
      , isInputEmbedded
      , input
      , output
      , assistant
      , overlay
      , progress
      , animation
      )

    const fx = Effects.batch
      ( [ $input.map(tagInput)
        , $output.map(tagOutput)
        , $overlay.map(tagOverlay)
        , $assistant.map(tagAssistant)
        , $progress.map(tagProgress)
        , $animation.map(tagAnimation)
        ]
      )

    return [model, fx]
  }


export const init =
  (options:Flags):[Model, Effects<Action>] =>
  assemble
  ( options.output.disposition != 'background-tab'
  , false
  , options.isPinned === true
  , options.isInputEmbedded === true
  , Input.init(options.input)
  , Output.init(options.output)
  , Assistant.init(options.assistant)
  , Overlay.init(options.overlay && !options.isInputEmbedded)
  , Progress.init()
  , Animation.init
    ( options.output.disposition != 'background-tab'
    ? Display.selected
    : Display.deselected
    )
  )

export const update =
  ( model:Model
  , action:Action
  ):[Model, Effects<Action>] => {
    switch (action.type) {
      case 'NoOp':
        return nofx(model);

      case 'Navigate':
        return navigate(model, action.uri);

      case 'Select':
        return select(model);
      case 'Deselect':
        return deselect(model);
      case 'Close':
        return close(model);

      // Input
      case 'CommitInput':
        return commitInput(model);
      case 'SubmitInput':
        return submitInput(model);
      case 'EscapeInput':
        return escapeInput(model);
      case 'ActivateInput':
        return activateInput(model);
      case 'AbortInput':
        return abortInput(model);
      case 'SuggestNext':
        return suggestNext(model);
      case 'SuggestPrevious':
        return suggestPrevious(model);
      case 'CancelSuggestion':
        return cancelSuggestion(model);
      case 'Input':
        return updateInput(model, action.input);
      case 'Tab':
        return updateOutput(model, action);

      // Output
      case "GoBack":
        return updateOutput(model, Output.GoBack);
      case "GoForward":
        return updateOutput(model, Output.GoForward);
      case "Reload":
        return updateOutput(model, Output.Reload);
      case "ZoomIn":
        return updateOutput(model, Output.ZoomIn);
      case "ZoomOut":
        return updateOutput(model, Output.ZoomOut);
      case "ResetZoom":
        return updateOutput(model, Output.ResetZoom);

      case 'ActivateOutput':
        return activateOutput(model);
      case 'EditInput':
        return editInput(model);
      case "LoadStart":
        return updateLoadProgress(model, action);
      case "Connect":
        return updateLoadProgress(model, action);
      case "LoadEnd":
        return updateLoadProgress(model, action);
      case 'Output':
        return updateOutput(model, action.output);

      // Progress
      case 'Progress':
        return updateProgress(model, action.progress);

      // Assistant
      case 'Suggest':
        return suggest(model, action.suggest);
      case 'Assistant':
        return updateAssistant(model, action.assistant);

      case 'Overlay':
        return updateOverlay(model, action.overlay);
      case 'HideOverlay':
        return updateOverlay(model, Overlay.Hide);
      case 'ShowOverlay':
        return updateOverlay(model, Overlay.Show);

      // Internal
      case 'ActivateAssistant':
        return activateAssistant(model);
      case 'DeactivateAssistant':
        return deactivateAssistant(model);
      case 'ResetAssistant':
        return resetAssistant(model);
      case 'SetSelectedInputValue':
        return setSelectedInputValue(model, action.value);

      case 'Animation':
        return updateAnimation(model, action.animation);
      case 'AnimationEnd':
        return endAnimation(model);

      default:
        return Unknown.update(model, action);
    }
  };

export const select =
  ( model:Model
  ):[Model, Effects<Action>] =>
  ( model.isSelected
  ? nofx(model)
  : startAnimation
    ( model
    , true
    , model.isClosed
    , Animation.transition
      ( model.animation
      , Display.selected
      , 80
      )
    )
  )

export const deselect =
  ( model:Model
  ):[Model, Effects<Action>] =>
  ( model.isSelected
  ? startAnimation
    ( model
    , false
    , model.isClosed
    , Animation.transition
      ( model.animation
      , Display.deselected
      , 80
      )
    )
  : nofx(model)
  )

export const close =
  ( model:Model
  ):[Model, Effects<Action>] =>
  ( model.isPinned
  ? [ model
    , Effects.receive(Select)
    ]
  : model.isSelected
  ? startAnimation
    ( model
    , false
    , true
    , Animation.transition
      ( model.animation
      , Display.closed
      , 80
      )
    )
  : [ model
    , Effects.receive(Closed)
    ]
  )

const navigate =
  (model, uri) =>
  ( model.isPinned
  ? open(model, uri)
  : updateOutput
    ( model
    , Output.Load(uri)
    )
  )

const open =
  (model, uri) => {
    const [next, fx1] = escapeInput(model)
    const fx2 = Effects.receive
      ( { type: "Open"
        , open:
          { output:
            { uri
            , disposition: 'default'
            , name: ''
            , features: ''
            , ref: null
            , guestInstanceId: null
            }
          }
        }
      )

    const fx = Effects.batch
      ( [ fx1
        , fx2
        ]
      )

    return [next, fx]
  }


const commitInput =
  model =>
  updateAssistant
  ( model
  , ( model.input.query === ""
    ? Assistant.Clear
    : Assistant.Query(model.input.query, !model.input.deleting)
    )
  )

const submitInput =
  model =>
  batch
  ( update
  , model
  , [ ResetAssistant
    , FocusOutput
    , Navigate(model.input.edit.value)
    ]
  );

const escapeInput =
  model =>
  ( model.isInputEmbedded
  ? batch
    ( update
    , model
    , [ DeactivateAssistant
      , FocusOutput
      , HideOverlay
      , ClearInput
      ]
    )
  : batch
    ( update
    , model
    , [ DeactivateAssistant
      , AbortInput
      , FocusOutput
      , HideOverlay
      , ClearInput
      ]
    )
  );


const activateInput =
  model =>
  ( model.isInputEmbedded
  ? batch
    ( update
    , model
    , [ FocusInput
      , ActivateAssistant
      ]
    )
  : batch
    ( update
    , model
    , [ FocusInput
      , ActivateAssistant
      , ShowOverlay
      ]
    )
  )

const abortInput =
  model =>
  updateInput(model, Input.Abort);


const suggestNext =
  model =>
  updateAssistant(model, Assistant.SuggestNext);

const cancelSuggestion =
  model =>
  updateAssistant(model, Assistant.Deselect);

const suggestPrevious =
  model =>
  updateAssistant(model, Assistant.SuggestPrevious);

const activateOutput =
  model =>
  batch
  ( update
  , model
  , [ FocusOutput
    , EscapeInput
    ]
  )

const goBack =
  model =>
  updateOutput(model, Output.GoBack);

const updateLoadProgress =
  (source, action) => {
    const [output, output$] = Output.update(source.output, action)
    const [progress, progress$] = Progress.update(source.progress, action)
    const model = new Model
    ( source.isSelected
    , source.isClosed
    , source.isPinned
    , source.isInputEmbedded
    , source.input
    , output
    , source.assistant
    , source.overlay
    , progress
    , source.animation
    )
    const fx = Effects.batch
    ( [ output$.map(tagOutput)
      , progress$.map(tagProgress)
      ]
    )

    return [model, fx]
  }


const editInput =
  model =>
  batch
  ( update
  , model
  , [ ActivateInput
      // @TODO: Do not use `model.output.navigation.url` as it ties it
      // to webView API too much.
    , ( model.isInputEmbedded
      ? SetSelectedInputValue('')
      : SetSelectedInputValue(model.output.navigation.url)
      )
    ]
  )

const suggest =
  (model, suggestion) =>
  updateInput
  ( model
  , Input.Suggest(suggestion)
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

const resetAssistant =
  model =>
  updateAssistant
  ( model
  , Assistant.Reset
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
      ( model.isSelected
      , model.isClosed
      , model.isPinned
      , model.isInputEmbedded
      , input
      , model.output
      , model.assistant
      , model.overlay
      , model.progress
      , model.animation
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
      ( model.isSelected
      , model.isClosed
      , model.isPinned
      , model.isInputEmbedded
      , model.input
      , output
      , model.assistant
      , model.overlay
      , model.progress
      , model.animation
      )
    , update: Output.update
    , tag: tagOutput
    }
  );

const updateProgress = cursor
  ( { get: model => model.progress
    , set:
      (model, progress) =>
      new Model
      ( model.isSelected
      , model.isClosed
      , model.isPinned
      , model.isInputEmbedded
      , model.input
      , model.output
      , model.assistant
      , model.overlay
      , progress
      , model.animation
      )
    , update: Progress.update
    , tag: tagProgress
    }
  );

const updateAssistant = cursor
  ( { get: model => model.assistant
    , set:
      (model, assistant) =>
      new Model
      ( model.isSelected
      , model.isClosed
      , model.isPinned
      , model.isInputEmbedded
      , model.input
      , model.output
      , assistant
      , model.overlay
      , model.progress
      , model.animation
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
      ( model.isSelected
      , model.isClosed
      , model.isPinned
      , model.isInputEmbedded
      , model.input
      , model.output
      , model.assistant
      , overlay
      , model.progress
      , model.animation
      )
    , update: Overlay.update
    , tag: tagOverlay
    }
  );

const animate =
  (animation, action) =>
  Animation.updateWith
  ( Easing.easeOutCubic
  , Display.interpolate
  , animation
  , action
  )

const updateAnimation = cursor
  ( { get: model => model.animation
    , set:
      (model, animation) =>
        new Model
        ( model.isSelected
        , model.isClosed
        , model.isPinned
        , model.isInputEmbedded
        , model.input
        , model.output
        , model.assistant
        , model.overlay
        , model.progress
        , animation
        )
    , tag: tagAnimation
    , update: animate
    }
  )

const startAnimation =
  (model, isSelected, isClosed, [animation, fx]) =>
  [ new Model
    ( isSelected
    , isClosed
    , model.isPinned
    , model.isInputEmbedded
    , model.input
    , model.output
    , model.assistant
    , model.overlay
    , model.progress
    , animation
    )
  , fx.map(tagAnimation)
  ]

const endAnimation =
  model =>
  ( model.isClosed
  ? [ model
    , Effects.receive(Closed)
    ]
  : nofx(model)
  )

export const render =
  (model:Model, address:Address<Action>):DOM =>
  html.dialog
  ( { className: `navigator ${mode(model.output)}`
    , open: true
    , style: Style.mix
      ( styleSheet.base
      , ( isDark(model.output)
        ? styleSheet.dark
        : styleSheet.bright
        )
      , ( model.isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      , ( Runtime.env.tabswitch === 'xfade'
        ? model.animation.state
        : null
        )
      , styleBackground(model.output)
      )
    }
  , [ Output.view(model.isSelected, model.output, forward(address, tagOutput))
    , Overlay.view(model.overlay, forward(address, tagOverlay))
    , Assistant.view(model.assistant, forward(address, tagAssistant))
    , Header.view
      ( canGoBack(model.output)
      , forward(address, tagHeader)
      )
    , Title.view
      ( model.input.isVisible
      , readTitle(model.output, 'Untitled')
      , isSecure(model.output)
      , forward(address, tagTitle)
      )
    , Progress.view(model.progress, forward(address, tagProgress))
    , Input.view(model.input, forward(address, tagInput))
    ]
  )

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk
  ( model.output.ref.value
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
      , backgroundColor: 'white'
      , display: 'block'
      , borderRadius: Runtime.useNativeTitlebar() ? '0' : '4px'
      , transitionProperty: 'background-color, color, border-color'
      , transitionTimingFunction: 'ease-in, ease-out, ease'
      , transitionDuration: '300ms'
      }
    , selected:
      { zIndex: 2
      }
    , unselected:
      { zIndex: 1
      , visibility: 'hidden'
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
