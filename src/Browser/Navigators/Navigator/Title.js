/* @flow */

import {html, thunk, forward} from 'reflex'
import * as Style from '../../../Common/Style'
import {always} from '../../../Common/Prelude'

import type {Address, DOM} from 'reflex'

export type Action =
  | { type: "Activate" }

const Activate = always({ type: 'Activate' })

export const render =
  (isDisabled:boolean,
   title:string,
   secure:boolean,
   address:Address<Action>
  ):DOM =>
  html.summary({ className: 'webview-combobox',
     style: Style.mix(styleSheet.base,
       (isDisabled
        ? styleSheet.disabled
        : styleSheet.enabled
        )
      ),
     onClick: forward(address, Activate),
     open: true
    },
   [ html.figure({ className: 'webview-search-icon',
         style: styleSheet.searchIcon
        },
       ['\uf002']
      ),
     html.caption({ className: 'webview-title-container',
         style: styleSheet.summary
        },
       [ html.figure({ className: 'webview-security',
             style:
              (secure
              ? styleSheet.secureIcon
              : styleSheet.insecureIcon
              )
            },
           ['\uf023']
          ),
         title
        ]
      )
    ]
  )

export const view =
  (isDisabled:boolean,
   title:string,
   secure:boolean,
   address:Address<Action>
  ):DOM =>
  thunk('Browser/NavigatorDeck/Navigator/Header/Title',
   render,
   isDisabled,
   title,
   secure,
   address
  )

export const innerHeight = 21
export const innerWidth = 250
export const outerHeight = 27

const styleSheet = Style.createSheet({ base:
      { MozWindowDragging: 'no-drag',
       WebkitAppRegion: 'no-drag',
       position: 'absolute',
       left: '50%',
       top: 0,
       height: `${innerHeight}px`,
       lineHeight: `${innerHeight}px`,
       width: `${innerWidth}px`,
       marginTop: `${(outerHeight / 2) - (innerHeight / 2)}px`,
       marginLeft: `-${innerWidth / 2}px`,
       borderRadius: '5px',
       cursor: 'text',
       color: 'inherit'
      },
     summary:
      { fontSize: '13px',
       position: 'absolute',
       top: 0,
       left: 0,
       paddingLeft: '30px',
       paddingRight: '30px',
       width: 'calc(100% - 60px)',
       textAlign: 'center',
       whiteSpace: 'nowrap',
       overflow: 'hidden',
       textOverflow: 'ellipsis',
       listStyleType: 'none'
      },
     searchIcon:
      { fontFamily: 'FontAwesome',
       fontSize: '14px',
       left: '5px',
       position: 'absolute',
       display: 'inline'
      },
     secureIcon:
      { fontFamily: 'FontAwesome',
       marginRight: '6px',
       display: 'inline'
      },
     insecureIcon:
      { fontFamily: 'FontAwesome',
       marginRight: '6px',
       display: 'none'
      },
     disabled:
      { display: 'none'
      },
     enabled: null
    }
  )
