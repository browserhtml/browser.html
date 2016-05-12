/* @flow */

import {Effects, html, forward, thunk} from "reflex"
import {merge} from "../../common/prelude"
import * as Deck from "../deck"
import * as Navigator from "./navigator";
import * as URI from "../../common/url-helper";

/*::
import type {Address, DOM} from "reflex"
export type Model = Deck.Model<Navigator.Model>;
export type Action = Deck.Action<Navigator.Action, Navigator.Flags>;
*/

const open =
  (model, options) =>
  Deck.open
  ( Navigator.init
  , Navigator.update
  , options
  , model
  )

export const init = ()/*:[Model, Effects<Action>]*/ =>
  Deck.init();

export const initWithNewTab =
  ()/*:[Model, Effects<Action>]*/ => {
    const [model1, fx1] = Deck.init();
    const [model2, fx2] = open
      ( model1
      , { id: `${model1.nextID + 1}`
        , input: ''
        , output:
          { uri: URI.read('about:newtab')
          , disposition: 'default'
          , name: 'about:newtab'
          , ref: null
          , guestInstanceId: null
          }
        }
      );
    return [model2, Effects.batch([fx1, fx2])];
  }


export const update =
  (model/*:Model*/, action/*:Action*/)/*:[Model, Effects<Action>]*/ =>
  Deck.update
  ( Navigator.init
  , Navigator.update
  , model
  , action
  );

export const renderCards =
  ( model/*:Model*/
  , address/*:Address<Action>*/
  )/*:Array<DOM>*/ =>
  Deck.renderCards
  ( Navigator.render
  , model
  , address
  )
