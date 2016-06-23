/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import {Effects, html, forward, thunk} from "reflex";
import {merge, always, batch} from "../../../../common/prelude";
import {Style, StyleSheet} from '../../../../common/style';
import * as URL from '../../../../common/url-helper';


import type {Address, DOM} from "reflex";
import type {URI} from "./url";



const styleSheet = StyleSheet.create
  ( { base:
      { fontSize: '14px'
      }
    , selected:
      { color: 'rgba(255,255,255,0.7)'
      }
    , unselected:
      {

      }
    }
  );

const preventDefault =
  event =>
  event.preventDefault();

export const render =
  (uri/*:URI*/, isSelected/*:boolean*/)/*:DOM*/ =>
  html.a
  ( { className: 'assistant url'
    , style: Style
      ( styleSheet.base
      , ( isSelected
        ? styleSheet.selected
        : styleSheet.unselected
        )
      )
    , href: uri
    , onClick: preventDefault
    }
  , [ ` - ${URL.prettify(uri)}`
    ]
  );

export const view =
  (uri/*:URI*/, isSelected/*:boolean*/)/*:DOM*/ =>
  thunk
  ( uri
  , render
  , uri
  , isSelected
  );
