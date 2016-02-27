/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge, batch, tag, tagged} from "../../common/prelude";
import {Style, StyleSheet} from '../../common/style';
import * as Settings from '../../common/settings';
import * as Unknown from '../../common/unknown';
import * as Setting from './setting';

// Actions

export const Terminate = tagged("Terminate");
const Save = tag("Save");
const Saved = tag("Saved");
const Observe = tagged("Observe");
const Change = tag("Change");
const Fetched = tag("Fetched");
const Changed = tag("Changed");


const SettingAction =
  (name, action) =>
  ( action.type === 'Save'
  ? Save
    ( { [name]: action.source
      }
    )
  : { type: "Setting"
    , name
    , source: action
    }
  );

const SettingActionByName =
  name =>
  action =>
  SettingAction(name, action);

const ChangeSetting =
  (name, value) =>
  SettingAction(name, Setting.Change(value));

export const init = () => {
  const model =
    { settings: {}
    };

  const fx = Effects.batch
    ( [ Effects
        .task(Settings.fetch(["*"]))
        .map(Fetched)
      , Effects
        .task(Settings.observe("*"))
        .map(Changed)
      ]
    );

  return [model, fx];
};

const observe =
  model =>
  [ model
  , Effects
    .task(Settings.observe("*"))
    .map(Changed)
  ];


const change =
  (model, result) => {
    if (result.isOk) {
      const {settings} = model;
      const changes = result.value;
      const effects = [];
      const delta = {};

      const patch = Object
      .keys(changes)
      .reduce
      ( (patch, name) => {
          const value = changes[name];
          const [setting, fx] =
            ( settings[name] == null
            ? Setting.init(value)
            : Setting.update
              ( settings[name]
              , Setting.Change(value)
              )
            );

          patch.settings[name] = setting;
          patch.fx.push(fx.map(SettingActionByName(name)));

          return patch;
        }
      , { settings: {}
        , fx: []
        }
      );

      return (
        [ merge
          ( model
          , { settings:
              merge
              ( model.settings
              , patch.settings
              )
            }
          )
        , Effects.batch(patch.fx)
        ]
      );
    } else {
      return [model, Effects.task(Unknown.error(result.error))];
    }
  };

const save =
  (model, changes) =>
  [ model
  , Effects
    .task(Settings.change(changes))
    .map(Saved)
  ];


const changed =
  (model, result) =>
  batch
  ( update
  , model
  , [ Change(result)
    , Observe
    ]
  );

const updateSettingByName = (model, name, action) => {
  const [setting, fx] = Setting.update(model.settings[name], action);
  const result =
    [ merge
      ( model
      , { settings:
          merge
          ( model.settings
          , {[name]: setting}
          )
        }
      )
    , fx
      .map(SettingActionByName(name))
    ]
  return result
}

// @TODO: Should remove setting observers during termination.
const terminate =
  model =>
  [ model
  , Effects.none
  ];

export const update/*:type.update*/ =
  (model, action) =>
  ( action.type === 'Save'
  ? save(model, action.source)

  : action.type === 'Saved'
  ? change(model, action.source)

  : action.type === 'Fetched'
  ? change(model, action.source)

  : action.type === 'Changed'
  ? changed(model, action.source)

  : action.type === 'Change'
  ? change(model, action.source)

  : action.type === 'Observe'
  ? observe(model)

  : action.type === 'Setting'
  ? updateSettingByName(model, action.name, action.source)

  : action.type === 'Terminate'
  ? terminate(model)

  : Unknown.update(model, action)
  );


const styleSheet = StyleSheet.create
  ( { invalid:
      { textDecoration: 'underline wavy red'
      }
    , base:
      { fontSize: '12px'
      , fontFamily: 'Menlo, Courier, monospace'
      , color: 'rgba(255,255,255,0.65)'
      , backgroundColor: '#273340'
      , position: 'absolute'
      , top: '0px'
      , left: '0px'
      , width: '100%'
      , overflow: 'auto'
      }
    , row:
      { borderBottom: '1px dotted rgba(255, 255, 255, 0.2)'
      , lineHeight: '25px'
      , whiteSpace: 'nowrap'
      , padding: '0 5px'
      }
    , cell:
      { verticalAlign: 'middle'
      , display: 'inline-block'
      , whiteSpace: 'nowrap'
      , textOverflow: 'ellipsis'
      , overflow: 'hidden'
      }
    , name:
      { minWidth: '300px'
      }
    , value:
      { width: '100vh'
      , padding: '0 0 0 0'
      }
    }
  );


export const view/*:type.view*/ =
  (model, address) =>
    html.div
    ( { key: 'settings'
      , style: styleSheet.base
      }
    , [ ...Object.keys(model.settings)
        .map
        ( name =>
          html.div
          ( { style: Style
              ( styleSheet.row
              , ( model.settings[name].isValid
                ? styleSheet.valid
                : styleSheet.invalid
                )
              )
            }
          , [ html.code
              ( { key: 'name'
                , style: Style(styleSheet.cell, styleSheet.name)
                }
              , [name]
              )
            , html.code
              ( { key: 'value'
                , style: Style(styleSheet.cell, styleSheet.value)
                }
              , [ thunk
                  ( name
                  , Setting.view
                  , model.settings[name]
                  , forward(address, SettingActionByName(name))
                  )
                ]
              )
            ]
          )
        )
      , html.meta
        ( { name: 'theme-color'
          , content: `${styleSheet.base.backgroundColor}|${styleSheet.base.color}`
          }
        )
      ]
    );
