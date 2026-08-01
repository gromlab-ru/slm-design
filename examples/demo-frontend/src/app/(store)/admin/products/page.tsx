import type { Metadata } from 'next'

import { ProductAdminScreen } from '@/compositions/screens/product-admin'

/**
 * Metadata catalog administration route.
 */
export const metadata: Metadata = {
  title: 'Product admin'
}

/**
 * Подключает admin composition к framework route.
 */
export default function ProductAdminPage() {
  return <ProductAdminScreen />
}
