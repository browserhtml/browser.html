/* @flow */

import {Task} from "reflex"


export class Model {
  name: string;
  value: string;
  static nextID: number;
  constructor(value/*:string*/) {
    this.name = 'data-ref'
    this.value = value
  }
}
Model.nextID = 0

export const init =
  () =>
  new Model(`ref-${++Model.nextID}`)

export const deref =
  (ref/*:Model*/)/*:Task<Error, HTMLElement>*/ =>
  new Task
  ( (succeed, fail) => {
      const element = document.querySelector(`[${ref.name}='${ref.value}']`);
      void
      ( element == null
      ? fail(Error(`Could not find element by [${ref.name}='${ref.value}'], make sure to include {[ref.name]: ref.value} in a virtual node`))
      : succeed(element)
      );
    }
  );
