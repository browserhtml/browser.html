/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, node, html, forward} from 'reflex';
import * as URL from '../../../../common/url-helper';
import * as Driver from '@driver';
import * as Style from '../../../../common/style';
import {on, setting} from '@driver';
import {always} from '../../../../common/prelude';



import type {Address, DOM} from "reflex"
import type {Model, Action} from "../WebView"
import {performance} from "../../../../common/performance"

const Blur = always({ type: "Blur" });
const Focus = always({ type: "Focus" });
const Close = always({ type: "Close" });
const FirstPaint = always({ type: "FirstPaint" });
const DocumentFirstPaint = always({ type: "DocumentFirstPaint" });

export const view =
  ( styleSheet:{ base: Style.Rules }
  , selected:boolean
  , model:Model
  , address:Address<Action>
  ):DOM =>
  html.iframe
  ( { [model.ref.name]: model.ref.value
    , src: model.navigation.src
    , 'data-current-uri': model.navigation.currentURI
    , 'data-name': model.name
    , 'data-features': model.features
    , style: Style.mix
      ( styleSheet.base
      , frameStyleSheet.mozbrowser
      , ( model.page.pallet.background != null
        ? { backgroundColor: model.page.pallet.background }
        : null
        )
      )
    , attributes:
      { mozbrowser: true
      , remote: true
      , mozapp:
        ( URL.isPrivileged(model.navigation.currentURI)
        ? URL.getManifestURL().href
        : void(0)
        )
      , mozallowfullscreen: true
      }
    , visibility: setting(visibility, selected)

    // Events

    , onBlur: forward(address, Blur)
    , onFocus: forward(address, Focus)
    , onMozBrowserClose: on(address, Close)
    , onMozBrowserOpenWindow: on(address, decodeOpenWindow)
    , onMozBrowserOpenTab: on(address, decodeOpenTab)
    , onMozBrowserContextMenu: on(address, decodeContexMenu)
    , onMozBrowserError: on(address, decodeError)
    , onMozBrowserLoadStart: on(address, decodeLoadStart)
    , onMozBrowserConnected: on(address, decodeConnected)
    , onMozBrowserLoadEnd: on(address, decodeLoadEnd)
    , onMozBrowserFirstPaint: on(address, FirstPaint)
    , onMozBrowserDocumentFirstPaint: on(address, DocumentFirstPaint)
    , onMozBrowserMetaChange: on(address, decodeMetaChange)
    , onMozBrowserIconChange: on(address, decodeIconChange)
    , onMozBrowserLocationChange: on(address, decodeLocationChange)
    , onMozBrowserSecurityChange: on(address, decodeSecurityChange)
    , onMozBrowserTitleChange: on(address, decodeTitleChange)
    , onMozBrowserShowModalPrompt: on(address, decodeModalPrompt)
    , onMozBrowserUserNameAndPasswordRequired: on(address, decodeAuthenticate)
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowseropenwindow
const decodeOpenWindow =
  ( { detail } ) =>
  ( { type: "Open"
    , options:
      { uri: detail.url
      , disposition: 'default'
      , name: detail.name
      , features: detail.features
      , ref: detail.frameElement
      , guestInstanceId: null
      }
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowseropentab
const decodeOpenTab =
  ( { detail } ) =>
  ( { type: "Open"
    , options:
      { uri: detail.url
      , disposition: 'default'
      , name: ''
      , features: ''
      , ref: null
      , guestInstanceId: null
      }
    }
  );

const decodeError =
  ( event ) =>
  ( event.detail.type === "fatal"
  ? decodeCrash(event)
  : decodeLoadFail(event)
  )

const decodeCrash =
  ({ detail, target }) =>
  ( { type: "Crash"
    , crash:
      { description: detail.description
      , version: detail.version
      , backtrace: detail.report
      , url: target.dataset.currentUri
      }
    }
  )

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowsererror
const decodeLoadFail =
  ({ detail }) =>
  ( { type: "LoadFail"
    , time: performance.now()
    , reason: detail.type
    // Gecko unlike Electron does not actually pass error codes. Absense of
    // it is identified as `-1` which is what used here.
    , code: -1
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowsercontextmenu
const decodeContexMenu =
  ( { detail } ) =>
  ( { type: "ContextMenu"
    , clientX: detail.clientX
    , clientY: detail.clientY
    , systemTargets: detail.systemTargets
    , contextMenu: detail.contextmenu
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowserloadstart
const decodeLoadStart =
  ( { detail } ) =>
  ( { type: "LoadStart"
    , time: performance.now()
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowserloadend
const decodeLoadEnd =
  ( { detail } ) =>
  ( { type: "LoadEnd"
    , time: performance.now()
    }
  );

const decodeConnected =
  ( { detail } ) =>
  ( { type: "Connect"
    , time: performance.now()
    }
  );

const decodeMetaChange =
  ( { detail } ) =>
  ( { type: "MetaChanged"
    , name: detail.name
    , content: detail.content
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowsericonchange
const decodeIconChange =
  ( { detail } ) =>
  ( { type: "IconChanged"
    , icon:
      { href: detail.href
      , sizes: detail.sizes
      , rel: detail.rel
      }
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowserlocationchange

const decodeLocationChange =
  ( { detail } ) =>
  // Servo and Gecko have different implementation of detail.
  // In Gecko, detail is a string (the uri).
  // In Servo, detail is an object {uri,canGoBack,canGoForward}
  ( typeof(detail) === "string"
  ? { type: "LocationChanged"
    , uri: detail
    , time: performance.now()
    , canGoBack: null
    , canGoForward: null
    }
  : { type: "LocationChanged"
    , uri: detail.url || detail.uri
    , time: performance.now()
    , canGoBack: detail.canGoBack
    , canGoForward: detail.canGoForward
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowsersecuritychange
const decodeSecurityChange =
  ( { detail } ) =>
  ( { type: "SecurityChanged"
    , state: detail.state
    , extendedValidation: detail.extendedValidation
    , trackingContent: detail.trackingContent
    , mixedContent: detail.mixedContent
    }
  );

const decodeTitleChange =
  ( { detail } ) =>
  ( { type: "TitleChanged"
    , title: detail
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowsershowmodalprompt
const decodeModalPrompt =
  ( { detail } ) =>
  ( { type: "ModalPrompt"
    , kind: detail.promptType
    , title: detail.title
    , message: detail.message
    }
  );

// See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowserusernameandpasswordrequired
const decodeAuthenticate =
  ( { detail } ) =>
  ( { type: "Authentificate"
    , host: detail.host
    , realm: detail.realm
    , isProxy: detail.isProxy
    }
  );


const frameStyleSheet = Style.createSheet
  ( { mozbrowser:
      { display: "block"
      }
    }
  );

const visibility = (element:HTMLElement, visible:boolean) =>
  new Task((succeed, fail) => {
    if (typeof(element.setVisible) === "function") {
      element.setVisible(visible)
    }
  })
