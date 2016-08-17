/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task, forward, thunk} from 'reflex';
import {merge, nofx} from '../../../../common/prelude';
import {cursor} from '../../../../common/cursor';
import * as Favicon from '../../../../common/favicon';
import * as Image from '../../../../common/image';
import * as Pallet from '../../../../browser/pallet';
import * as Unknown from '../../../../common/unknown';
import * as Ref from '../../../../common/ref';
import * as Sign from './Page/Sign';
import * as Icon from './Page/Icon';
import * as URL from '../../../../common/url-helper'

import type {URI} from "../../../../common/prelude"
import type {Address, DOM} from "reflex"

export type Action =
  | { type: "LoadStart" }
  | { type: "LoadEnd" }
  | { type: "TitleChanged"
    , title: string
    }
  | { type: "IconChanged", icon: Favicon.Model }
  | { type: "IconLoadError" }
  | { type: "Icon", icon: Icon.Action }
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
  title: string;
  icon: ?Image.Model;
  favicon: ?Favicon.Model;
  sign: Sign.Model;

  themeColor: ?string;
  curatedColor: ?Pallet.Theme;

  pallet: Pallet.Model;

  constructor(
    uri: URI
  , title: string
  , icon: ?Image.Model
  , favicon: ?Favicon.Model
  , sign: Sign.Model

  , themeColor: ?string
  , curatedColor: ?Pallet.Theme

  , pallet: Pallet.Model
  ) {
    this.uri = uri
    this.title = title
    this.icon = icon
    this.favicon = favicon
    this.sign = sign
    this.themeColor = themeColor
    this.curatedColor = curatedColor
    this.pallet = pallet
  }
}

export const DocumentFirstPaint:Action =
  {type: "DocumentFirstPaint"};

export const FirstPaint:Action =
  {type: "FirstPaint"};

export const MetaChanged =
  (name:string, content:string):Action =>
  ({type: "MetaChanged", name, content});


export const TitleChanged =
  (title:string):Action =>
 ({type: "TitleChanged", title});

export const IconChanged =
  (icon:Favicon.Model):Action =>
  ({type: "IconChanged", icon});

export const OverflowChanged =
  (isOverflown:boolean):Action =>
  ({type: "OverflowChanged", isOverflown});

export const Scrolled =
  (detail:any):Action =>
  ({type: "Scrolled", detail});

export const CuratedColorUpdate =
  (color:?Pallet.Theme):Action =>
  ({type: "CuratedColorUpdate", color});

export const CreatePallet:Action =
  {type: "CreatePallet"};

export const LoadStart:Action =
  {type: "LoadStart"};

export const LoadEnd:Action =
  {type: "LoadEnd"};

export const LocationChanged =
  (uri:URI):Action =>
  ({type: "LocationChanged", uri});

const IconAction =
  action => {
    switch (action.type) {
      case "Error":
        return IconLoadError
      default:
        return { type: "Icon", icon: action }
    }
  }

const IconLoadError = { type: "IconLoadError" }

const iconChanged = (model, newFavicon) => {
  const favicon =
    ( model.favicon == null
    ? Favicon.getBestIcon([newFavicon])
    : Favicon.getBestIcon([model.favicon, newFavicon])
    );

    const icon =
    ( favicon == null
    ? new Image.Model(Favicon.getFallback(model.uri))
    : new Image.Model(Favicon.createURL(favicon))
    )

  return [
    new Model
    ( model.uri
    , model.title
    , icon
    , favicon
    , model.sign
    , model.themeColor
    , model.curatedColor
    , model.pallet
    )
  , Effects.none
  ];
};

const iconLoadError =
  model =>
  nofx
  ( new Model
    ( model.uri
    , model.title
    , null
    , null
    , model.sign
    , model.themeColor
    , model.curatedColor
    , model.pallet
    )
  )

const updateIcon = cursor
  ( { get: (model) => model.icon
    , set: (model, icon) =>
      new Model
      ( model.uri
      , model.title
      , icon
      , model.favicon
      , model.sign
      , model.themeColor
      , model.curatedColor
      , model.pallet
      )
    , update:
        (icon, message) => {
          if (icon == null) {
            return nofx(icon)
          }
          else {
            // Note: Need to reconstruct due to bug in flow
            // https://github.com/facebook/flow/issues/2253
            const [model, fx] = Icon.update(icon, message)
            return [model, fx]
          }
        }
    , tag: IconAction
    }
  );

const updateMeta =
  (model, {name, content}) =>
  [ ( name === 'theme-color'
    ? new Model
      ( model.uri
      , model.title
      , model.icon
      , model.favicon
      , model.sign
      , content
      , model.curatedColor
      , model.pallet
      )
    : model
    )
  , Effects.none
  ];

const updatePallet =
  (model, _) =>
  swapPallet
  ( model
  , ( model.curatedColor != null
    ? Pallet.create
      ( model.curatedColor.background
      , model.curatedColor.foreground
      )
    : model.themeColor != null
    ? Pallet.create(...`${model.themeColor}|`.split('|'))
    : Pallet.blank
    )
  );

const chooseInital =
  (hostname:string, title:string) =>
  ( hostname == ""
  ? title
  : hostname
  ).charAt(0).toUpperCase()


const swapPallet =
  (model, pallet) =>
  [ new Model
    ( model.uri
    , model.title
    , model.icon
    , model.favicon
    , Sign.init
      ( chooseInital(URL.getHostname(model.uri), model.title)
      , pallet.background
      , ( pallet.foreground == ""
        ? ( pallet.isDark
          ? Sign.dark.foreground
          : Sign.bright.foreground
          )
        : pallet.foreground
        )
      )
    , model.themeColor
    , model.curatedColor
    , pallet
    )
  , Effects.none
  ];

export const init =
  (uri:URI):[Model, Effects<Action>] =>
  [ new Model
    ( uri
    , ""
    , null
    , null
    , Sign.blank

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
    , ""
    , null
    , null
    , Sign.blank

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
    , model.icon
    , model.favicon
    , model.sign
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
    , model.icon
    , model.favicon
    , model.sign
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
      , model.icon
      , model.favicon
      , model.sign
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
  (model:Model, action:Action):[Model, Effects<Action>] => {
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
        return iconChanged(model, action.icon);
      case "IconLoadError":
        return iconLoadError(model);
      case "Icon":
        return updateIcon(model, action.icon);
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

export const viewIcon =
  (model:Model, address:Address<Action>):DOM =>
  ( model.icon == null
  ? Sign.view(model.sign)
  : Icon.view(model.icon, forward(address, IconAction))
  )
