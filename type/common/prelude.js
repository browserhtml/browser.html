/* @flow */

export type ID = number
export type URI = string
export type Time = number
export type Version = string

export type For <target:string, action> = {
  type: "For",
  target: target,
  action: action
}

export type Ok <value> = {
  type: "Ok",
  value: value
}

export type Error <error> = {
  type: "Error",
  error: error
}

export type Result <error, result>
  = Ok <result>
  | Error <error>
