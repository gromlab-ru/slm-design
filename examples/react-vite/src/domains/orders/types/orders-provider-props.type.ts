import type { ReactNode } from 'react'

/**
 * Props владельца draft order.
 */
export type OrdersProviderProps = {
  /** Storefront scope, внутри которого живёт draft order. */
  children: ReactNode
}
