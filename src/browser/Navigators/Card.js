/* @flow */

import {Effects} from "reflex"
import * as Navigator from "./Navigator"
import * as NewTab from "./NewTab"

/*::
export type Action =
  | { tag: "NewTab", value: NewTab.Action }
  | { tag: "Navigator", value: Navigator.Action }


export type Flags =
  | { tag: "Navigator", value: Navigator.Flags }
  | { tag: "NewTab", value: NewTab.Flags }

export type Model =
  | { tag: "NewTab", value: NewTab.Model }
  | { tag: "Navigator", value: Navigator.Model }
*/

class NewTabTag /*::<value>*/ {
  /*::
  tag: "NewTab";
  value: value;
  */
  constructor(value/*:value*/) {
    this.tag = "NewTab"
    this.value = value
  }
}

class NavigatorTag /*::<value>*/ {
  /*::
  tag: "Navigator";
  value: value;
  */
  constructor(value/*:value*/) {
    this.tag = "Navigator"
    this.value = value
  }
}

const tagNewTab = /*::<value>*/
  (value/*:value*/)/*:NewTabTag<value>*/ =>
  new NewTabTag(value)

const tagNavigator = /*::<value>*/
  (value/*:value*/)/*:NavigatorTag<value>*/ =>
  new NavigatorTag(value)


export const init =
  (flags/*:Flags*/)/*:[Model, Effects<Action>]*/ => {
    switch (flags.tag) {
      case "NewTab":
        {
          const [model, fx] = NewTab.init(flags.value);
          return [ new NewTabTag(model), fx.map(tagNewTab) ]
        }
      case "Navigator":
      default:
        {
          const [model, fx] = Navigator.init(flags.value);
          return [ new NavigatorTag(model), fx.map(tagNavigator) ]
        }
    }
  }

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    switch (action.tag) {
      case "NewTab": {
        switch (model.tag) {
          case "NewTab":
            const [value, fx] = NewTab.update(model.value, action.value);
            return [new NewTabTag(value), fx.map(tagNewTab)]
        }
      }

      case "Navigator":{
        switch (model.tag) {
          case "Navigator":
            const [value, fx] = Navigator.update(model.value, action.value);
            return [new NavigatorTag(value), fx.map(tagNavigator) ]
        }
      }

      default:
        return [model, Effects.none]
    }
  }
