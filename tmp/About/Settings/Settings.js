/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {merge, batch, always, tag, tagged} from "../../common/prelude";
import {Style, StyleSheet} from '../../common/style';
import * as Settings from '../../common/settings';
import * as Unknown from '../../common/unknown';
import * as Setting from './setting';


import type {Address, DOM} from "reflex";
import type {Name, Value, ResultSettings} from '../../common/settings';

export type {Name, Value}

export type Model =
  { settings: {[key:Name]: Setting.Model}
  }

export type Action =
  | { type: "NoOp" }
  | { type: "Setting"
    , name: Name
    , setting: Setting.Action
    }
  | { type: "Observe" }
  | { type: "Save"
    , save: Settings.Settings
    }
  | { type: "Saved"
    , saved: ResultSettings
    }
  | { type: "Change"
    , change: ResultSettings
    }
  | { type: "Fetched"
    , fetched: ResultSettings
    }
  | { type: "Changed"
    , changed: ResultSettings
    }


// Actions

const NoOp = always({ type: "NoOp" });

const Save =
  settings =>
  ( { type: "Save"
    , save: settings
    }
  );

const Saved =
  result =>
  ( { type: "Saved"
    , saved: result
    }
  );

const Observe =
  { type: "Observe"
  };

const Change =
  result =>
  ( { type: "Change"
    , change: result
    }
  );

const Fetched =
  result =>
  ( { type: "Fetched"
    , fetched: result
    }
  );

const Changed =
  result =>
  ( { type: "Changed"
    , changed: result
    }
  );


const SettingAction =
  (name:Name, action:Setting.Action):Action =>
  ( action.type === 'Save'
  ? Save
    ( { [name]: action.save
      }
    )
  : { type: "Setting"
    , name
    , setting: action
    }
  );

const SettingActionByName =
  (name:Name):(action:Setting.Action) => Action =>
  action =>
  SettingAction(name, action);

const ChangeSetting =
  (name, value) =>
  SettingAction(name, Setting.Change(value));

export const init = ():[Model, Effects<Action>] => {
  const model =
    { settings: {}
    };

  const fx = Effects.batch
    ( [ Effects
        .perform(Settings.fetch(["*"]))
        .map(Fetched)
      , Effects
        .perform(Settings.observe("*"))
        .map(Changed)
      ]
    );

  return [model, fx];
};

const observe =
  model =>
  [ model
  , Effects
    .perform(Settings.observe("*"))
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
      const output =
        [ model
        , Effects.perform
          (Unknown.error(result.error))
        ];

      return output
    }
  };

const save =
  (model, changes) =>
  [ model
  , Effects
    .perform(Settings.change(changes))
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

export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === 'Save'
  ? save(model, action.save)

  : action.type === 'Saved'
  ? change(model, action.saved)

  : action.type === 'Fetched'
  ? change(model, action.fetched)

  : action.type === 'Changed'
  ? changed(model, action.changed)

  : action.type === 'Change'
  ? change(model, action.change)

  : action.type === 'Observe'
  ? observe(model)

  : action.type === 'Setting'
  ? updateSettingByName(model, action.name, action.setting)

  : Unknown.update(model, action)
  );


const styleSheet = StyleSheet.create
  ( { invalid:
      { textDecoration: 'underline wavy red'
      }
    , valid:
      {
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


export const view =
  (model:Model, address:Address<Action>):DOM =>
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
