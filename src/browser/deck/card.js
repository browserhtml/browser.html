/* @flow */

export type Action <action> =
  | { type: "Deactivate" }
  | { type: "Activate" }
  | { type: "Deselect" }
  | { type: "Select" }
  | { type: "Modify", modify: action }
  | { type: "Close" }

export const Close = { type: "Close" }
export const Select = { type: "Select" }
export const Deselect = { type: "Deselect" }
export const Activate = { type: "Activate" }
export const Deactivate = { type: "Deactivate" }
export const Modify = /*::<action>*/
  (action/*:action*/)/*:Action<action>*/ =>
  ( { type: "Modify"
    , modify: action
    }
  );

// import {Effects, html, forward, thunk} from "reflex"
// import {merge} from "../../common/prelude"
// import * as Unknown from "../../common/unknown"
//
//
// export type ID = string
//
// export type Model <model> =
//   { id: ID
//   , content: model
//   // Fields isSelected & isActive can have three values, true, false, and void.
//   // Value void is used to represent transitional state from true to false or
//   // vice versa.
//   , isSelected: ?boolean
//   , isActive: ?boolean
//   }
//
// export type Flags <flags> =
//   { flags: flags
//   , id: ID
//   , isOpened: Switch
//   , isClosed: Switch
//   , isSelected: Switch
//   , isActive: Switch
//   }
//
// export type Action <action, flags> =
//   | { type: "Open", open: flags }
//   | { type: "Opened", opened: action  }
//   | { type: "Close", close: action }
//   | { type: "Closed", closed: action }
//   | { type: "Select", select: action }
//   | { type: "Selected", selected: action }
//   | { type: "Deselect", deselect: action }
//   | { type: "Deselected", deselected: action }
//   | { type: "Activate", activate: action }
//   | { type: "Activated", activated: action }
//   | { type: "Deactivate", deactivate: action }
//   | { type: "Deactivated", deactivated: action }
//   | { type: "Modify", modify: action }
//   | { type: "Command", command: action }
//
// export type Advance <action, model> =
//   (model:model) =>
//   [ model
//   , Effects<action>
//   ]
//
// export type Lift <from, to> =
//   (input:from) =>
//   to
//
// export type Change <action, model> =
//   [ model
//   , Effects<action>
//   ]
//
// export type Init <action, model, flags> =
//   (flags:flags) =>
//   Change<action, model>
//
// export type Update <action, model> =
//   (model:model, action:action) =>
//   Change<action, model>
//
// const Tag =
//   { opened: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Opened"
//       , opened: action
//       }
//     )
//   , closed: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Closed"
//       , closed: action
//       }
//     )
//   , selected: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Selected"
//       , selected: action
//       }
//     )
//   , deselected: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Deselected"
//       , deselected: action
//       }
//     )
//   , activated: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Activated"
//       , activated: action
//       }
//     )
//   , deactivated: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Deactivated"
//       , deactivated: action
//       }
//     )
//   , modify: /*::<action, flags>*/
//     ( action/*:action*/ )/*:Action<action, flags>*/  =>
//     ( { type: "Modify"
//       , modify: action
//       }
//     )
//   };
//
//
// export const create = /*::<action, model, flags>*/
//   ( tag/*:Lift<action, Action<action, flags>>*/
//   , init/*:Init<action, model, flags>*/
//   , options/*:Flags<flags>*/
//   )/*:Change<Action<action, flags>, Model<model>>*/ => {
//     const [content, fx] = init(options.flags);
//     const model =
//       { id: options.id
//       , content
//       , isOpened: options.isOpened
//       , isClosed: options.isClosed
//       , isSelected: options.isSelected
//       , isActive: options.isActive
//       }
//
//     return [model, fx.map(tag)];
//   }
//
// export const update = /*::<action, model, flags>*/
//   ( updateContent/*:Update<action, model>*/
//   , model/*:Model<model>*/
//   , action/*:Action<action, flags>*/
//   )/*:Change<Action<action, flags>, Model<model>>*/ =>
//   ( action.type === "Open"
//   ? open(updateContent, model, action.open)
//   : action.type === "Opened"
//   ? opened(updateContent, model, action.opened)
//   : action.type === "Close"
//   ? close(updateContent, model, action.close)
//   : action.type === "Closed"
//   ? closed(updateContent, model, action.closed)
//   : action.type === "Select"
//   ? select(updateContent, model, action.select)
//   : action.type === "Selected"
//   ? selected(updateContent, model, action.selected)
//   : action.type === "Deselect"
//   ? deselect(updateContent, model, action.deselect)
//   : action.type === "Deselected"
//   ? deselected(updateContent, model, action.deselected)
//   : action.type === "Activate"
//   ? activate(updateContent, model, action.activate)
//   : action.type === "Activated"
//   ? activated(updateContent, model, action.activated)
//   : action.type === "Deactivate"
//   ? deactivate(updateContent, model, action.deactivate)
//   : action.type === "Deactivated"
//   ? deactivated(updateContent, model, action.deactivated)
//   : Unknown.update(model, action)
//   );
//
// const close = /*::<action, model, flags>*/
//   ( update/*:Update<action, model>*/
//   , model/*:Model<model>*/
//   , action/*:action*/
//   )/*:Change<Action<action, flags>, Model<model>>*/  => {
//     const [content, fx] = update(model.content, action)
//     const change =
//       [ merge
//         ( model
//         , { content
//           , isClosed: Neither
//           }
//         )
//       , fx.map(Tag.closed)
//       ]
//     return change
//   }

// export const open = /*::<action, model, flags>*/
//   ( init/*:Init<model, action, flags>*/
//   , options/*:Flags<flags>*/
//   )/*:Change<action, model, flags>*/ => {
//     const [content, fx] = init(options.flags);
//     const model =
//       { id: options.id
//       , content
//       , isSelected: options.isSelected
//       , isActive: options.isActive
//       }
//
//     return [model, fx.map(Tag.opened)];
//   }
//
// export const advance = /*::<model, action, command, flags>*/
//   ( tag/*:Lift<action, Action<action, command, flags>>*/
//   , advance/*:Advance<model, action>*/
//   , model/*:Model<model>*/
//   )/*:Step<model, action, command, flags>*/ => {
//     const [ content, fx ] = advance(model.content);
//     return [ merge(model, {content}), fx.map(tag) ];
//   }
//
// export const close = /*::<model, action, command, flags>*/
//   ( closeContent/*:Advance<model, action>*/
//   , model/*:Model<model>*/
//   )/*:Step<model, action, command, flags>*/ =>
//   advance
//   ( Tag.closed
//   , closeContent
//   , model
//   )
//
// export const select = /*::<model, action, command, flags>*/
//   ( selectContent/*:Advance<model, action>*/
//   , model/*:Model<model>*/
//   )/*:Step<model, action, command, flags>*/ =>
//   advance
//   ( Tag.selected
//   , selectContent
//   , model
//   )
//
// export const deselect = /*::<model, action, command, flags>*/
//   ( deselectContent/*:Advance<model, action>*/
//   , model/*:Model<model>*/
//   )/*:Step<model, action, command, flags>*/ =>
//   advance
//   ( Tag.deselected
//   , deselectContent
//   , model
//   )
//
// export const activate = /*::<model, action, command, flags>*/
//   ( activateContent/*:Advance<model, action>*/
//   , model/*:Model<model>*/
//   )/*:Step<model, action, command, flags>*/ =>
//   advance
//   ( Tag.activated
//   , activateContent
//   , model
//   )
//
// export const deactivate = /*::<model, action, command, flags>*/
//   ( deactivateContent/*:Advance<model, action>*/
//   , model/*:Model<model>*/
//   )/*:Step<model, action, command, flags>*/ =>
//   advance
//   ( Tag.deactivated
//   , deactivateContent
//   , model
//   )
