/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// This file just holds information about layer stacking
// via zIndex. All the zIndex's used by children of
// `Navigator` should be defined here in order to avoid
// conflicts or regressions.

export const output = 0
export const overlay = 1
export const header = 2
export const progress = 3
export const assistant = 4
export const input = 5
