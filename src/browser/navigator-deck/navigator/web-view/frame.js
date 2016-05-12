/* @noflow */

import {Effects, node, html, forward} from 'reflex';
import {isElectron} from "../../common/runtime";
import {merge, always} from "../../common/prelude";
import {cursor} from "../../common/cursor";
import * as Electron from './frame/electron';
import * as MozBrowser from './frame/moz-browser';
import * as Ref from '../../common/ref';
import * as Focus from '../../common/focus';
import * as Zoom  from './frame/zoom';
import * as Visibility from './frame/visibility';
import * as Navigation from './frame/navigation';
import * as Unknown from '../../common/unknown';

/*::

import type {Result} from "../../common/result";
import type {Address, DOM} from "reflex"
import type {ID, URI, Time, Integer} from "../../common/prelude";
import type {Icon} from "../../common/favicon"
import {performance} from "../../common/performance"


export type {URI, ID}

export type Disposition =
  | 'default'
  | 'foreground-tab'
  | 'background-tab'
  | 'new-window'
  | 'new-popup'

export type FrameOptions =
  { uri: URI
  , disposition: Disposition
  , name: string
  , features: string
  , options: {}
  }

export type Model =
  { ref: Ref.Model
  , loadURI: URI
  , currentURI: URI
  , focus: Focus.Model
  , zoom: Zoom.Model
  , visibility: Visibility.Model
  , navigation: Navigation.Model
  }


export type Action =
  | { type: "NoOp" }
  | { type: "Focus" }
  | { type: "Blur" }
  | { type: "Close" }
  | { type: "Open"
    , options: FrameOptions
    }
  | { type: "LoadStart", time: Time }
  | { type: "Connect", time: Time }
  | { type: "LoadEnd", time: Time }
  | { type: "LoadFail"
    , time: Time
    , reason: string
    , code: Integer
    }
  | { type: "FirstPaint" }
  | { type: "DocumentFirstPaint" }
  | { type: "MetaChange"
    , name: string
    , content: string
    }
  | { type: "IconChange"
    , icon: Icon
    }
  | { type: "TitleChange"
    , title: string
    }
  | { type: "SecurityChange"
    , state: "broken" | "secure" | "insecure"
    , extendedValidation: boolean
    , trackingContent: boolean
    , mixedContent: boolean
    }
  | { type: "LocationChanged"
    , uri: URI
    , time: Time
    , canGoBack: ?boolean
    , canGoForward: ?boolean
    }
  | { type: "CanGoBackChanged"
    , canGoBack: boolean
    }
  | { type: "CanGoForwardChanged"
    , canGoForward: boolean
    }
    // See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowsershowmodalprompt
  | { type: "ModalPrompt"
    , kind: "alert" | "confirm" | "prompt"
    , title: string
    , message: string
    }
    // See: https://developer.mozilla.org/en-US/docs/Web/Events/mozbrowserusernameandpasswordrequired
  | { type: "Authentificate"
    , host: string
    , realm: string
    , isProxy: boolean
    }
  | { type: "ContextMenu"
    , clientX: number
    , clientY: number
    , systemTargets: any
    , contextMenu: any
    }
  | { type: "TagZoom", zoom: Zoom.Action }
  | { type: "TagFocus", focus: Focus.Action }
  | { type: "TagVisibility", visibility: Visibility.Action }
  | { type: "TagNavigation", navigation: Navigation.Action }
*/

const NoOp = always({ type: "NoOp" });
const TagRef = NoOp;

const TagFocus =
  action =>
  ( { type: "TagFocus"
    , focus: action
    }
  );

const TagZoom =
  action =>
  ( { type: "TagZoom"
    , zoom: action
    }
  );

const TagVisibility =
  action =>
  ( { type: "TagVisibility"
    , visibility: action
    }
  );


const TagNavigation =
  action =>
  ( { type: "TagNavigation"
    , navigation: action
    }
  );

export const init =
  ( uri/*:URI*/
  , isActive/*:boolean*/=true
  )/*:[Model, Effects<Action>]*/ => {
    const [ref, $ref] = Ref.init()
    const [navigation, $navigation] = Navigation.init(ref);
    const [focus, $focus] = Focus.init(ref, isActive);
    const [zoom, $zoom] = Zoom.init(ref);
    const [visibility, $visibility] = Visibility.init(ref);

    const model =
      { ref
      , loadURI: uri
      , currentURI: uri
      , navigation
      , focus
      , zoom
      , visibility
      };

    const fx = Effects.batch
      ( [ $ref.map(TagRef)
        , $navigation.map(TagNavigation)
        , $focus.map(TagFocus)
        , $zoom.map(TagZoom)
        , $visibility.map(TagVisibility)
        ]
      );

    return [model, fx]
  };

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ =>
  ( action.type === "NoOp"
  ? nofx(model)
  : action.type === "Focus"
  ? updateFocus(model, action)
  : action.type === "Blur"
  ? updateFocus(model, action)
  : action.type === "LocationChanged"
  ? updateNavigation(model, action)
  : action.type === "TagNavigation"
  ? updateNavigation(model, action.navigation)
  : action.type === "TagFocus"
  ? updateFocus(model, action.focus)
  : action.type === "TagZoom"
  ? updateZoom(model, action.zoom)
  : action.type === "TagVisibility"
  ? updateVisibility(model, action.visibility)
  : Unknown.update(model, action)
  )

const nofx =
  model =>
  [ model
  , Effects.none
  ]

const updateFocus = cursor
  ( { get: model => model.focus
    , set: (model, focus) => merge(model, {focus})
    , update: Focus.update
    , tag: TagFocus
    }
  );

const updateZoom = cursor
  ( { get: model => model.zoom
    , set: (model, zoom) => merge(model, {zoom})
    , update: Zoom.update
    , tag: TagZoom
    }
  );

const updateVisibility = cursor
  ( { get: model => model.visibility
    , set: (model, visibility) => merge(model, {visibility})
    , update: Visibility.update
    , tag: TagVisibility
    }
  );

const updateNavigation = cursor
  ( { get: model => model.navigation
    , set: (model, navigation) => merge(model, {navigation})
    , update: Navigation.update
    , tag: TagNavigation
    }
  );




export const view =
  ( isElectron
  ? Electron.view
  : MozBrowser.view
  );
