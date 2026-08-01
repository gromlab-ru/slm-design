import type { Metadata } from 'next'

import { OrdersScreen } from '@/compositions/screens/orders'

/**
 * Metadata protected orders route.
 */
export const metadata: Metadata = {
  title: 'Orders'
}

/**
 * Подключает protected orders composition к framework route.
 */
export default function OrdersPage() {
  return <OrdersScreen />
}
