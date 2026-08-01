import { createContext } from 'react'

import type { CartContextValue } from './types/cart.type'

/**
 * Внутренний React context application-scoped корзины.
 */
export const CartContext = createContext<CartContextValue | null>(null)
