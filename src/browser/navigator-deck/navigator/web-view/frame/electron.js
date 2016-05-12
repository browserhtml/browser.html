/* @noflow */

import {Effects, node, html, forward} from 'reflex';
import * as URL from '../../../common/url-helper';
import * as Driver from '@driver';
import * as Progress from '../progress';
import * as Ref from "../../../common/ref";
import {styleSheet} from './style';
import * as Style from '../../../common/style';
import {on} from '@driver';
import {always} from '../../../common/prelude';
import {compose} from '../../../lang/functional';


/*::
import type {Address, DOM} from "reflex"
import type {ID, URI, Options, Model, Action} from "../frame"
import {performance} from "../../../common/performance"
*/

const Blur = always({ type: "Blur" });
const Focus = always({ type: "Focus" });
const Close = always({ type: "Close" });
const FirstPaint = always({ type: "FirstPaint" });
const DocumentFirstPaint = always({ type: "DocumentFirstPaint" });

export const view =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:DOM*/ =>
  node
  ( 'webview'
  , { id: `web-view-${model.id}`
    , [Ref.name]: model.ref
    , src: model.navigation.initiatedURI
    , 'data-current-uri': model.navigation.currentURI
    , 'data-name': model.name
    , 'data-features': model.features
    , style: Style.mix
      ( styleSheet.base
      , ( model.page.pallet.background != null
        ? { backgroundColor: model.page.pallet.background }
        : null
        )
      )

    // Events

    , onBlur: on(address, Blur)
    , onFocus: on(address, Focus)
    , onClose: forward(address, Close)
    , "onNew-Window": on(address, decodeNewWindow)
    , "onPage-Favicon-Updated": on(address, decodeIconChange)
    , "onPage-Title-Updated": on(address, decodeTitleChange)
    , "onLoad-Commit": on(address, decodeLoadStart)
    , "onDid-Navigate": on(address, decodeLocationChange)
    , "onDid-Fail-Load": on(address, decodeLoadFail)
    , "onDid-Finish-Load": on(address, decodeLoadEnd)
    , "onDid-Change-Theme-Color": on(address, decodeMetaChange)
    , "onDOM-Ready": forward(address, DocumentFirstPaint)
    ,
    }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-new-window
const decodeNewWindow =
  ( event ) =>
  ( { type: "Open"
    , uri: event.url
    , name: event.frameName
    , disposition: event.disposition
    , features: ''
    , options: event.options
    }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-page-favicon-updated
const decodeIconChange =
  ( event ) =>
  ( { type: "IconChange"
    , icon:
      { href:
        ( event.favicons.length > 0
        ? event.favicons[0]
        : ''
        )
      , sizes: null
      , rel: null
      }
    }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-page-title-updated
const decodeTitleChange =
  ( event ) =>
  ( { type: "TitleChange"
    , title: event.title
    }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-load-commit
const decodeLoadStart =
  ( event ) =>
  ( event.isMainFrame
  ? { type: "LoadStart"
    , time: performance.now()
    }
  : { type: "NoOp" }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-did-frame-finish-load
const decodeLoadEnd =
  ( event ) =>
  ( event.isMainFrame
  ? { type: "LoadEnd"
    , time: performance.now()
    }
  : { type: "NoOp" }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-did-fail-load
const decodeLoadFail =
  ( event ) =>
  ( { type: "LoadFail"
    , time: performance.now()
    , reason: event.errorDescription
    , code: event.errorCode
    }
  );

// @TODO: We are missing "Connected" event and I think 'did-get-response-details'
// maybe it in electron.
// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-did-get-response-details

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-did-navigate
// TODO: Consider `will-navigate` event instead.
const decodeLocationChange =
  ( event ) =>
  ( { type: "LocationChanged"
    , uri: event.url
    , time: performance.now()
    , canGoBack: event.target.canGoBack()
    , canGoForward: event.target.canGoForward()
    }
  );

// See: http://electron.atom.io/docs/v0.37.4/api/web-view-tag/#event-did-change-theme-color
const decodeMetaChange =
  ( event ) =>
  ( { type: "MetaChange"
    , name: "theme-color"
    , content: event.themeColor
    }
  );
