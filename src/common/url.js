/* @noflow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const URL = window.URL;
export const URLSearchParams = window.URLSearchParams;
export const nullURL =
  { href: ''
  , origin: ''
  , protocol: ''
  , username: ''
  , password: ''
  , host: ''
  , hostname: ''
  , port: ''
  , pathname: ''
  , search: ''
  , hash: ''
  , searchParams:
    ( window.URLSearchParams != null
    ? new window.URLSearchParams()
    : { append() { throw Error('Not Implemented') }
      , delete() { throw Error('Not Implemented') }
      , get() { return void(0) }
      , getAll() { return [] }
      , has() { return false }
      , set() { throw Error('Not Implemented') }
      , ['@@iterator']() { return [].values() }
      , [Symbol.iterator]() { return [].values() }
      }
    )
}
