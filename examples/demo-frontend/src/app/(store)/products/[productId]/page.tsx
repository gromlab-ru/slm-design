import type { Metadata } from 'next'

import { ProductDetailScreen } from '@/compositions/screens/product-detail'

import type { ProductPageProps } from '../../../types/product-page-props.type'

/**
 * Metadata dynamic product route без запроса к runtime fixture во время build.
 */
export const metadata: Metadata = {
  title: 'Product detail'
}

/**
 * Адаптирует async dynamic segment к product detail composition.
 */
export default async function ProductPage(props: ProductPageProps) {
  const { productId } = await props.params

  return <ProductDetailScreen productId={productId} />
}
