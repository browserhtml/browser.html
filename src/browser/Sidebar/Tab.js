/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import * as Style from '../../common/style';
import * as Image from '../../common/image';
import * as Target from "../../common/target";
import * as Unknown from "../../common/unknown";
import * as Page from '../Navigators/Navigator/WebView/Page';

import {always, merge, mapFX, nofx} from '../../common/prelude';
import {readTitle} from '../Navigators/Navigator/WebView/Util';
import {cursor} from '../../common/cursor';


import type {Address, DOM} from "reflex"
import type {Model as NavigatorModel} from "../Navigators/Navigator"
import type {ID} from "../../common/prelude"

export type Context =
  { tabWidth: number
  , titleOpacity: number
  }

export type Action =
  | { type: "Close" }
  | { type: "Select" }
  | { type: "Page", page: Page.Action }
  | { type: "Target", target: Target.Action }

export class Model {

  isPointerOver: boolean;

  constructor(isPointerOver:boolean) {
    this.isPointerOver = isPointerOver
  }
}

const over = new Model(true)
const out = new Model(false)
const transactOver = [over, Effects.none];
const transactOut = [out, Effects.none];

export const Close = {type: "Close"};
export const Select = {type: "Select"};
export const Activate = {type: "Activate"};

const TargetAction = action =>
  ( { type: "Target"
    , target: action
    }
  );

const PageAction = action =>
  ( { type: "Page"
    , page: action
    }
  );


const updateTarget =
  (model, action) =>
  ( action.type === "Over"
  ? transactOver
  : transactOut
  )

const updatePage = nofx

const Out = TargetAction(Target.Out);
const Over = TargetAction(Target.Over);

export const init =
  ():[Model, Effects<Action>] =>
  transactOut;

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] => {
    switch (action.type) {
      case "Target":
        return updateTarget(model, action.target)
      case "Page":
        return updatePage(model, action.page)
      default:
        return Unknown.update(model, action)
    }
  }

const tabHeight = '32px';

const styleSheet = Style.createSheet({
  base: {
    MozWindowDragging: 'no-drag',
    WebkitAppRegion: 'no-drag',
    borderRadius: '5px',
    height: tabHeight,
    overflow: 'hidden',
    color: '#fff',
    cursor: 'pointer'
  },

  container: {
    height: tabHeight,
    lineHeight: tabHeight,
    width: '288px',
    fontSize: '14px',
    overflow: 'hidden',
    position: 'relative'
  },

  selected: {
    backgroundColor: 'rgb(86,87,81)'
  },
  unselected: {
  },

  title: {
    display: 'block',
    margin: '0 10px 0 32px',
    overflow: 'hidden',
    width: '246px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },



  closeMask: {
    color: 'inherit',
    fontFamily: 'FontAwesome',
    fontSize: '12px',
    lineHeight: tabHeight,
    textAlign: 'center',

    background: `linear-gradient(
      to right,
      rgba(39,40,34,0) 0%,
      rgba(39,40,34, 0.8) 20%,
      rgba(39,40,34,1) 100%)`,
    width: tabHeight,
    height: tabHeight,
    position: 'absolute',
    padding: 0,
    margin: 0,
    top: 0,
    transition: `right 400ms cubic-bezier(0.215, 0.610, 0.355, 1.000),
                color 300ms ease-out`
  },

  closeMaskSelected: {
    background: `linear-gradient(
      to right,
      rgba(86,87,81,0) 0%,
      rgba(86,87,81, 0.8) 20%,
      rgba(86,87,81,1) 100%)`,
  },
  closeMaskUnselected: {

  },

  closeMaskHidden: {
    right: '-21px',
    pointerEvents: 'none',
    // Transitioning color or opacity seems to cause rendering bugs
    // See: https://github.com/browserhtml/browserhtml/issues/1048
    // color: 'rgba(255, 255, 255, 0)'
  },

  closeMaskVisible: {
    right: 0,
    // Transitioning color or opacity seems to cause rendering bugs
    // See: https://github.com/browserhtml/browserhtml/issues/1048
    // color: 'rgba(255, 255, 255, 1)'
  },

  closeIcon: {
    color: 'inherit',
    fontFamily: 'FontAwesome',
    fontSize: '12px',
    width: tabHeight,
    height: tabHeight,
    lineHeight: tabHeight,
    textAlign: 'center'
  }
});


// TODO: Use button widget instead.
const viewClose = (isSelected, tab, address) =>
  html.button
  ( { className: 'tab-close-mask'
    , style:
        Style.mix
        ( styleSheet.closeMask
        , ( isSelected
          ? styleSheet.closeMaskSelected
          : styleSheet.closeMaskUnselected
          )
        , ( tab.isPointerOver
          ? styleSheet.closeMaskVisible
          : styleSheet.closeMaskHidden
          )
        )
    , onClick:
        event => {
          // Should prevent propagation so that tab won't trigger
          // Activate action when close button is clicked.
          event.stopPropagation();
          address(Close);
        }
    }
  , ['']
  );

export const render =
  ( model:NavigatorModel
  , address:Address<Action>
  , {tabWidth, titleOpacity}:Context
  ):DOM =>
  html.div
  ( { className: 'sidebar-tab'
    , style: Style.mix
      ( styleSheet.base
      , ( model.isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      , { width: `${tabWidth}px` }
      )
    , onMouseOver: forward(address, always(Over))
    , onMouseOut: forward(address, always(Out))
    , onClick: forward(address, always(Select))
    }
  , [ html.div
      ( { className: 'sidebar-tab-inner'
        , style: styleSheet.container
        }
      , [ Page.viewIcon(model.output.page, forward(address, PageAction))
        , html.div
          ( { className: 'sidebar-tab-title'
            , style:
              Style.mix
              ( styleSheet.title
              , { opacity: titleOpacity }
              )
            }
            // @TODO localize this string
          , [ readTitle(model.output, 'Untitled')
            ]
          )
        , ( model.isPinned
          ? ""
          : thunk('close', viewClose, model.isSelected, model.output.tab, address)
          )
        ]
      )
    ]
  );


export const view =
  ( model:NavigatorModel
  , address:Address<Action>
  , context:Context
  ):DOM =>
  thunk
  ( `${model.output.ref.value}`
  , render
  , model
  , address
  , context
  )
