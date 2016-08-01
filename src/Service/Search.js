/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Task} from "reflex"
import {ok, error} from "../common/result"
import * as Search from "../browser/Navigators/Navigator/Assistant/Search"

const pendingRequests = Object.create(null)

export const query =
  (query:string, limit:number=100):Task<Error, Array<Search.Model>> =>
  new Task((succeed, fail) => {
    const request = new XMLHttpRequest({ mozSystem: true })
    pendingRequests[query] = request
    const url = `https://ac.duckduckgo.com/ac/?q=${query}&type=list`
    request.open('GET', url, true)
    request.responseType = 'json'

    request.onerror = event => {
      delete pendingRequests[query]
      fail(Error(`Network request to ${url} has failed: ${request.statusText}`))
    }

    request.onabort = event => {
      delete pendingRequests[query]
    }

    request.ontimeout = event => {
      delete pendingRequests[query]
      fail(Error(`Network request to ${url} timed out`))
    }

    request.onload = event => {
      delete pendingRequests[query]
      const result = decode(request, query, limit)
      if (result.isOk) {
        succeed(result.value)
      }
      else {
        fail(result.error)
      }
    }

    request.send()
  })

export const abort = <never>
  (query:string):Task<Error, never> =>
  new Task((succeed, fail) => {
    const request = pendingRequests[query]
    if (request != null) {
      request.abort()
    }
  })

const crash =
  error => {
    throw error
  }

const requestURL =
  request =>
  request.requestURL ||
  request.url ||
  crash(Error('Can not find request url'))

const fail =
  request =>
  error(Error(`Can not decode ${JSON.stringify(request.response)} from ${requestURL(request)} `))

const decode =
  ( request, query, limit ) =>
  ( request.responseType !== 'json'
  ? fail(request)
  : request.response == null
  ? fail(request)
  : request.response[1] == null
  ? fail(request)
  : decodeMatches(request.response[1], query, limit)
  )

const decodeMatches =
  ( matches, query, limit) =>
  ( Array.isArray(matches)
  ? ok(ensureIncludes(query, matches).slice(0, limit).map(decodeMatch))
  : error(Error(`Can not decode non array matches ${matches}`))
  )

const decodeMatch =
  match =>
  new Search.Model(`https://duckduckgo.com/html/?q=${encodeURIComponent(match)}`, match)

const ensureIncludes =
  (query, matches) =>
  ( ( matches.length > 0 &&
      matches[0].toLowerCase().startsWith(query.toLowerCase())
    )
  ? matches
  : ( matches.unshift(query)
    , matches
    )
  )
