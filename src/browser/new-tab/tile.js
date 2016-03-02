/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html} from "reflex"
import {Style, StyleSheet} from "../../common/style";

export const init =
  ({uri, src, title}) =>
  ( { uri,
      src,
      title
    }
  );

// Open a tile as webview
const Open = uri =>
  ( { type: 'Open',
      uri
    }
  );

const styleSheet = StyleSheet.create
  ( { tile:
      { cursor: 'pointer'
      , float: 'left'
      , margin: '10px 25px 20px'
      , width: '160px'
      }
    , image:
      { backgroundColor: '#fff'
      , backgroundSize: 'cover'
      , backgroundPosition: 'center center'
      , border: '1px solid rgba(0,0,0,0.15)'
      , borderRadius: '12px'
      , boxSizing: 'border-box'
      , height: '100px'
      , margin: '0 0 10px'
      , width: '160px'
      }
    , title:
      { fontSize: '14px'
      , fontWeight: 'medium'
      , lineHeight: '20px'
      , overflow: 'hidden'
      , textAlign: 'center'
      , textOverflow: 'ellipsis'
      , whiteSpace: 'nowrap'
      , width: '100%'
      }
    , titleLight:
      { color: 'rgba(0,0,0,0.8)'
      }
    , titleDark:
      { color: 'rgba(255,255,255,0.7)'
      }
    }
  );

export const view = (model, address, isDark) =>
  html.div
  ( { className: 'tile'
    , style: styleSheet.tile
    , onClick: () => address(Open(model.uri))
    }
  , [ html.div
      ( { className: 'tile-image'
        , style: Style
            ( styleSheet.image,
              { backgroundImage: `url(${model.src})`
              }
            )
        }
      )
    , html.div
      ( { className: 'tile-title'
        , style: Style
          ( styleSheet.title
          , ( isDark
            ? styleSheet.titleDark
            : styleSheet.titleLight
            )
          )
        }
      , [ model.title
        ]
      )
    ]
  );