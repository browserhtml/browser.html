/* @flow */

import {Effects, Task} from "reflex"
import {remove} from "./prelude"

/*::
import type {Never} from "reflex"
export type TaskID = number
export type Model = TaskID
*/

const execute =
  id =>
  dequeue(id)
  .chain(identity)

const dequeue =
  id =>
  new Task
  ( (succeed, fail) => {
      const index = state.queue.indexOf(id)
      if (index > 0) {
        const task = state.tasks[index]
        state.queue.splice(index, 1)
        state.tasks.splice(index, 1)
        succeed(task)
      }
    }
  )

const identity = x => x

export class State /*::<action>*/ {
  /*::
  nextID: TaskID;
  queue: Array<TaskID>;
  tasks: Array<Task<Never, action>>;
  */
  constructor() {
    this.nextID = 0
    this.queue = []
    this.tasks = []
  }
}


const state/*:State<any>*/ =
  ( window.$fx$task$state == null
  ? window.$fx$task$state = new State()
  : window.$fx$task$state
  )

export const init =
  ()/*:Model*/ =>
  parseFloat(`.${++state.nextID}`)

const decimal =
  float => {
    const n = `${float}`
    return parseFloat(`${n.substr(n.indexOf('.'))}`)
  }

export const perform = /*::<action>*/
  (model/*:Model*/, task/*:Task<Never, action>*/) => {
    const id = ++model
    const base = decimal(id)
    const index = state.queue.indexOf(base)
    if (index < 0) {
      state.queue.unshift(base, id, 0)
      state.tasks.unshift((null/*::,task*/), task, (null/*::,task*/))
    }
    else {
      state.queue.splice(index + 1, 0, id)
      state.tasks.splice(index + 1, 0, task)
    }
    return id
  }


export const fx = /*::<action>*/
  (model/*:Model*/)/*:Effects<action>*/ => {
    const base = decimal(model)
    let index = state.queue.indexOf(base)
    let effects = null
    if (index >= 0) {
      const count = state.queue.length
      while (index < count) {
        const id = state.queue[++index]
        if (id !== 0) {
          if (effects == null) {
            effects = [Effects.task(execute(id))]
          }
          else {
            effects.push(Effects.task(execute(id)))
          }
        }
        else {
          break
        }
      }
    }

    const fx =
      ( effects == null
      ? Effects.none
      : Effects.batch(effects)
      )

    return fx
  }
