export const throwError = (s = "") => {
  throw new Error(s)
}

export const throwNotImplemented = (s: string) =>
  throwError(`Not implemented${s ? `: ${s}` : ""}`)

export const throwNotSupported = (s: string) =>
  throwError(`Operation not supported${s ? `: ${s}` : ""}`)

export const throwInvalidOperation = (s: string) =>
  throwError(`Invalid operation${s ? `: ${s}` : ""}`)

export const throwMissing = (name: string, message?: string) =>
  throwError(
    `No value is defined${
      name ? ` for "${name}"${message ? ` (${message})` : ""}` : ""
    }`
  )

export const throwArgumentError = (name: string, message?: string) =>
  throwError(
    `Invalid ${name ? `value for parameter "${name}"` : "argument value"}${
      message ? `: ${message}` : ""
    }`
  )

export const error = (s: string) => () => throwError(s)

export const notImplemented = (s: string) => () => throwNotImplemented(s)

export const notSupported = (s: string) => () => throwNotSupported(s)

export const invalidOperation = (s: string) => () => throwInvalidOperation(s)

export const missing = (name: string, message?: string) => () =>
  throwMissing(name, message)

export const argumentError = (name: string, message?: string) => () =>
  throwArgumentError(name, message)
