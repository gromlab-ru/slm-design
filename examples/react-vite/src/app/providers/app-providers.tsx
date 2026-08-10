import { useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { SessionProvider } from 'domains/session'

/**
 * Props глобальной provider-композиции browser-приложения.
 */
export type AppProvidersProps = {
  /** Browser-приложение внутри общего cache и session scope. */
  children: ReactNode
}

/**
 * Собирает технические providers application scope.
 *
 * Используется для:
 *  - одного SWR cache на browser-приложение
 *  - одного session lifecycle и history router
 */
export const AppProviders = (props: AppProvidersProps) => {
  const { children } = props
  const [swrCache] = useState(() => new Map())

  /**
   * Удаляет server state предыдущего пользователя при закрытии сессии.
   */
  const handleSessionClosed = (): void => {
    swrCache.clear()
  }

  return (
    <SWRConfig
      value={{
        provider: () => swrCache,
        revalidateOnFocus: false,
        shouldRetryOnError: false
      }}
    >
      <SessionProvider onSessionClosed={handleSessionClosed}>
        <BrowserRouter>{children}</BrowserRouter>
      </SessionProvider>
    </SWRConfig>
  )
}
