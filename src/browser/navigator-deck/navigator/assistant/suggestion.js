/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {html, thunk} from "reflex";
import {Style, StyleSheet} from '../../../../common/style';

/*::
import type {Address, DOM} from "reflex"
*/


const styleSheet = StyleSheet.create
  ( { base:
      { lineHeight: '40px'
      , overflow: 'hidden'
      , paddingLeft: '35px'
      , paddingRight: '10px'
      // Contains absolute elements.
      , position: 'relative'
      , whiteSpace: 'nowrap'
      , textOverflow: 'ellipsis'
      , borderLeft: 'none'
      , borderRight: 'none'
      , borderTop: 'none'
      , borderBottom: '1px solid'
      , color: 'inherit'
      , borderColor: 'inherit'
      , marginTop: '1px'
      }
    , unselected:
      { opacity: 0.7
      }
    , selected:
      { background: '#4A90E2'
      , borderRadius: '3px'
      }
    }
  );

export const render =
  (isSelected/*:boolean*/, content/*:Array<DOM>*/)/*:DOM*/ =>
  html.li
  ( { className: 'assistant suggestion'
    , style: Style
      ( styleSheet.base
      , ( isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      )
    }
  , content
  );

export const view = render
