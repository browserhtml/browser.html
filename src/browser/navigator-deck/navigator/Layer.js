/* @flow */

// This file just hold information about layer stacking
// via zIndex. All the zIndex's used by children of
// `Navigator` should be defined here in order to avoid
// conflicts or regressions

export const output = 0
export const header = 1
export const progress = 2
export const shadow = 3
export const assistant = 4
export const input = 5
export const overlay = 6
