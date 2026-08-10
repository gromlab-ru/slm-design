import { createApiClient, operationsTree } from './generated'
import { simpleHttpClient } from './transport/client'

/** Полный bound-клиент Simple REST API для private source adapters. */
export const simpleRestApi = createApiClient(simpleHttpClient, operationsTree)
