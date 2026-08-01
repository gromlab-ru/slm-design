'use client'

import { useSWRConfig } from 'swr'
import type { Arguments } from 'swr'

import { isArray, isString } from '@/shared/lib/value-predicates'

import type { SimpleRestApiCache } from './types/simple-rest-api-cache.type'

/**
 * Возвращает endpoint из ключа текущего REST-модуля.
 */
const getSimpleRestApiEndpoint = (key?: Arguments): string | null => {
  if (!isArray(key) || key[0] !== 'simple-rest-api' || !isString(key[1])) {
    return null
  }

  return key[1]
}

/**
 * Предоставляет resource-scoped invalidation внутри ближайшего SWR provider.
 */
export const useSimpleRestApiCache = (): SimpleRestApiCache => {
  const { mutate } = useSWRConfig()

  /**
   * Ревалидирует catalog products и category counts.
   */
  const invalidateCatalog = async (): Promise<void> => {
    await mutate(
      (key) => {
        const endpoint = getSimpleRestApiEndpoint(key)

        return endpoint?.startsWith('/api/v1/products') === true ||
          endpoint?.startsWith('/api/v1/categories') === true
      },
      undefined,
      { revalidate: true }
    )
  }

  /**
   * Ревалидирует только защищённые order resources.
   */
  const invalidateOrders = async (): Promise<void> => {
    await mutate(
      (key) => getSimpleRestApiEndpoint(key)?.startsWith('/api/v1/orders') === true,
      undefined,
      { revalidate: true }
    )
  }

  /**
   * Ревалидирует все ресурсы после смены request scenario или fixture seed.
   */
  const invalidateAll = async (): Promise<void> => {
    await mutate(
      (key) => getSimpleRestApiEndpoint(key) !== null,
      undefined,
      { revalidate: true }
    )
  }

  return { invalidateCatalog, invalidateOrders, invalidateAll }
}
