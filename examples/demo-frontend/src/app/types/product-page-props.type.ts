/**
 * Props dynamic product route в Next.js 16.
 */
export type ProductPageProps = {
  /** Асинхронные параметры dynamic segment. */
  params: Promise<{
    /** Идентификатор продукта из URL. */
    productId: string
  }>
}
