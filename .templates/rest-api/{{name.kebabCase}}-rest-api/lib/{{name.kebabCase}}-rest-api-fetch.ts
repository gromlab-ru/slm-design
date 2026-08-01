import { {{name.pascalCase}}RestApiTransportError } from '../errors'

/**
 * Выполняет fetch с явной классификацией transport failure.
 */
export const {{name.camelCase}}RestApiFetch: typeof fetch = async (...params) => {
  try {
    return await fetch(...params)
  } catch (error) {
    const code = error instanceof DOMException && error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'NETWORK_UNAVAILABLE'

    throw new {{name.pascalCase}}RestApiTransportError(code, error)
  }
}
