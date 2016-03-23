/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*:: import * as type from "../../../type/browser/web-view/page" */

import {Effects, Task} from 'reflex';
import {merge} from '../../common/prelude';
import * as Favicon from '../../common/favicon';
import * as Pallet from '../../browser/pallet';
import * as Unknown from '../../common/unknown';
import * as URI from '../../common/url-helper';

export const DocumentFirstPaint/*:type.DocumentFirstPaint*/ =
  {type: "DocumentFirstPaint"};

export const FirstPaint/*:type.FirstPaint*/ =
  {type: "FirstPaint"};

export const MetaChanged/*:type.MetaChanged*/ = (name, content) =>
  ({type: "MetaChanged", name, content});


export const TitleChanged/*:type.TitleChanged*/ = title =>
 ({type: "TitleChanged", title});

export const IconChanged/*:type.IconChanged*/ = icon =>
  ({type: "IconChanged", icon});

export const OverflowChanged/*:type.OverflowChanged*/ = isOverflown =>
  ({type: "OverflowChanged", isOverflown});

export const Scrolled/*:type.Scrolled*/ = detail =>
  ({type: "Scrolled", detail});

export const CuratedColorUpdate/*:type.CuratedColorUpdate*/ = color =>
  ({type: "CuratedColorUpdate", color});

export const CreatePallet/*:type.CreatePallet*/ =
  {type: "CreatePallet"};

export const LoadStart/*:type.LoadStart*/ =
  {type: "LoadStart"};

export const LoadEnd/*:type.LoadEnd*/ =
  {type: "LoadEnd"};

export const LocationChanged/*:type.LocationChanged*/ = uri =>
  ({type: "LocationChanged", uri});

export const Integrate =
  ( { type: 'Integrate'
    }
  );

const decodeMetaChange = ({detail: {name, content}}) =>
  MetaChanged(name, content);

const requestPageModeMeta = uri =>
  Task.future(() => new Promise(resolve =>
    ( URI.read(uri) === URI.read('about:newtab')
    ? resolve({ detail:
        { name: 'browserhtml-page-mode'
        , content: 'integrated'
        }
      })
    : null
    )
  ));

const send = action =>
  Task.future(() => Promise.resolve(action));


const updateIcon = (model, {icon}) => {
  const {bestIcon, faviconURI} = Favicon.getBestIcon([model.icon, icon]);
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
  ( name === 'theme-color'
  ? [ merge(model, {themeColor: content}), Effects.none ]
  : name === 'browserhtml-page-mode' && content === 'integrated'
  ? [ merge(model, {pageMode: content}), Effects.receive(Integrate) ]
  : model
  );

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

export const init/*:type.init*/ = uri =>
  [ { uri
    , title: null
    , icon: null
    , faviconURI: null

    , themeColor: null
    , curatedColor: null

    , pallet: Pallet.blank

    , pageMode: null
    }
  , Effects.none
  ];

export const update/*:type.update*/ = (model, action) =>
  ( action.type === 'LoadStart'
  ? [ merge
      ( model
      , { title: null
        , icon: null
        , faviconURI: null

        , themeColor: null
        , curatedColor: null

        , pallet: Pallet.blank

        , pageMode: null
        }
      )
    , Effects.batch
      ( [ Effects
          .task(Pallet.requestCuratedColor(model.uri))
          .map(CuratedColorUpdate)
        , Effects
          .task(requestPageModeMeta(model.uri))
          .map(decodeMetaChange)
        ]
      )
    ]
  : action.type === 'LoadEnd'
  // If you go back / forward `DocumentFirstPaint` is not fired there for
  // we schedule a `WebView.Page.DocumentFakePaint` action to be send back
  // in asynchronously on `LoadEnd` that gives us an opportunity to
  // re-generate pallet when going back / forward. Also we schedule async
  // action because colors to generate pallet from are fetched async and
  // LoadEnd seems to fire occasionaly sooner that colors are feteched.
  ? [ model, Effects.task(send(CreatePallet)) ]
  : action.type === 'TitleChanged'
  ? [ merge(model, {title: action.title}), Effects.none ]
  : action.type === 'IconChanged'
  ? updateIcon(model, action)
  : action.type === 'MetaChanged'
  ? updateMeta(model, action)
  : action.type === 'CuratedColorUpdate'
  ? [ merge(model, {curatedColor: action.color}), Effects.none ]
  : action.type === 'DocumentFirstPaint'
  ? [ model, Effects.receive(CreatePallet) ]
  : action.type === 'CreatePallet'
  ? updatePallet(model)
  : action.type === 'LocationChanged'
  // Sometimes location change is triggered even though actual location
  // remains same. In such case we want to keep extracted colors as we
  // may not get those this time around.
  ? ( action.uri !== model.uri
    ? [ merge
          ( model
          , { uri: action.uri
            , curatedColor: null
            , themeColor: null
            , pageMode: null
            }
          )
      , Effects.batch
        ( [ Effects
            .task(Pallet.requestCuratedColor(action.uri))
            .map(CuratedColorUpdate)
          , Effects
            .task(requestPageModeMeta(action.uri))
            .map(decodeMetaChange)
          ]
        )
      ]
    : [ model, Effects.none ]
    )
  // Ignore
  : action.type === 'FirstPaint'
  ? [ model, Effects.none ]
  : action.type === 'OverflowChanged'
  ? [ model, Effects.none ]
  : action.type === 'Scrolled'
  ? [ model, Effects.none ]
  : Unknown.update(model, action)
  );
