import type { ReactNode } from 'react'

/**
 * Props application-scoped REST cache provider.
 */
export type SimpleRestApiProviderProps = {
  /** Поддерево одного auth-aware cache scope. */
  children: ReactNode
  /** Приостанавливает queries до определения auth cache scope. */
  isPaused?: boolean
}
