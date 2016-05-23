/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import * as Style from '../../common/style';
import * as Image from '../../common/image';
import * as Target from "../../common/target";
import * as Unknown from "../../common/unknown";

import {always, merge} from '../../common/prelude';
import {readTitle, readFaviconURI} from '../navigator-deck/navigator/web-view/util';
import {cursor} from '../../common/cursor';


/*::
import type {Address, DOM} from "reflex"
import * as Navigator from "../navigator-deck/navigator"
import type {ID} from "../../common/prelude"
import * as Target from "../../common/target"

export type Context =
  { tabWidth: number
  , titleOpacity: number
  }

export type Action =
  | { type: "Close" }
  | { type: "Select" }
  | { type: "Activate" }
  | { type: "Target", source: Target.Action }
*/

export class Model {
  /*::
  isPointerOver: boolean;
  */
  constructor(isPointerOver/*:boolean*/) {
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
    , source: action
    }
  );

const updateTarget =
  (model, action) =>
  ( action.type === "Over"
  ? transactOver
  : transactOut
  )

const Out = TargetAction(Target.Out);
const Over = TargetAction(Target.Over);

export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  transactOut;

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  ( action.type === "Target"
  ? updateTarget(model, action.source)
  : Unknown.update(model, action)
  );

const tabHeight = '32px';

const styleSheet = Style.createSheet({
  base: {
    MozWindowDragging: 'no-drag',
    WebkitAppRegion: 'no-drag',
    borderRadius: '5px',
    height: tabHeight,
    color: '#fff',
    overflow: 'hidden'
  },

  container: {
    height: tabHeight,
    lineHeight: tabHeight,
    width: '288px',
    color: '#fff',
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
    background: `linear-gradient(
      to right,
      rgba(39,40,34,0) 0%,
      rgba(39,40,34,1) 20%,
      rgba(39,40,34,1) 100%)`,
    width: tabHeight,
    height: tabHeight,
    position: 'absolute',
    paddingLeft: '10px',
    right: 0,
    top: 0,
    transition: `transform 400ms cubic-bezier(0.215, 0.610, 0.355, 1.000),
                opacity 300ms ease-out`
  },

  closeMaskSelected: {
    background: `linear-gradient(
      to right,
      rgba(86,87,81,0) 0%,
      rgba(86,87,81,1) 20%,
      rgba(86,87,81,1) 100%)`,
  },
  closeMaskUnselected: {

  },

  closeMaskHidden: {
    opacity: 0,
    transform: 'translateX(16px)',
    pointerEvents: 'none'
  },

  closeMaskVisible: {

  },

  closeIcon: {
    color: '#fff',
    fontFamily: 'FontAwesome',
    fontSize: '12px',
    width: tabHeight,
    height: tabHeight,
    lineHeight: tabHeight,
    textAlign: 'center'
  }
});

const viewIcon = Image.view('favicon', Style.createSheet({
  base: {
    borderRadius: '3px',
    left: '8px',
    position: 'absolute',
    top: '8px',
    width: '16px',
    height: '16px'
  }
}));

// TODO: Use button widget instead.
const viewClose = (tab, address) =>
  html.div
  ( { className: 'tab-close-mask'
    , style:
        Style.mix
        ( styleSheet.closeMask
        , ( false // isSelected
          ? styleSheet.closeMaskSelected
          : styleSheet.closeMaskUnselected
          )
        , ( tab.isPointerOver
          ? styleSheet.closeMaskVisible
          : styleSheet.closeMaskHidden
          )
        )
    }, [
      html.div
      ( { className: 'tab-close-icon'
        , style: styleSheet.closeIcon
        , onClick:
            event => {
              // Should prevent propagation so that tab won't trigger
              // Activate action when close button is clicked.
              event.stopPropagation();
              address(Close);
            }
        }, [''])
  ]);

export const render =
  ( model/*:Navigator.Model*/
  , address/*:Address<Action>*/
  , {tabWidth, titleOpacity}/*:Context*/
  )/*:DOM*/ =>
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
    , onClick: forward(address, always(Activate))
    }
  , [ html.div
      ( { className: 'sidebar-tab-inner'
        , style: styleSheet.container
        }
      , [ viewIcon
          ( { uri: readFaviconURI(model.output) }
          , address
          )
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
        , thunk('close', viewClose, model.output.tab, address)
        ]
      )
    ]
  );


export const view =
  ( model/*:Navigator.Model*/
  , address/*:Address<Action>*/
  , context/*:Context*/
  )/*:DOM*/ =>
  thunk
  ( `${model.output.ref.value}`
  , render
  , model
  , address
  , context
  )
