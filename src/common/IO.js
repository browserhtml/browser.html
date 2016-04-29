/* @flow */

import {Effects, Task, forward} from "reflex"
import {remove} from "./prelude"

/*::
import type {Never, Address} from "reflex"
*/

const raise =
  error => {
    throw Error(`Task performed with IO should never fail but it did with error ${error}`)
  }
const None = Effects.none.constructor
const never/*:Task<Never, any>*/ = new Task((succeed, fail) => void(0))


class IO /*::<a>*/ extends Effects /*::<a>*/ {
  /*::
  queue: Array<Task<Never, a>>;
  tag: ?<b> (input:b) => a;
  */
  constructor(queue/*:Array<Task<Never, a>>*/) {
    super(never)
    this.queue = queue
  }
  map/*::<b>*/(f/*:(a:a)=>b*/)/*:Effects<b>*/ {
    return new Lift(this, f)
  }
  send(address/*:Address<a>*/)/*:Task<Never, void>*/ {
    return new Task((succeed, fail) => {
      const queue = this.queue.splice(0)
      const count = queue.length
      let index = 0
      while (index < count) {
        const task = queue[index]
        Task.fork(task, address, raise)
        index = index + 1
      }
      succeed(void(0))
    })
  }
  perform(task/*:Task<Never, a>*/)/*:IO<a>*/ {
    return new IO(this.queue.concat(task))
  }
  toJSON()/*:{}*/ {
    return { queue: [] }
  }
}


export class Lift /*::<a, b>*/ extends Effects/*::<b>*/ {
  /*::
  source: Effects<a>;
  f: (input:a) => b;
  */
  constructor(source/*:Effects<a>*/, f/*:(input:a) => b*/) {
    super(never)
    this.source = source
    this.f = f
  }
  map/*::<c>*/(f/*:(a:b)=>c*/)/*:Effects<c>*/ {
    return new Lift(this, f)
  }
  send(address/*:Address<b>*/)/*:Task<Never, void>*/ {
    return this.source.send(forward(address, this.f))
  }
}

export const Model = IO

export const init = /*::<a>*/
  (tasks/*:Array<Task<Never, a>>*/=[])/*:IO<a>*/ =>
  new IO(tasks)

export const perform = /*::<a>*/
  (io/*:IO<a>*/, task/*:Task<Never, a>*/)/*:IO<a>*/ =>
  new IO(io.queue.concat(task))
