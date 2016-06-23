/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from 'reflex';
import {merge} from '../../../../common/prelude';
import * as Favicon from '../../../../common/favicon';
import * as Pallet from '../../../../browser/pallet';
import * as Unknown from '../../../../common/unknown';
import * as Ref from '../../../../common/ref';


import type {URI} from "../../../../common/prelude"
import type {Icon} from "../../../../common/favicon"

export type Action =
  | { type: "LoadStart" }
  | { type: "LoadEnd" }
  | { type: "TitleChanged"
    , title: string
    }
  | { type: "IconChanged"
    , icon: Icon
    }
  | { type: "MetaChanged"
    , name: string
    , content: string
    }
  | { type: "CuratedColorUpdate"
    , color: ?Pallet.Theme
    }
  | { type: "DocumentFirstPaint" }
  | { type: "FirstPaint" }
  | { type: "CreatePallet" }
  | { type: "OverflowChanged"
    , isOverflown: boolean
    }
  | { type: "Scrolled"
    , detail: any
    }
  | { type: "LocationChanged"
    , uri: URI
    }


export class Model {
  
  uri: URI;
  title: ?string;
  faviconURI: ?URI;
  icon: ?Icon;

  themeColor: ?string;
  curatedColor: ?Pallet.Theme;

  pallet: Pallet.Model;
  
  constructor(
    uri/*: URI*/
  , title/*: ?string*/
  , faviconURI/*: ?URI*/
  , icon/*: ?Icon*/

  , themeColor/*: ?string*/
  , curatedColor/*: ?Pallet.Theme*/

  , pallet/*: Pallet.Model*/
  ) {
    this.uri = uri
    this.title = title
    this.faviconURI = faviconURI
    this.icon = icon
    this.themeColor = themeColor
    this.curatedColor = curatedColor
    this.pallet = pallet
  }
}

export const DocumentFirstPaint/*:Action*/ =
  {type: "DocumentFirstPaint"};

export const FirstPaint/*:Action*/ =
  {type: "FirstPaint"};

export const MetaChanged =
  (name/*:string*/, content/*:string*/)/*:Action*/ =>
  ({type: "MetaChanged", name, content});


export const TitleChanged =
  (title/*:string*/)/*:Action*/ =>
 ({type: "TitleChanged", title});

export const IconChanged =
  (icon/*:Icon*/)/*:Action*/ =>
  ({type: "IconChanged", icon});

export const OverflowChanged =
  (isOverflown/*:boolean*/)/*:Action*/ =>
  ({type: "OverflowChanged", isOverflown});

export const Scrolled =
  (detail/*:any*/)/*:Action*/ =>
  ({type: "Scrolled", detail});

export const CuratedColorUpdate =
  (color/*:?Pallet.Theme*/)/*:Action*/ =>
  ({type: "CuratedColorUpdate", color});

export const CreatePallet/*:Action*/ =
  {type: "CreatePallet"};

export const LoadStart/*:Action*/ =
  {type: "LoadStart"};

export const LoadEnd/*:Action*/ =
  {type: "LoadEnd"};

export const LocationChanged =
  (uri/*:URI*/)/*:Action*/ =>
  ({type: "LocationChanged", uri});


const updateIcon = (model, {icon}) => {
  const {bestIcon, faviconURI} =
    ( model.icon == null
    ? Favicon.getBestIcon([icon])
    : Favicon.getBestIcon([model.icon, icon])
    );

  return [
    new Model
    ( model.uri
    , model.title
    , faviconURI
    , bestIcon
    , model.themeColor
    , model.curatedColor
    , model.pallet
    )
  , Effects.none
  ];
};

const updateMeta =
  (model, {name, content}) =>
  [ ( name === 'theme-color'
    ? new Model
      ( model.uri
      , model.title
      , model.faviconURI
      , model.icon
      , content
      , model.curatedColor
      , model.pallet
      )
    : model
    )
  , Effects.none
  ];

const updatePallet = (model, _) =>
  [ new Model
    ( model.uri
    , model.title
    , model.faviconURI
    , model.icon
    , model.themeColor
    , model.curatedColor
    , ( model.curatedColor != null
      ? Pallet.create
        ( model.curatedColor.background
        , model.curatedColor.foreground
        )
      : model.themeColor != null
      ? Pallet.create(...`${model.themeColor}|'`.split('|'))
      : Pallet.blank
      )
    )
  , Effects.none
  ];

export const init =
  (uri/*:URI*/)/*:[Model, Effects<Action>]*/ =>
  [ new Model
    ( uri
    , null
    , null
    , null

    , null
    , null

    , Pallet.blank
    )
  , Effects.none
  ];

const loadStart =
  model =>
  [ new Model
    ( model.uri
    , null
    , null
    , null

    , null
    , null

    , Pallet.blank
    )
  , Effects
    .perform(Pallet.requestCuratedColor(model.uri))
    .map(CuratedColorUpdate)
  ];

const updateTitle =
  (model, title) =>
  [ new Model
    ( model.uri
    , title
    , model.faviconURI
    , model.icon
    , model.themeColor
    , model.curatedColor
    , model.pallet
    )
  , Effects.none
  ];

const updateCuratedColor =
  (model, color) =>
  [ new Model
    ( model.uri
    , model.title
    , model.faviconURI
    , model.icon
    , model.themeColor
    , color
    , model.pallet
    )
  , Effects.none
  ];

const updateURI =
  ( model, uri ) =>
  // Sometimes location change is triggered even though actual location
  // remains same. In such case we want to keep extracted colors as we
  // may not get those this time around.
  // See: https://github.com/browserhtml/browserhtml/issues/458
  ( model.uri === uri
  ? [ model, Effects.none ]
  : [ new Model
      ( uri
      , model.title
      , model.faviconURI
      , model.icon
      , null
      , null
      , model.pallet
      )
    , Effects
      .perform(Pallet.requestCuratedColor(uri))
      .map(CuratedColorUpdate)
    ]
  );

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "LoadStart":
        return loadStart(model);
      case "LoadEnd":
        // If you go back / forward `DocumentFirstPaint` is not fired there for
        // we schedule a `WebView.Page.DocumentFakePaint` action to be send back
        // in asynchronously on `LoadEnd` that gives us an opportunity to
        // re-generate pallet when going back / forward. Also we schedule async
        // action because colors to generate pallet from are fetched async and
        // LoadEnd seems to fire occasionaly sooner that colors are feteched.
        return [ model, Effects.receive(CreatePallet) ];
      case "TitleChanged":
        return updateTitle(model, action.title);
      case "IconChanged":
        return  updateIcon(model, action);
      case "MetaChanged":
        return  updateMeta(model, action);
      case "CuratedColorUpdate":
        return updateCuratedColor(model, action.color);
      case "DocumentFirstPaint":
        return  [ model, Effects.receive(CreatePallet) ];
      case "CreatePallet":
        return  updatePallet(model);
      case "LocationChanged":
        return updateURI(model, action.uri);
      // Ignore
      case "FirstPaint":
        return  [ model, Effects.none ];
      case "OverflowChanged":
        return  [ model, Effects.none ];
      case "Scrolled":
        return  [ model, Effects.none ];
      default:
      return Unknown.update(model, action);
    }
  };
