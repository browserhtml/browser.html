/* @flow */

import {Task} from 'reflex'

export type Model =
  { name: string,
   value: string
  }

export type Action =
  | Action

const state =
  { nextRef: 0
  }

export const create =
  ():Model =>
  ({ name: 'data-ref',
     value: `ref-${++state.nextRef}`
    }
  )

export const deref =
  (ref:Model):Task<Error, HTMLElement> =>
  new Task((succeed, fail) => {
    const element = document.querySelector(`[${ref.name}='${ref.value}']`)
    void
      (element == null
      ? fail(Error(`Could not find element by [${ref.name}='${ref.value}'], make sure to include {[ref.name]: ref.value} in a virtual node`))
      : succeed(element)
      )
  }
  )
