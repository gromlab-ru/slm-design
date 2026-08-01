import { createApiClient } from '@biocad/{{name.kebabCase}}-rest-api-sdk/create-api-client'
import { operationsTree } from '@biocad/{{name.kebabCase}}-rest-api-sdk/operations-tree'

import { {{name.camelCase}}HttpClient } from './client'

/** Полный bound-клиент {{name.pascalCase}} REST API. */
export const {{name.camelCase}}RestApi = createApiClient({{name.camelCase}}HttpClient, operationsTree)
