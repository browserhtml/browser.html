/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Effects, Task} from 'reflex';
import {merge} from '../../common/prelude';
import * as Favicon from '../../common/favicon';
import * as Pallet from '../../browser/pallet';
import * as Unknown from '../../common/unknown';

/*::
import type {URI, Icon, Model, Action} from "./page"
*/

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
    merge
    ( model
    , { icon: bestIcon
      , faviconURI: faviconURI
      }
    )
  , Effects.none
  ];
};

const updateMeta = (model, {name, content}) =>
  [ ( name === 'theme-color'
    ? merge(model, {themeColor: content})
    : model
    )
  , Effects.none
  ];

const updatePallet = (model, _) =>
  [ merge
    ( model
    , { pallet:
          ( model.curatedColor != null
          ? Pallet.create
            ( model.curatedColor.background
            , model.curatedColor.foreground
            )
          : model.themeColor != null
          ? Pallet.create(...`${model.themeColor}|'`.split('|'))
          : Pallet.blank
          )
      }
    )
  , Effects.none
  ];

export const init =
  (uri/*:URI*/)/*:[Model, Effects<Action>]*/ =>
  [ { uri
    , title: null
    , icon: null
    , faviconURI: null

    , themeColor: null
    , curatedColor: null

    , pallet: Pallet.blank
    }
  , Effects.none
  ];

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "LoadStart":
        return  [merge( model
                      , { title: null
                        , icon: null
                        , faviconURI: null

                        , themeColor: null
                        , curatedColor: null

                        , pallet: Pallet.blank
                        }
                      )
                , Effects
                    .perform(Pallet.requestCuratedColor(model.uri))
                    .map(CuratedColorUpdate)
                ];
      case "LoadEnd":
        // If you go back / forward `DocumentFirstPaint` is not fired there for
        // we schedule a `WebView.Page.DocumentFakePaint` action to be send back
        // in asynchronously on `LoadEnd` that gives us an opportunity to
        // re-generate pallet when going back / forward. Also we schedule async
        // action because colors to generate pallet from are fetched async and
        // LoadEnd seems to fire occasionaly sooner that colors are feteched.
        return [ model, Effects.receive(CreatePallet) ];
      case "TitleChanged":
        return  [ merge(model, {title: action.title}), Effects.none ];
      case "IconChanged":
        return  updateIcon(model, action);
      case "MetaChanged":
        return  updateMeta(model, action);
      case "CuratedColorUpdate":
        return  [ merge(model, {curatedColor: action.color}), Effects.none ];
      case "DocumentFirstPaint":
        return  [ model, Effects.receive(CreatePallet) ];
      case "CreatePallet":
        return  updatePallet(model);
      case "LocationChanged":
        // Sometimes location change is triggered even though actual location
        // remains same. In such case we want to keep extracted colors as we
        // may not get those this time around.
        return  ( action.uri !== model.uri
                ? [ merge
                      ( model
                      , { uri: action.uri
                        , curatedColor: null
                        , themeColor: null
                        }
                      )
                  , Effects
                      .perform(Pallet.requestCuratedColor(action.uri))
                      .map(CuratedColorUpdate)
                  ]
                : [ model, Effects.none ]
                );
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
