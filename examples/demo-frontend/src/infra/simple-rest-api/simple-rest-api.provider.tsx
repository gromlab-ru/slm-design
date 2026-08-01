'use client'

import { useState } from 'react'
import { SWRConfig } from 'swr'
import type { Cache } from 'swr'

import type { SimpleRestApiProviderProps } from './types/simple-rest-api-provider-props.type'

/**
 * Владеет отдельным SWR cache на одну application auth scope.
 *
 * Используется для:
 *  - изоляции protected DTO между logical sessions
 *  - единой lifecycle-aware query policy REST-модуля
 */
export const SimpleRestApiProvider = (props: SimpleRestApiProviderProps) => {
  const { children, isPaused = false } = props
  const [cache] = useState<Cache<unknown>>(() => new Map())

  return (
    <SWRConfig
      value={{
        provider: () => cache,
        dedupingInterval: 2_000,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        isPaused: () => isPaused
      }}
    >
      {children}
    </SWRConfig>
  )
}
