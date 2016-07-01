/* @flow */

import {Task} from "reflex"
import * as Ref from "./Ref"

export type Model = boolean

export type Action =
  | { type: "Focus" }
  | { type: "Blur" }

export const Focus = { type: "Focus" }
export const Blur = { type: "Blur" }

export const init =
  (focused/*:boolean*/=false)/*:Model*/ =>
  focused

export const update =
  ( model/*:Model*/
  , action/*:Action*/
  )/*:Model*/ =>
  ( action.type === "Focus"
  ? true
  : action.type === "Blur"
  ? false
  : model
  )

export const focus =
  (model/*:Model*/)/*:Model*/ =>
  true;

export const blur =
  (model/*:Model*/)/*:Model*/ =>
  false;

export const focusRef =
 ( ref/*:Ref.Model*/ )/*:Task<Error, void>*/ =>
  Ref
  .deref(ref)
  .chain(focusElement)

export const blurRef =
  ( ref/*:Ref.Model*/ )/*:Task<Error, void>*/ =>
  Ref
  .deref(ref)
  .chain(blurElement)


const focusElement =
  element =>
  new Task
  ( succeed =>
    succeed(element.focus())
  );

const blurElement =
  element =>
  new Task
  ( succeed =>
    succeed(element.blur())
  );
