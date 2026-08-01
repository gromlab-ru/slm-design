'use client'

import cl from 'clsx'
import Image from 'next/image'
import Link from 'next/link'

import { PRODUCT_IMAGE_PLACEHOLDER, useProduct } from '@/domains/catalog'
import { useCart } from '@/domains/cart'
import { formatMoney } from '@/shared/lib/format-money'
import { Button } from '@/ui/button'
import { FeedbackPanel } from '@/ui/feedback-panel'

import type { ProductDetailScreenProps } from './types/product-detail-screen-props.type'
import styles from './styles/product-detail.module.css'

/**
 * Детальная карточка выбранного catalog-продукта.
 *
 * Используется для:
 *  - проверки dynamic route и detail query
 *  - добавления продукта в application cart
 */
export const ProductDetailScreen = (props: ProductDetailScreenProps) => {
  const { productId, className, ...rootAttrs } = props
  const productState = useProduct(productId)
  const cart = useCart()

  /**
   * Повторяет неуспешный product detail query.
   */
  const handleReload = (): void => {
    void productState.reload()
  }

  if (productState.isLoading) {
    return (
      <main {...rootAttrs} className={cl(styles.root, className)} aria-busy>
        <div
          className={styles.loading}
          role="status"
          aria-live="polite"
          aria-label="Loading product"
        />
      </main>
    )
  }

  if (productState.error !== null || productState.product === null) {
    const message = productState.error?.message ?? 'The product returned no usable data.'

    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel variant="error" title="Product boundary stopped here" description={message}>
          <Button onClick={handleReload}>Retry detail</Button>
          <Link className={styles.textLink} href="/">
            Back to catalog
          </Link>
        </FeedbackPanel>
      </main>
    )
  }

  const product = productState.product
  const isSoldOut = product.stock === 0
  const stockLabel = isSoldOut ? 'Unavailable' : `${product.stock} units in deterministic stock`

  /**
   * Добавляет текущий detail-продукт в cart domain.
   */
  const handleAdd = (): void => {
    void cart.addProduct(product)
  }

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      <Link className={styles.back} href="/">
        Back / catalog
      </Link>

      <article className={styles.product}>
        <div className={styles.visual}>
          <Image
            className={styles.image}
            src={product.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 820px) 100vw, 55vw"
            onError={(event) => {
              event.currentTarget.srcset = ''
              event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER
            }}
          />
          <span className={styles.version}>v{product.version}</span>
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>Object / {product.categoryId.replace('category-', '')}</p>
          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.description}>{product.description}</p>

          <dl className={styles.facts}>
            <div>
              <dt>Rating</dt>
              <dd>{product.rating.toFixed(1)} / 5</dd>
            </div>
            <div>
              <dt>Stock</dt>
              <dd>{stockLabel}</dd>
            </div>
            <div>
              <dt>Lock</dt>
              <dd>Version {product.version}</dd>
            </div>
          </dl>

          <div className={styles.purchase}>
            <strong>{formatMoney(product.priceCents, product.currency)}</strong>
            <Button disabled={isSoldOut} onClick={handleAdd}>
              Add to cart
            </Button>
          </div>
        </div>
      </article>
    </main>
  )
}
