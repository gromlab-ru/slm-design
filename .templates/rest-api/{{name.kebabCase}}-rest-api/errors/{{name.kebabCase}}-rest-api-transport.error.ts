/**
 * Причина сбоя непосредственно на transport-границе {{name.pascalCase}} REST API.
 */
export type {{name.pascalCase}}RestApiTransportErrorCode = 'NETWORK_UNAVAILABLE' | 'REQUEST_TIMEOUT'

/**
 * Маркирует fetch failure, не смешивая его с TypeError из прикладного кода.
 */
export class {{name.pascalCase}}RestApiTransportError extends Error {
  readonly code: {{name.pascalCase}}RestApiTransportErrorCode
  readonly cause: unknown

  constructor(code: {{name.pascalCase}}RestApiTransportErrorCode, cause: unknown) {
    super(code)

    this.name = '{{name.pascalCase}}RestApiTransportError'
    this.code = code
    this.cause = cause
  }
}
