/* @flow */

type Get <from, to> =
  (target:from) => to

type Set <from, to> =
  (target:from, value:to) => from

export type {Lens}

class Lens <from, to> {
  get: Get<from, to>;
  set: Set<from, to>;
  constructor(get:Get<from, to>, set:Set<from, to>) {
    this.get = get
    this.set = set
  }
  view(target:from):to {
    return this.get(target)
  }
  swap <context> (f:(value:to, context:context) => to, target:from, context:context):from {
    return this.set(target, f(this.get(target), context))
  }
}

export const lens = <from, to>
  ( get:Get<from, to>
  , set:Set<from, to>
  ):Lens<from, to> =>
  new Lens(get, set)

export const view = <from, to>
  ( lens:Lens<from, to>
  , target:from
  ):to =>
  lens.get(target)

export const swap = <from, to, context>
  ( lens:Lens<from, to>
  , f:(value:to, context:context) => to
  , target:from
  , context:context
  ):from =>
  lens.set(target, f(lens.get(target), context))
