/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, thunk, forward, Effects} from 'reflex';
import {Style, StyleSheet} from '../../common/style';
import * as Toggle from "../../common/toggle";
import * as Button from "../../common/button";
import {merge} from "../../common/prelude";
import {cursor} from "../../common/cursor";
import * as Unknown from "../../common/unknown";

/*:: import * as type from "../../../type/browser/sidebar/toolbar" */

export const Attach/*:type.Attach*/ =
  { type: "Attach"
  };

export const Detach/*:type.Detach*/ =
  { type: "Detach"
  };

export const CreateWebView =
  { type: "CreateWebView"
  };

const ToggleAction = action =>
  ( action.type === "Check"
  ? Attach
  : action.type === "Uncheck"
  ? Detach
  : {type: "Toggle", action}
  );

const CloseButtonAction = action =>
  ( action.type === "Press"
  ? CreateWebView
  : { type: "CloseButton"
    , source: action
    }
  );

const updateToggle = cursor({
  get: model => model.pin,
  set: (model, pin) => merge(model, {pin}),
  tag: ToggleAction,
  update: Toggle.update
});

const updateCloseButton = cursor({
  get: model => model.close,
  set: (model, close) => merge(model, {close}),
  tag: CloseButtonAction,
  update: Button.update
})

export const init/*:type.init*/ = () => {
  const [pin, pinFX] = Toggle.init();
  const [close, closeFX] = Button.init(false, false, false, false, '');
  return [
    {pin, close},
    Effects.batch
    ( [ pinFX.map(ToggleAction)
      , closeFX.map(CloseButtonAction)
      ]
    )

  ]
}

export const Model/*:type.Toolbar*/ =
  ({pin, close}) =>
  ({pin, close});

export const update/*:type.update*/ = (model, action) =>
  ( action.type === "Attach"
  ? updateToggle(model, Toggle.Check)
  : action.type === "Detach"
  ? updateToggle(model, Toggle.Uncheck)

  : action.type === "Toggle"
  ? updateToggle(model, action.action)
  : action.type === "CloseButton"
  ? updateCloseButton(model, action.source)

  : Unknown.update(model, action)
  );

export const styleSheet = StyleSheet.create({
  base: {
    left: '0',
    height: '48px',
    position: 'absolute',
    bottom: '0',
    width: '100%'
  },
  invisible: {
    opacity: 0,
    pointerEvents: 'none'
  }
});

const viewPin = Toggle.view('pin-button', StyleSheet.create({
  base: {
    cursor: 'pointer',
    height: '32px',
    width: '32px',
    margin: '8px',
    borderRadius: '5px',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'transparent',
    backgroundPosition: 'center',
    backgroundImage: 'url(css/pin.png)',
    backgroundSize:
        window.devicePixelRatio == null
      ? '24px 36px'
      : `${24 / window.devicePixelRatio}px ${36 / window.devicePixelRatio}px`
  },
  checked: {
    backgroundColor: '#3D91F2'
  }
}));

const viewClose = Button.view('create-tab-button', StyleSheet.create({
  base:
  { MozWindowDragging: 'no-drag'
  , color: 'rgb(255,255,255)'
  , fontFamily: 'FontAwesome'
  , fontSize: '18px'
  , lineHeight: '32px'
  , position: 'absolute'
  , textAlign: 'center'
  , bottom: '8px'
  , right: '8px'
  , width: '32px'
  , height: '32px'
  , background: 'transparent'
  }
}));

export const view/*:type.view*/ = (model, address, display) =>
  html.div({
    key: 'sidebar-toolbar',
    className: 'sidebar-toolbar',
    style:
    Style
    ( styleSheet.base
    , ( display.toolbarOpacity === 0
      ? styleSheet.invisible
      : { opacity: display.toolbarOpacity }
      )
    )
  }, [
    thunk('pin', viewPin, model.pin, forward(address, ToggleAction)),
    thunk('close', viewClose, model.close, forward(address, CloseButtonAction))
  ]);
