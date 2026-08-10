import type { ReactNode } from 'react'

/**
 * Props application-scoped SessionProvider.
 */
export type SessionProviderProps = {
  /** Browser-приложение, использующее одну пользовательскую сессию. */
  children: ReactNode
  /** Сообщает app assembly, что session-scoped технические данные нужно очистить. */
  onSessionClosed?: () => void
}
