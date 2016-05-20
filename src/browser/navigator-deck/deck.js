/* @flow */

import {Effects, html, forward, thunk} from "reflex"
import {merge} from "../../common/prelude"
import * as Deck from "../deck"
import * as Navigator from "./navigator";
import * as URI from "../../common/url-helper";

/*::
import type {Address, DOM} from "reflex"
export type Model = Deck.Model<Navigator.Model>;

export type Command =
  | { type: "ShowTabs" }
  | { type: "OpenNewTab" }
  | { type: "GoBack" }
  | { type: "GoForward" }
  | { type: "Reload" }
  | { type: "ZoomIn" }
  | { type: "ZoomOut" }
  | { type: "ResetZoom" }

export type Action =
  | Deck.Action<Navigator.Action, Navigator.Flags>
  | Command
*/

export const ShowTabs = { type: "ShowTabs" };
export const OpenNewTab = { type: "OpenNewTab" };
export const ActivateNewTab = { type: "Activate", id: "about:newtab" };
export const GoBack = { type: "GoBack" }
export const GoForward = { type: "GoForward" }
export const Reload = { type: "Reload" }
export const ZoomOut = { type: "ZoomOut" }
export const ZoomIn = { type: "ZoomIn" }
export const ResetZoom = { type: "ResetZoom" }


const open =
  (model, options) =>
  Deck.open
  ( Navigator.init
  , Navigator.update
  , options
  , model
  )

const toCommand =
  action => {
    switch (action.type) {
      case "ShowTabs":
        return ShowTabs;
      case "OpenNewTab":
        return OpenNewTab;
      default:
        return null;
    }
  }

const tag =
  (action/*:Deck.Action<Navigator.Action, Navigator.Flags>*/)/*:Action*/ => {
    switch(action.type) {
      case "Modify":
        const command = toCommand(action.modify)
        return (
            command == null
          ? action
          : command
          )
      default:
        return action
    }
  }

export const init =
  ()/*:[Model, Effects<Action>]*/ =>
  Deck.init();

export const initWithNewTab =
  ()/*:[Model, Effects<Action>]*/ => {
    const [model1, fx1] = Deck.init();
    const [model2, fx2] = open
      ( model1
      , { id: `about:newtab`
        , input:
          { value: ''
          , isVisible: true
          , isFocused: true
          }

          , output:
          { uri: URI.read('about:newtab')
          , disposition: 'default'
          , name: 'about:newtab'
          , features: ''
          , ref: null
          , guestInstanceId: null
          }
        , assistant: true
        , overlay: false
        }
      );
    const fx = Effects.batch([fx1, fx2])
    const model = model2;

    return [ model, fx.map(tag) ]
  }

const nofx = model => [model, Effects.none]

export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ => {
    switch (action.type) {
      case "ShowTabs":
        return nofx(model);
      case "OpenNewTab":
        return openNewTab(model);
      case "GoBack":
        return updateActive(model, Navigator.GoBack);
      case "GoForward":
        return updateActive(model, Navigator.GoForward);
      case "Reload":
        return updateActive(model, Navigator.Reload);
      case "ZoomIn":
        return updateActive(model, Navigator.ZoomIn);
      case "ZoomOut":
        return updateActive(model, Navigator.ZoomOut);
      case "ResetZoom":
        return updateActive(model, Navigator.ResetZoom);
      default:
        return Deck.update(
          Navigator.init
        , Navigator.update
        , model
        , action
        );
    }
  }

const openNewTab =
  model =>
  Deck.update
  ( Navigator.init
  , Navigator.update
  , model
  , ActivateNewTab
  );

export const renderCards =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:Array<DOM>*/ =>
  Deck.renderCards
  ( Navigator.render
  , model
  , forward(address, tag)
  )

const updateActive =
  ( model, action ) =>
  Deck.update
  ( Navigator.init
  , Navigator.update
  , model
  , { type: "Modify"
    , id: model.active
    , modify: action
    }
  )
