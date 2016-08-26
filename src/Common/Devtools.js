/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



import type {Address, DOM} from "reflex"
import type {Result} from "./Result"


import * as Settings from '../Common/Settings';
import * as Runtime from '../Common/Runtime';
import * as Unknown from '../Common/Unknown';
import {merge, always} from '../Common/Prelude';
import {cursor} from '../Common/Cursor';
import {Effects, html, thunk, forward} from 'reflex';
import {Style, StyleSheet} from '../Common/Style';

export type DevtoolsSettings =
  { 'debugger.remote-mode': 'adb-devtools' | 'disabled'
  , 'apz.overscroll.enabled': boolean
  , 'debug.fps.enabled': boolean
  , 'debug.paint-flashing.enabled': boolean
  , 'layers.low-precision': boolean
  , 'layers.low-opacity': boolean
  , 'layers.draw-borders': boolean
  , 'layers.draw-tile-borders': boolean
  , 'layers.dump': boolean
  , 'layers.enable-tiles': boolean
  , 'layers.async-pan-zoom.enabled': boolean
  }

export type Model =
  { isActive: boolean
  , settings: ?DevtoolsSettings
  }

  export type Action =
    | { type: "Report"
      , result: Result<any, any>
      }
    | { type: "NoOp" }
    | { type: "Toggle" }
    | { type: "Restart" }
    | { type: "CleanRestart" }
    | { type: "CleanReload" }
    | { type: "Change"
      , name: Settings.Name
      , value: Settings.Value
      }
    | { type: "Settings"
      , action: Settings.Action
      }

const descriptions =
  { 'debugger.remote-mode': 'Enable Remote DevTools'
  , 'apz.overscroll.enabled': 'Enable overscroll effect'
  , 'debug.fps.enabled': 'FPS'
  , 'debug.paint-flashing.enabled': 'Paint flashing'
  , 'layers.low-precision': 'Low precision buffer & paint'
  , 'layers.low-opacity': 'Low precision opacity'
  , 'layers.draw-borders': 'Draw layer borders'
  , 'layers.draw-tile-borders': 'Draw tile borders'
  , 'layers.dump': 'Layers dump'
  , 'layers.enable-tiles': 'Enable tiles'
  , 'layers.async-pan-zoom.enabled': 'Enable APZC (restart required)'
  };

const writeValue = (key, value) =>
  ( key === 'debugger.remote-mode'
  ? ( value === true
    ? 'adb-devtools'
    : 'disabled'
    )
  : value
  );

const readValue = (key, value) =>
  ( key === 'debugger.remote-mode'
  ? ( value === 'adb-devtools'
    ? true
    : false
    )
  : value
  );

export const Toggle:Action =
  { type: "Toggle"
  };

export const Restart:Action =
  { type: "Restart"
  };

const Report = result =>
  ( { type: "Report"
    , result: result
    }
  );

export const CleanRestart:Action =
  { type: "CleanRestart"
  };

export const CleanReload:Action =
  { type: "CleanReload"
  };

const Change = (name, value) =>
  ( { type: "Change"
    , name
    , value
    }
  );

const NoOP = () =>
  ( { type: "NoOp"
    }
  );

const SettingsAction = action =>
  ( { type: 'Settings'
    , action
    }
  );

const updateSettings = cursor
  ( { get: model => model.settings
    , set: (model, settings) => merge(model, {settings})
    , tag: SettingsAction
    , update: Settings.update
    }
  );

const toggle =
  model =>
  ( model.isActive
  ? deactivate(model)
  : activate(model)
  )

const deactivate =
  model =>
  [ merge(model, {isActive: false})
  , Effects.none
  ]

const activate =
  model =>
  ( model.settings == null
  ? initSettings(merge(model, {isActive: true}))
  : [ merge(model, {isActive: true})
    , Effects.none
    ]
  )

const initSettings =
  model => {
    const [settings, fx] = Settings.init(Object.keys(descriptions));
    const result =
      [ merge(model, {settings})
      , fx.map(SettingsAction)
      ]
    return result
  }


const restart = model =>
  [ model
  , Effects
    .perform(Runtime.restart)
    .map(Report)
  ];

const cleanRestart = model =>
  [ model
  , Effects
    .perform(Runtime.cleanRestart)
    .map(Report)
  ];

const cleanReload = model =>
  [ model
  , Effects
    .perform(Runtime.cleanReload)
    .map(Report)
  ];

const changeSetting = (model, {name, value}) =>
  [ model
  , Effects
    .perform(Settings.change({[name]: value}))
    .map(Settings.Changed)
    .map(SettingsAction)
  ];


const report =
  (model:Model, result:Result<any, any>):[Model, Effects<Action>] =>
  [ model
  , ( result.isOk
    ? Effects.none
    : Effects
      .perform(Unknown.error(result.error))
    )
  ];


export const init =
  ({isActive}:{isActive:boolean}):[Model, Effects<Action>] => {
    const model =
      { isActive
      , settings: null
      }

    const result =
      ( isActive
      ? initSettings(model)
      : [ model, Effects.none ]
      );

    return result;
  };



export const update =
  (model:Model, action:Action):[Model, Effects<Action>] =>
  ( action.type === 'Toggle'
  ? toggle(model)

  // Button actions
  : action.type === 'Restart'
  ? restart(model)
  : action.type === 'CleanRestart'
  ? cleanRestart(model)
  : action.type === 'CleanReload'
  ? cleanReload(model)
  : action.type === 'Report'
  ? report(model, action.result)

  : action.type === 'Change'
  ? changeSetting(model, action)

  : action.type === 'Settings'
  ? updateSettings(model, action.action)

  : Unknown.update(model, action)
  );




const styleSheet = StyleSheet.create
  ( { checkbox:
      { marginRight: '6px'
      , MozAppearance: 'checkbox'
      }
    , label:
      { padding: '6px'
      , MozUserSelect: 'none'
      , display: 'block'
      }
    , button:
      { display: 'block'
      , border: '1px solid #AAA'
      , padding: '3px 6px'
      , margin: '6px'
      , borderRadius: '3px'
      }
    , toolbox:
      { padding: '10px'
      , position: 'absolute'
      , bottom: '10px'
      , left: '10px'
      , width: '300px'
      , height: '400px'
      , color: 'black'
      , backgroundColor: 'white'
      , border: '2px solid #F06'
      , overflow: 'scroll'
      , zIndex: 3
      }
    , initializing:
      { display: 'none'
      }
    , hidden:
      { display: 'none'
      }
    , visible:
      { display: 'block'
      }
    }
  );

const viewSetting = (key, value, address) => {
  const isChecked = readValue(key, value);

  return html.label({
    key: key,
    style: styleSheet.label,
  }, [
    html.input({
      type: 'checkbox',
      checked: isChecked,
      style: styleSheet.checkbox,
      onChange: forward(address, () => Change(key, writeValue(key, !isChecked)))
    }),
    descriptions[key]
  ]);
};

const viewSettings = (settings, address) =>
  html.div({
    key: 'devtools-settings',
    className: 'devtools settings',
  }, Object.keys(settings || {})
           .map(key => thunk(key, viewSetting, key, settings[key], address)))

export const view =
  (model:Model, address:Address<Action>):DOM =>
  html.div({
    className: 'devtools toolbox',
    key: 'devtools-toolbox',
    style: Style
            ( styleSheet.toolbox,

              ( model.isActive
              ? styleSheet.visible
              : styleSheet.hidden
              )
            )
  }, [
    ( model.settings == null
    ? html.div({}, ['Initializing'])
    : thunk('settings', viewSettings, model.settings, address)
    ),
    html.button({
      style: styleSheet.button,
      onClick: forward(address, always(Restart))
    }, ['Restart']),
    html.button({
      style: styleSheet.button,
      onClick: forward(address, always(CleanRestart))
    }, ['Clear cache and restart']),
    html.button({
      style: styleSheet.button,
      onClick: forward(address, always(CleanReload))
    }, ['Clear cache and reload'])
  ]);
