/* @flow */

import {thunk, html} from 'reflex';
import * as Style from '../../../../common/style';

/*::
import * as Ref from '../../../../common/ref';
import type {DOM} from 'reflex';
*/

export const render =
  (ref:Ref.Model, value:number):DOM =>
  html.div
  ( { className: "progress"
    , style: styleSheet.base
    }
  , [ html.div
      ( { style:
          ( value > 0
          ? styleLoading(value)
          : styleSheet.idle
          )
        , [ref.name]: ref.value
        }
      )
    ]
  )

export const view =
  (ref:Ref.Model, value:number):DOM =>
  thunk
  ( 'Browser/NavigtorDeck/Navigator/Progress/PolyfillView'
  , render
  , ref
  , value
  )


const styleSheet = Style.createSheet
  ( { base:
      { height: "4px"
      , overflow: "hidden"

      , position: 'absolute'
      , top: '24px'
      , width: "100%"
      }
    , idle:
      { opacity: 0
      , height: "inherit"
      , backgroundImage: "linear-gradient(135deg, #4A90E2 calc(100% - 4px), transparent calc(100% - 4px))"
      , transform: "translateX(-100%)"
      }
    }
  )

const styleLoading =
  value =>
  ( { transform: `translateX(${(value) - 100}%)`
    , opacity: 1
    , height: styleSheet.idle.height
    , backgroundImage: styleSheet.idle.backgroundImage
    }
  )
