import { createContext } from 'react'

import type { OrdersContextValue } from '../types/orders-context-value.type'

/** React-контекст draft order в storefront scope. */
export const OrdersContext = createContext<OrdersContextValue | null>(null)
