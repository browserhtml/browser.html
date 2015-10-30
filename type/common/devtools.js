/* @flow */

import type {Address, VirtualTree, Effects} from "reflex/type"
import * as Settings from "./settings"
import * as Focusable from "./focusable"

export type Model = {
  isActive: boolean,
  settings: {
    'debugger.remote-mode': 'adb-devtools' | 'disabled',
    'apz.overscroll.enabled': boolean,
    'debug.fps.enabled': boolean,
    'debug.paint-flashing.enabled': boolean,
    'layers.low-precision': boolean,
    'layers.low-opacity': boolean,
    'layers.draw-borders': boolean,
    'layers.draw-tile-borders': boolean,
    'layers.dump': boolean,
    'layers.enable-tiles': boolean,
    'layers.async-pan-zoom.enabled': boolean
  }
}

// Focus / Blur on devtools hud activates / deactivates it. Just reusing
// types instead of defining new ones.
export type Activate = Focusable.Focus
export type Deactivate = Focusable.Blur
// Clicking toggles on the devtools UI updates settings. Step funciton
// then triggers associated IO task.
export type UpdateSetting = {
  type: "Devtools.UpdateSetting",
  name: Settings.Name,
  value: Settings.Value
}

export type Response
  = Settings.Changed
  | Settings.Updated
  | Settings.Fetched

export type Action
  = Activate
  | Deactivate
  | UpdateSetting
  | Response

export type initialize = () => [Model, Effects<Settings.Fetched>]
export type step = (model:Model, address:Address<Action>) => [Model, Effects<Response>]
