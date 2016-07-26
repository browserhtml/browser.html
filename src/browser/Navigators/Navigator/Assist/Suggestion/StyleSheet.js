/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {merge} from "../../../../../common/prelude"

export const base =
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
  , marginTop: '-3px'
  , morginBottom: '3px'
  , opacity: 1
  , background: 'none'
  , borderRadius: '0px'
  }

export const deselected = merge
  ( base
  , { opacity: 0.7 }
  )

export const selected = merge
  ( base
  , { background: '#4A90E2'
    , borderRadius: '3px'
    , color: '#fff'
    , borderColor: 'transparent'
    }
  )
