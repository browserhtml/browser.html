// https://fetch.spec.whatwg.org
// Different number and string type aliases are defined to follow IDL
// definitions more closely.

type USVString = string
type ByteString = string
type DOMString = string
type Short = number

type HeadersInit
  = {[key:ByteString]: ByteString|number}
  | Headers

declare class Headers {
  constructor(init:HeadersInit):void,
  append(name:ByteString, value:ByteString):void,
  delete(name:ByteString):void,
  get(name:ByteString):?ByteString,
  getAll(name:ByteString):Array<ByteString>,
  has(name:ByteString):boolean,
  set(name:ByteString, value:ByteString):void,
  '@@iterator'(): Iterator<[ByteString, ByteString]>
}

type FormDataEntryValue
  = Blob
  | USVString

declare class FormData {
  constructor(form?:HTMLFormElement):void,
  append(name:USVString, value:FormDataEntryValue):void,
  delete(name:USVString):void,
  get(name:USVString):?FormDataEntryValue,
  getAll(name:USVString):Array<FormDataEntryValue>,
  has(name:USVString):boolean,
  set(name:USVString, value:FormDataEntryValue):void,
  '@@iterator'(): Iterator<[USVString, FormDataEntryValue]>
}

type JSONData
  = string
  | number
  | void
  | Array<JSONData>
  | {[key:string]: JSONData}

declare class Body {
  bodyUsed: boolean,
  arrayBuffer(): Promise<ArrayBuffer>,
  blob(): Promise<Blob>,
  formData(): Promise<FormData>,
  json(): Promise<JSONData>,
  text(): Promise<USVString>
}

type RequestInfo
  = USVString
  | Request

type BodyInit
  = Blob
  | FormData
  | USVString

type ReferrerPolicy
  = ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin-only"
  | "origin-when-cross-origin"
  | "unsafe-url"

type RequestMode
  = "navigate"
  | "same-origin"
  | "no-cors"
  | "cors"

type RequestCredentials
  = "omit"
  | "same-origin"
  | "include"

type RequestCache
  = "default"
  | "no-store"
  | "reload"
  | "no-cache"
  | "force-cache"

type RequestRedirect
  = "follow"
  | "error"
  | "manual"

type RequestInit = {
  method?: ByteString,
  headers?: HeadersInit,
  body?: BodyInit,
  referrer?: USVString,
  referrerPolicy?: ReferrerPolicy,
  mode?: RequestMode,
  credentials?: RequestCredentials,
  cache?: RequestCache,
  redirect?: RequestRedirect,
  integrity?: DOMString,
  window?: any
}

type RequestType
  = ""
  | "audio"
  | "font"
  | "image"
  | "script"
  | "style"
  | "track"
  | "video"

type RequestDestination
  = ""
  | "document"
  | "sharedworker"
  | "subresource"
  | "unknown"
  | "worker"

declare class Request {
  constructor(input:RequestInfo, init?:RequestInit):void,
  method: ByteString,
  url: USVString,
  headers: Headers,
  type: RequestType,
  destination: RequestDestination,
  referrer: USVString,
  referrerPolicy: ReferrerPolicy,
  mode: RequestMode,
  credentials: RequestCredentials,
  cache: RequestCache,
  redirect: RequestRedirect,
  integrity: DOMString,
  clone(): Request
}

type ResponseInit = {
  status: Short,
  statusText: string,
  headers: HeadersInit
}

type ResponseType
  = "basic"
  | "cors"
  | "default"
  | "error"
  | "opaque"
  | "opaqueredirect"

declare class Response extends Body {
  constructor(body?:BodyInit, init?:ResponseInit):void,
  type: ResponseType,
  url: USVString,
  status: Short,
  ok: boolean,
  statusText: ByteString,
  headers: Headers,
  // TODO: Add this once ReadableStream spec is out.
  // body: ReadableStream,
  clone():Response
}

declare function fetch(input:RequestInfo, init?:RequestInit):Promise<Response>
