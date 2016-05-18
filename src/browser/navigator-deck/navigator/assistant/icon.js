/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';

/*::
import type {Address, DOM} from "reflex"
*/


const styleSheet = StyleSheet.create
  ( { base:
      { fontFamily: 'FontAwesome'
      , fontSize: '17px'
      , left: '13px'
      , position: 'absolute'
      // top:0 should not be required, but it's necessary for Servo.
      // See https://github.com/servo/servo/issues/9687
      , top: '0'
      }
    , selected:
      { color: '#fff'
      }
    , unselected:
      {

      }
    }
  );

export const render =
  (content/*:string*/, isSelected/*:boolean*/)/*:DOM*/ =>
  html.span
  ( { className: 'assistant icon'
    , style: Style
      ( styleSheet.base
      , ( isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      )
    }
  , [ content
    ]
  );

export const view =
  (content/*:string*/, isSelected/*:boolean*/)/*:DOM*/ =>
  thunk
  ( `${content}`
  , render
  , content
  , isSelected
  );
