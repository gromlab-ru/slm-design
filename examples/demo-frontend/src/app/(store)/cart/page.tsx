import type { Metadata } from 'next'

import { CartScreen } from '@/compositions/screens/cart'

/**
 * Metadata cart route.
 */
export const metadata: Metadata = {
  title: 'Cart'
}

/**
 * Подключает multi-domain checkout composition к cart route.
 */
export default function CartPage() {
  return <CartScreen />
}
