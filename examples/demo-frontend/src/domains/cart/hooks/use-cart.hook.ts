'use client'

import { useContext } from 'react'

import { CartContext } from '../cart.context'
import type { CartContextValue } from '../types/cart.type'

/**
 * Возвращает application-scoped API корзины.
 */
export const useCart = (): CartContextValue => {
  const context = useContext(CartContext)

  if (context === null) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
