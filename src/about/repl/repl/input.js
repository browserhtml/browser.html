/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge, always} from "../../../common/prelude";
import {Style, StyleSheet} from '../../../common/style';
import * as Settings from '../../../common/settings';
import * as Unknown from '../../../common/unknown';
import {focus} from "@driver";


import type {Address, DOM} from "reflex"
import type {Model, Action} from "./input"


export const Change =
  (value:string):Action =>
  ( { type: "Change"
    , source: value
    }
  );


export const Submit =
  (model:Model):Action =>
  ( { type: "Submit"
    , source: model
    }
  );

export const Edit:Action = { type: "Edit" };
const Enter = { type: "Enter" };
const Abort = { type: "Abort" };


export const init =
  ( version:number
  , value:string
  , isEditing:boolean
  ):[Model, Effects<Action>] =>
  [ { value
    , isEditing
    , version
    }
  , Effects.none
  ]

const edit =
  model =>
  [ merge
    ( model
    , { isEditing: true
      }
    )
  , Effects.none
  ];

const change = (model, value) =>
  ( model.value !== value
  ? [ merge
      ( model
      , { value
        , version: model.version + 1
        }
      )
    , Effects.none
    ]
  : [ model, Effects.none ]
  );

const abort = (model, value) =>
  [ merge
    ( model
    , { isEditing: false }
    )
  , Effects.none
  ];

const enter =
  model =>
  [ merge
    ( model
    , { isEditing: false }
    )
  , Effects.receive(Submit(model))
  ]

const decodeChange =
  event =>
  Change(event.target.value);

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === "Change"
  ? change(model, action.source)
  : action.type === "Edit"
  ? edit(model)
  : action.type === "Abort"
  ? abort(model)
  : action.type === "Enter"
  ? enter(model)
  : Unknown.update(model, action)
  );

const styleSheet = StyleSheet.create
  ( { base:
      { cursor: 'text'
      , display: 'block'
      , width: '100%'
      , position: 'relative'
      }
    , entry:
      { fontSize: 'inherit'
      , fontFamily: 'inherit'
      , color: 'inherit'
      , background: 'inherit'
      , border: 'none'
      , display: 'block'
      , lineHeight: 'inherit'
      , width: '100%'
      , resize: 'none'
      , padding: '0px'
      , margin: '0px'
      }
    , display:
      { fontSize: 'inherit'
      , fontFamily: 'inherit'
      , color: 'inherit'
      , background: 'inherit'
      , border: 'none'
      , display: 'block'
      , lineHeight: 'inherit'
      , marginBottom: '6px'
      }
    , visible:
      {

      }
    // servo$: display none seems to cause bugs in servo.
    , hidden:
      { zIndex: -1
      , position: 'absolute'
      , opacity: '0'
      }
    }
  );


const render =
  (model, address) =>
  html.section
  ( { className: 'input'
    , style: styleSheet.base
    , onKeyDown: event =>
      ( event.key === 'Escape'
      ? address(Abort)
      : ( event.key === 'Enter' &&
          event.metaKey
        )
      ? address(Enter)
      : null
      )
    }
  , [ html.textarea
      ( { className: 'entry'
        , style: Style
          ( styleSheet.entry
          , ( model.isEditing
            ? styleSheet.visible
            : styleSheet.hidden
            )
          )
        , rows: model.value.split(/\n/).length + 1
        , focus: focus(model.isEditing)
        , onBlur: forward(address, always(Abort))
        , onKeyUp: forward(address, decodeChange)
        , value: model.value
        }
      )
    , html.output
      ( { className: 'display'
        , style: Style
          ( styleSheet.display
          , ( model.isEditing
            ? styleSheet.hidden
            : styleSheet.visible
            )
          )
        , onClick: forward(address, always(Edit))
        }
      , [model.value]
      )
    ]
  );

export const view =
  (model:Model, address:Address<Action>):DOM =>
  thunk('input', render, model, address);
