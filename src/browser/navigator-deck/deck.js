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

export type Action =
  | Deck.Action<Navigator.Action, Navigator.Flags>
  | Command
*/

export const ShowTabs = { type: "ShowTabs" }

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
      , { id: `${model1.nextID + 1}`
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
        , assistant: false
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
      default:
        return Deck.update(
          Navigator.init
        , Navigator.update
        , model
        , action
        );
    }
  }

export const renderCards =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:Array<DOM>*/ =>
  Deck.renderCards
  ( Navigator.render
  , model
  , forward(address, tag)
  )
