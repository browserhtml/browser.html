/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';


import type {Address, DOM} from "reflex"



const styleSheet = StyleSheet.create
  ( { base:
      { fontSize: '14px'
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
  (title:?string, isSelected:boolean):DOM =>
  html.span
  ( { className: 'assistant title'
    , style: Style
      ( styleSheet.base
      , ( isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      )
    }
  , [ ( title == null
      ? 'Untitled'
      : `${title}`
      )
    ]
  );

export const view =
  (title:?string, isSelected:boolean):DOM =>
  thunk
  ( ( title == null
    ? ""
    : title
    )
  , render
  , title
  , isSelected
  );
