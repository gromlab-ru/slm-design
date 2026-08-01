'use client'

import cl from 'clsx'
import Image from 'next/image'
import Link from 'next/link'

import { useCart } from '@/domains/cart'
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/domains/catalog'
import { formatMoney } from '@/shared/lib/format-money'
import { Button } from '@/ui/button'

import type { ProductCardProps } from './types/product-card-props.type'
import styles from './styles/product-card.module.css'

/**
 * Карточка продукта для grid-выдачи catalog screen.
 *
 * Используется для:
 *  - перехода к detail route
 *  - добавления доступного продукта в application cart
 */
export const ProductCard = (props: ProductCardProps) => {
  const { product, index, className, ...rootAttrs } = props
  const cart = useCart()
  const isSoldOut = product.stock === 0
  const stockLabel = isSoldOut ? 'Out of stock' : `${product.stock} ready`

  /**
   * Добавляет продукт в cart domain без transport-зависимости компонента.
   */
  const handleAdd = (): void => {
    void cart.addProduct(product)
  }

  return (
    <article {...rootAttrs} className={cl(styles.root, className)}>
      <Link
        className={styles.imageLink}
        href={`/products/${product.id}`}
        aria-label={`Open ${product.name}`}
      >
        <Image
          className={styles.image}
          src={product.imageUrl}
          alt=""
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
          onError={(event) => {
            event.currentTarget.srcset = ''
            event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER
          }}
        />
        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
      </Link>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span>{stockLabel}</span>
          <span>{product.rating.toFixed(1)} / 5</span>
        </div>
        <Link href={`/products/${product.id}`}>
          <h2 className={styles.name}>{product.name}</h2>
        </Link>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.footer}>
          <strong className={styles.price}>{formatMoney(product.priceCents, product.currency)}</strong>
          <Button size="small" disabled={isSoldOut} onClick={handleAdd}>
            Add
          </Button>
        </div>
      </div>
    </article>
  )
}
