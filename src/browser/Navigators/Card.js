/* @flow */

import {Effects} from "reflex"
import * as Navigator from "./Navigator"
import * as NewTab from "./NewTab"

/*::
export type Action =
  | { tag: "NewTab", newTab: NewTab.Action }
  | { tag: "Navigator", navigator: Navigator.Action }


export type Flags =
  | { tag: "Navigator", navigator: Navigator.Flags }
  | { tag: "NewTab", newTab: NewTab.Flags }

export type Model =
  | { tag: "NewTab", newTab: NewTab.Model }
  | { tag: "Navigator", navigator: Navigator.Model }
*/

class NewTabTag /*::<value>*/ {
  /*::
  tag: "NewTab";
  newTab: value;
  */
  constructor(value/*:value*/) {
    this.tag = "NewTab"
    this.newTab = value
  }
}

class NavigatorTag /*::<value>*/ {
  /*::
  tag: "Navigator";
  navigator: value;
  */
  constructor(value/*:value*/) {
    this.tag = "Navigator"
    this.navigator = value
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
          const [model, fx] = NewTab.init(flags.newTab);
          return [ new NewTabTag(model), fx.map(tagNewTab) ]
        }
      case "Navigator":
      default:
        {
          const [model, fx] = Navigator.init(flags.navigator);
          return [ new NavigatorTag(model), fx.map(tagNavigator) ]
        }
    }
  }

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    switch (model.tag) {
      case "NewTab":
        return updateNewTab(model, action)

      case "Navigator":
        return updateNavigator(model, action)

      default:
        return [model, Effects.none]
    }
  }

const updateNewTab =
  (model, action) => {
    switch (action.tag) {
      case "NewTab":
        const [value, fx] = NewTab.update(model.newTab, action.newTab)
        return [new NewTabTag(value), fx.map(tagNewTab)]
      default:
        return [model, Effects.none]
    }
  }

const updateNavigator =
  (model, action) => {
    switch (action.tag) {
      case "Navigator":
        const [value, fx] = Navigator.update(model.navigator, action.navigator)
        return [new NavigatorTag(value), fx.map(tagNavigator)]
      default:
        return [model, Effects.none]
    }
  }

export const close =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    switch (model.tag) {
      case "NewTab": {
        const [value, fx] = NewTab.close(model.newTab)
        return [new NewTabTag(value), fx.map(tagNewTab)]
      }
      case "Navigator": {
        const [value, fx] = Navigator.close(model.navigator);
        return [new NavigatorTag(value), fx.map(tagNavigator) ]
      }
      default:
        return [model, Effects.none]
    }
  }

export const select =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    switch (model.tag) {
      case "NewTab": {
        const [value, fx] = NewTab.select(model.newTab)
        return [new NewTabTag(value), fx.map(tagNewTab)]
      }
      case "Navigator": {
        const [value, fx] = Navigator.select(model.navigator);
        return [new NavigatorTag(value), fx.map(tagNavigator) ]
      }
      default:
        return [model, Effects.none]
    }
  }

export const deselect =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:[Model, Effects<Action>]*/ => {
    switch (model.tag) {
      case "NewTab": {
        const [value, fx] = NewTab.deselect(model.newTab)
        return [new NewTabTag(value), fx.map(tagNewTab)]
      }
      case "Navigator": {
        const [value, fx] = Navigator.deselect(model.navigator);
        return [new NavigatorTag(value), fx.map(tagNavigator) ]
      }
      default:
        return [model, Effects.none]
    }
  }
