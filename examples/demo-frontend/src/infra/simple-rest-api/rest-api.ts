import { createApiClient, operationsTree } from './generated'
import { simpleHttpClient } from './client'

/**
 * Полный bound-клиент Simple API для submit-сценариев доменных модулей.
 */
export const simpleRestApi = createApiClient(simpleHttpClient, operationsTree)
