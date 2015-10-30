/* @flow */

import type {Effects} from "reflex/type"
import type {ID, URI, Time} from "../../common/prelude"


export type Model = {
  canGoBack: boolean,
  canGoForward: boolean,

  // URI of the page displayed by a web-view (although web view maybe still
  // loading & technically it won't be displayed). This uri updates during any
  // redirects or when user navigates away by going back / forward or by
  // navigating to a new uri.
  currentURI: ?URI,

  // URI that was entered in a location bar by a user. Note this may not be an
  // uri of currently loaded page as uri could have being redirect or user could
  // have navigated away by clicking a link or pressing go back / go forward
  // buttons. This pretty much represents `src` attribute of the iframe.
  initiatedURI: URI
}

// Action is triggered whenever web-view start loading a new URI. Passed URI
// directly corresponds `currentURI` in the model.
export type LocationChanged = {
  type: "WebView.Loader.LocationChanged",
  uri: URI,
  timeStamp: Time
}

// When model is updated with above action Effects with following Response
// actions are triggered.
export type CanGoBackChanged = {
  type: "WebView.Navigation.CanGoBackChanged",
  value: boolean
}

export type CanGoForwardChanged = {
  type: "WebView.Navigation.CanGoForwardChanged",
  value: boolean
}



// User interaction may also trigger on of the following request type actions:


// Editing uri in the location bar causes `ChangeLocation` action. It's
// `uri` field directly corresponds to `initiatedURI` field on the model,
// althoug this action also updates `currentURI`.
export type Load = {
  type: "WebView.Loader.Load",
  uri: URI
}


// User interaction interaction may also triggered following actions:
export type Stop = {type: "WebView.Navigation.Stop"}
export type Reload = {type: "WebView.Navigation.Reload"}
export type GoBack = {type: "WebView.Navigation.GoBack"}
export type GoForward = {type: "WebView.Navigation.GoForward"}


export type Request
  = Load
  | Stop
  | Reload
  | GoBack
  | GoForward


export type Response
  = CanGoBackChanged
  | CanGoForwardChanged
  | void


export type Action
  = LocationChanged
  | Request



// IO

export type canGoBack = (id:ID) => Effects<CanGoBackChanged>
export type canGoForward = (id:ID) => Effects<CanGoForwardChanged>
export type stop = (id:ID) => Effects<void>
export type reload = (id:ID) => Effects<void>
export type goBack = (id:ID) => Effects<void>
export type goForward = (id:ID) => Effects<void>

// Returns:
//  {canGoBack: false, canGoForward: false, initiatedURI: uri, currentURI: uri}
export type initialize = (uri:URI) => Model

// Returns:
// {...model, initiatedURI: uri, currentURI: uri}
export type load = (model:Model, uri:URI) => Model

// Returns:
// {...model, currentURI: uri}
export type changeLocation = (model:Model, uri:URI) => Model



export type step = (model:Model, action:Action) => [Model, Effects<Response>]
