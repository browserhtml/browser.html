/* @flow */

import {Effects, Task} from "reflex"
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

export class IO /*::<a>*/ extends Effects/*::<a>*/ {
  /*::
  queue: Array<Task<Never, a>>;
  */
  constructor(queue/*:Array<Task<Never, a>>*/) {
    super(never)
    this.queue = queue
  }
  map/*::<b>*/(f/*:(a:a)=>b*/)/*:IO<b>*/ {
    return new IO(this.queue.map(task => task.map(f)))
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
  toJSON() {
    return { queue: [] }
  }
}

export const Model = IO

export const init = /*::<a>*/
  (tasks/*:Array<Task<Never, a>>*/=[])/*:IO<a>*/ =>
  new IO(tasks)

export const perform = /*::<a>*/
  (io/*:IO<a>*/, task/*:Task<Never, a>*/)/*:IO<a>*/ =>
  new IO(io.queue.concat(task))
