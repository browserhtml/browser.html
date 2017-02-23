/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk} from 'reflex'
import type {DOM} from 'reflex'
import * as Style from '../../../../../Common/Style'

export class Model {
  content: string;
  background: ?string;
  foreground: ?string;
  fontFamily: ?string;
  fontSize: ?string;
  color: ?string;
  constructor (
    content: string,
   background: ?string,
   foreground: ?string,
   fontFamily: ?string,
   fontSize: ?string
  ) {
    this.content = content
    this.background = background
    this.foreground = foreground
    this.color = foreground
    this.fontFamily = fontFamily
    this.fontSize = fontSize
  }
}

export const init =
  (content:string='',
   background:?string,
   foreground:?string,
   fontFamily:?string,
   fontSize:?string
  ):Model =>
  new Model(content,
   (background == null
    ? 'rgba(255, 255, 255, 0.8)'
    : background
    ),
   (foreground == null
    ? 'rgba(0, 0, 0, 0.75)'
    : foreground
    ),
   fontFamily,
   fontSize
  )

export const blank = init()
export const bright = init('', 'rgba(255, 255, 255, 0.8)', 'rgba(0, 0, 0, 0.75)')
export const dark = init('', 'rgba(0, 0, 0, 0.75)', 'rgba(255, 255, 255, 0.8)')

export const render =
  (model:Model):DOM =>
  (model.content === ''
  ? html.figure({ style: styleSheet.base })
  : html.figure({ style: Style.mix(styleSheet.base, model) },
     [model.content]
    )
  )

export const view =
  (model:Model) =>
  thunk('Icon',
   render,
   model
  )

const styleSheet = Style.createSheet({ base:
      { border: 'none',
       borderRadius: '3px',
       left: '8px',
       position: 'absolute',
       top: '8px',
       width: '16px',
       height: '16px',
       lineHeight: '16px',
       textAlign: 'center'
      }
    }
  )
