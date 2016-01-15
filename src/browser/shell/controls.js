/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {html, forward, Effects} from 'reflex';
import {Style, StyleSheet} from '../../common/style';
import * as Target from '../../common/target';
import * as Button from '../../common/button';
import * as Toggle from '../../common/toggle';
import * as Unknown from '../../common/unknown';
import {compose} from '../../lang/functional';
import {always, merge} from '../../common/prelude';
import {cursor} from '../../common/cursor';


/*:: import * as type from '../../../type/browser/shell/controls' */

export const CloseWindow = {type: "CloseWindow"};
export const MinimizeWindow = {type: "MinimizeWindow"};
export const ToggleWindowFullscreen = {type: "ToggleWindowFullscreen"};

export const FullscreenToggled = {type: "FullscreenToggled"};
export const Ignore = {type: "Ignore"};
export const Over = {type: "Over"};
export const Out = {type: "Out"};
export const Enable = {type: "Enable"};
export const Disable = {type: "Disable"};

const ignore = action =>
  ( action.type === "Target"
  ? Ignore
  : action.type === "Focusable"
  ? Ignore
  : action
  );


const CloseButtonAction = compose
  ( action =>
    ( action === Ignore
    ? Ignore
    : action.type === "Press"
    ? CloseWindow
    : ( { type: "CloseButton"
        , source: action
        }
      )
    )
  , ignore
  );

const MinimizeButtonAction = compose
  ( action =>
    ( action === Ignore
    ? Ignore
    : action.type === "Press"
    ? MinimizeWindow
    : ( { type: "MinimizeButton"
        , source: action
        }
      )
    )
  , ignore
  );

const ToggleButtonAction = compose
  ( action =>
    ( action === Ignore
    ? Ignore
    : action.type === "Press"
    ? ToggleWindowFullscreen
    : ( { type: "ToggleButton"
        , source: action
        }
      )
    )
  , ignore
  );

export const Model/*:type.Controls*/ =
  ({close, minimize, toggle}) =>
  ({close, minimize, toggle})

const updateClose = cursor({
  get: model => model.close,
  set: (model, close) => merge(model, {close}),
  update: Button.update,
  tag: CloseButtonAction
});

const updateMinimize = cursor({
  get: model => model.minimize,
  set: (model, minimize) => merge(model, {minimize}),
  update: Button.update,
  tag: MinimizeButtonAction
});

const updateToggle = cursor({
  get: model => model.toggle,
  set: (model, toggle) => merge(model, {toggle}),
  update: Toggle.update,
  tag: ToggleButtonAction
});

export const init/*:type.init*/ = (isDisabled, isPointerOver, isMaximized) => {
  const [isFocused, isActive] = [false, false];

  const close = Button.Model
    ( { isDisabled
      , isPointerOver
      , isFocused
      , isActive
      , text: ''
      }
    );

  const minimize = Button.Model
    ( { isDisabled
      , isPointerOver
      , isFocused
      , isActive
      , text: ''
      }
    );

  const toggle = Toggle.Model
    ( { isDisabled
      , isFocused
      , isActive
      , isPointerOver
      , isChecked: isMaximized
      }
    );

  return [{close, minimize, toggle}, Effects.none];
}

const updateButtons = (model, action) => {
  const [close, closeFx] = Button.update(model.close, action);
  const [minimize, minimizeFx] = Button.update(model.minimize, action);
  const [toggle, toggleFx] = Toggle.update(model.toggle, Toggle.ButtonAction(action));

  return [
    merge(model, {close, minimize, toggle})
  , Effects.batch(
      [ closeFx.map(CloseButtonAction)
      , minimizeFx.map(MinimizeButtonAction)
      , toggleFx.map(ToggleButtonAction)
      ]
    )
  ]
}

export const update/*:type.update*/ = (model, action) =>
  ( action.type === 'Over'
  ? updateButtons(model, Button.Over)
  : action.type === 'Out'
  ? updateButtons(model, Button.Out)
  : action.type === 'Enable'
  ? updateButtons(model, Button.Enable)
  : action.type === 'Disable'
  ? updateButtons(model, Button.Disable)
  : action.type === 'FullscreenToggled'
  ? updateToggle(model, Toggle.Press)
  : action.type === 'Ignore'
  ? [model, Effects.none]
  : action.type === 'CloseButton'
  ? updateClose(model, action.source)
  : action.type === 'MinimizeButton'
  ? updateMinimize(model, action.source)
  : action.type === 'ToggleButton'
  ? [model, Effects.none]
  : Unknown.update(model, action)
  );


// style

const styleSheet = StyleSheet.create({
  container: {
    // servo$
    display: 'none',
    height: '12px',
    position: 'absolute',
    width: '50px',
    top: '8px',
    left: '8px',
    zIndex: 200
  },
  button: {
    backgroundColor: 'transparent',
    backgroundImage: 'url(css/window-controls.sprite.png)',
    backgroundRepeat: 'no-repeat',
    // Scale sprite by 1/2 for retina.
    backgroundSize: '25px auto',
    width: '12px',
    height: '12px',
    left: 0,
    position: 'absolute',
    top: 0
  },
  disabledButton: {
    backgroundPosition: '0 -300px'
  },
  closeButton: {
    left: 0
  },
  minimizeButton: {
    left: '20px'
  },
  toggleButton: {
    left: '40px'
  }
});

const viewClose = Button.view('window-close-button', StyleSheet.create({
  base: Style(styleSheet.button, styleSheet.closeButton),
  disabled: styleSheet.disabledButton,
  enabled: {
    backgroundPosition: '0 -150px',
  },
  over: {
    backgroundPosition: '0 0'
  }
}));

const viewMinimize = Button.view('window-minimize-button', StyleSheet.create({
  base: Style(styleSheet.button, styleSheet.minimizeButton),
  disabled: styleSheet.disabledButton,
  enabled: {
    backgroundPosition: '0 -200px',
  },
  over: {
    backgroundPosition: '0 -50px'
  }
}));

// @TODO Checked and uncheked versions should be styled differently.
const viewToggle = Toggle.view('window-toggle-fullscreen-button', StyleSheet.create({
  base: Style(styleSheet.button, styleSheet.toggleButton),
  disabled: styleSheet.disabledButton,
  enabled: {
    backgroundPosition: '0 -250px'
  },
  over: {
    backgroundPosition: '0 -100px'
  }
}));



export const view/*:type.view*/ = (model, address) =>
  html.div({
    key: 'window-controls',
    className: 'window-controls',
    style: styleSheet.container,
    onMouseOver: forward(address, always(Over)),
    onMouseOut: forward(address, always(Out)),
  }, [
    viewClose(model.close, forward(address, CloseButtonAction)),
    viewMinimize(model.minimize, forward(address, MinimizeButtonAction)),
    viewToggle(model.toggle, forward(address, ToggleButtonAction))
  ]);
