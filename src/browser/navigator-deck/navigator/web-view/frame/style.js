/* @flow */

import * as Style from '../../../../../common/style';

export const topBarHeight = '27px';

export const styleSheet = Style.createSheet
  ( { base:
      { display: 'block' // iframe are inline by default
      , position: 'absolute'
      , top: topBarHeight
      , left: 0
      , width: '100%'
      , height: `calc(100% - ${topBarHeight})`
      , mozUserSelect: 'none' // necessary to pass text drag to iframe's content
      , borderWidth: 0
      , backgroundColor: 'white'
      , MozWindowDragging: 'no-drag'
      , WebkitAppRegion: 'no-drag'
      }
    }
  )
