import { HttpClient } from '@biocad/{{name.kebabCase}}-rest-api-sdk'

import {
  {{name.screamingSnakeCase}}_REST_API_BASE_URL,
  {{name.screamingSnakeCase}}_REST_API_TIMEOUT_MS
} from './config/{{name.kebabCase}}-rest-api.config'
import { {{name.camelCase}}RestApiFetch } from './lib/{{name.kebabCase}}-rest-api-fetch'

/** Транспортный HTTP-клиент {{name.pascalCase}} REST API. */
export const {{name.camelCase}}HttpClient = new HttpClient({
  baseUrl: {{name.screamingSnakeCase}}_REST_API_BASE_URL,
  customFetch: {{name.camelCase}}RestApiFetch,
  timeout: {{name.screamingSnakeCase}}_REST_API_TIMEOUT_MS
})
