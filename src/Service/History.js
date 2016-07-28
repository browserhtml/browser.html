/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task} from "reflex"
import {ok, error} from "../common/result"
import * as History from "../browser/Navigators/Navigator/Assistant/History"
import type {Result} from "../common/result"

export const decode =
  (content:string):Result<Error, History.Model> => {
    try {
      const data = JSON.parse(content)
      return ok(new History.Model(data.url, data.title))
    }
    catch (failure) {
      return error(failure)
    }
  }

export const encode =
  (place:History.Model):Result<Error, string> => {
    try {
      return ok(JSON.stringify(place))
    }
    catch (failure) {
      return error(failure)
    }
  }

const pendingRequests = Object.create(null);

const noMatches = Object.freeze([])

export const query =
  (query:string):Task<Error, Array<History.Model>> =>
  new Task((succeed, fail) => {
    pendingRequests[query] = true
  })
  .chain(_ => Task.sleep(0))
  .chain(_ => new Task((succeed, fail) => {
    if (pendingRequests[query] != null) {
      delete pendingRequests[query]
      try {
        const places = []
        const count = window.localStorage.length
        let index  = 0
        while (index < count) {
          const key = window.localStorage.key(index)
          index = index + 1

          if (key.startsWith('place:')) {
            const result = decode(window.localStorage.get(key))
            if (result.isOk) {
              const place = result.value
              if (place.title.includes(query)) {
                places.push(place)
              }
              else if (place.url.includes(query)) {
                places.push(place)
              }
            }
          }
        }

        if (places.length === 0) {
          succeed(noMatches)
        }
        else {
          succeed(places)
        }
      }
      catch (error) {
        fail(error)
      }
    }
  }))

export const abort = <never>
  (query:string):Task<Error, never> =>
  new Task((succeed, fail) => {
    const request = pendingRequests[query]
    if (request != null) {
      delete pendingRequests[query]
    }
  })
