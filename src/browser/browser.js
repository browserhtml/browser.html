/* @flow */

import {version} from "../../package.json";
import {Effects, html, forward} from "reflex";

import * as PerspectiveUI from "./perspective-ui";
import * as Shell from "./shell";
import * as Input from "./input";
import * as Assistant from "./assistant";

// import * as Updater from "./updater"
// import * as Devtools from "./devtools"
import * as WebViews from "./web-views"

import {asFor, merge, always} from "../common/prelude";

/*:: import * as type from "../../type/browser/browser" */

export const initialize/*:type.initialize*/ = () => {
  // const [devtools, devtoolsFx] = Devtools.initialize();
  // const [updates, updaterFx] = Updater.initialize();

  const model = {
    version,
    mode: PerspectiveUI.initial,
    shell: Shell.initial,
    input: Input.initial,
    suggestions: Assistant.initial,
    webViews: WebViews.initial,
    // updates: updates,
    // devtools: devtools
  };

  // @TODO hook up effects
  // const fx = Effects.batch([
  //   asFor("Devtools", devtoolsFx),
  //   asFor("Updater", updaterFx)
  // ]);

  return [model, Effects.none];
}

// Unbox For actions and route them to their location.
const stepFor = (target, model, action) => {
  if (target === 'Browser.KeyUp' || target === 'Browser.KeyDown') {
    if (action.type === 'Keyboard.KeyUp' ||
        action.type === 'Keyborad.KeyDown' ||
        action.type === 'Keyboard.KeyPress') {
      return [model, Effects.none];
    } else {
      return step(model, action);
    }
  }
  else if (target === 'input') {
    if (action.type === 'Input.Submit') {
      const [input, inputFx] = Input.step(model.input, action);

      const navigate = WebViews.asNavigateTo(model.input.value);
      const [webViews, viewFx] = WebViews.step(model.webViews, navigate);
      // more things need to happen here.
      return [
        merge(model, {input, webViews}),
        Effects.batch([
          inputFx.map(asFor('input')),
          viewFx.map(asFor('webViews'))
        ])
      ]
    } else {
      const [input, fx] = Input.step(model.input, action);
      return [merge(model, {input}), fx.map(asFor('input'))];
    }
  }
  else if (target === 'shell') {
    const [shell, fx] = Shell.step(model.shell, action);
    return [merge(model, {shell}), fx.map(asFor('shell'))];
  }
  else if (target === 'webViews') {
    const [webViews, fx] = WebViews.step(model.webViews, action);
    return [merge(model, {webViews}), fx.map(asFor('webViews'))];
  }
  else {
    return [model, Effects.none];
  }
}

export const step/*:type.step*/ = (model, action) =>
  action.type === 'For' ?
    stepFor(action.target, model, action.action) :
    [model, Effects.none];
