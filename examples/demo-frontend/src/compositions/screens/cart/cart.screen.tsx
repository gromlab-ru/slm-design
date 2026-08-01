'use client'

import type { ChangeEvent, FocusEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import cl from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/domains/auth'
import { getCartProductQuantityLimit, useCart } from '@/domains/cart'
import { PRODUCT_IMAGE_PLACEHOLDER, useCatalogCommands } from '@/domains/catalog'
import { useOrderCommands, validateOrderDraft } from '@/domains/orders'
import type { OrderDraftLine } from '@/domains/orders'
import { formatMoney } from '@/shared/lib/format-money'
import { isEmptyArray, isNonEmptyArray } from '@/shared/lib/value-predicates'
import { Button } from '@/ui/button'
import { FeedbackPanel } from '@/ui/feedback-panel'

import type { CartScreenProps } from './types/cart-screen-props.type'
import styles from './styles/cart.module.css'

/**
 * Multi-domain cart and checkout composition.
 *
 * Используется для:
 *  - координации cart, auth и orders без междоменного цикла
 *  - отображения stock и checkout errors
 */
export const CartScreen = (props: CartScreenProps) => {
  const { className, ...rootAttrs } = props
  const cart = useCart()
  const auth = useAuth()
  const catalogCommands = useCatalogCommands()
  const orderCommands = useOrderCommands()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [quantityDraftsById, setQuantityDraftsById] = useState<Record<string, string>>({})
  const isMountedRef = useRef(false)
  const checkoutAttemptRef = useRef(0)
  const hasLines = isNonEmptyArray(cart.lines)
  const orderDraft: OrderDraftLine[] = cart.lines.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
    availableStock: line.product.stock,
    currency: line.product.currency,
    expectedVersion: line.product.version,
    expectedUnitPriceCents: line.product.priceCents
  }))
  const draftError = validateOrderDraft(orderDraft)
  const canCheckout = draftError === null
  const totalLabel = cart.currency === null
    ? 'Mixed currencies'
    : formatMoney(cart.subtotalCents, cart.currency)
  const checkoutLabel = auth.status === 'authenticated'
    ? 'Place order'
    : auth.status === 'unavailable'
      ? 'Retry session first'
      : 'Sign in to checkout'

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      checkoutAttemptRef.current += 1
    }
  }, [])

  /**
   * Сохраняет локальный quantity draft до commit на blur.
   */
  const handleQuantityChange = (
    event: ChangeEvent<HTMLInputElement>,
    productId: string
  ): void => {
    const value = event.currentTarget.value

    setQuantityDraftsById((currentDrafts) => ({
      ...currentDrafts,
      [productId]: value
    }))
  }

  /**
   * Применяет завершённое редактирование quantity без удаления на пустом draft.
   */
  const handleQuantityCommit = (
    event: FocusEvent<HTMLInputElement>,
    productId: string
  ): void => {
    const value = event.currentTarget.value.trim()

    if (value === '') {
      setQuantityDraftsById((currentDrafts) => {
        const nextDrafts = { ...currentDrafts }

        delete nextDrafts[productId]

        return nextDrafts
      })
      return
    }

    const quantity = Number(value)

    if (Number.isFinite(quantity)) {
      void cart.setQuantity(productId, quantity)
    }

    setQuantityDraftsById((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }

      delete nextDrafts[productId]

      return nextDrafts
    })
  }

  /**
   * Проверяет lifecycle текущей checkout-попытки после async boundary.
   */
  const isCheckoutAttemptActive = (attemptId: number): boolean => {
    return isMountedRef.current && checkoutAttemptRef.current === attemptId
  }

  /**
   * Создаёт order из cart snapshot или направляет гостя к auth route.
   */
  const handleCheckout = async (): Promise<void> => {
    if (auth.status === 'unavailable') {
      const result = await auth.refreshCurrentUser()

      if (!result.isSuccess) {
        setCheckoutError(result.error.message)
      }
      return
    }

    if (auth.status !== 'authenticated') {
      router.push('/sign-in')
      return
    }

    const sessionKey = auth.sessionKey

    if (sessionKey === null || isSubmitting) {
      return
    }

    const cartRevision = cart.revision
    const attemptId = checkoutAttemptRef.current + 1

    checkoutAttemptRef.current = attemptId

    setIsSubmitting(true)
    setCheckoutError(null)

    const productsResult = await catalogCommands.loadProducts(
      orderDraft.map((line) => line.productId)
    )

    if (!isCheckoutAttemptActive(attemptId)) {
      return
    }

    if (!productsResult.isSuccess) {
      setIsSubmitting(false)
      setCheckoutError(productsResult.error.message)
      return
    }

    if (!auth.isCurrentSession(sessionKey)) {
      setIsSubmitting(false)
      setCheckoutError('The active session changed. Start checkout again.')
      return
    }

    const reconciliationStatus = await cart.reconcileProducts(
      productsResult.data,
      cartRevision
    )

    if (!isCheckoutAttemptActive(attemptId)) {
      return
    }

    if (reconciliationStatus === 'stale') {
      setIsSubmitting(false)
      setCheckoutError('The cart changed during checkout. Review it and try again.')
      return
    }

    if (reconciliationStatus === 'unavailable') {
      setIsSubmitting(false)
      setCheckoutError('Cart storage is unavailable. Checkout was not started.')
      return
    }

    if (reconciliationStatus === 'updated') {
      setIsSubmitting(false)
      setCheckoutError('Inventory changed. Review the refreshed totals before checkout.')
      return
    }

    const cartRevisionStatus = await cart.isCurrentRevision(cartRevision)

    if (!isCheckoutAttemptActive(attemptId)) {
      return
    }

    if (cartRevisionStatus === 'unavailable') {
      setIsSubmitting(false)
      setCheckoutError('Cart storage is unavailable. Checkout was not started.')
      return
    }

    if (cartRevisionStatus === 'stale' || !auth.isCurrentSession(sessionKey)) {
      setIsSubmitting(false)
      setCheckoutError('The checkout scope changed. Review the cart and try again.')
      return
    }

    const result = await orderCommands.createOrder(orderDraft, sessionKey)

    if (result.isSuccess) {
      const clearStatus = await cart.clearCart(cartRevision)

      if (!isCheckoutAttemptActive(attemptId)) {
        return
      }

      setIsSubmitting(false)

      if (clearStatus === 'unavailable') {
        setCheckoutError('The order was created, but cart storage could not be updated.')
        return
      }

      if (clearStatus === 'stale') {
        setCheckoutError('The order was created, but the cart changed in another tab.')
        return
      }

      if (auth.isCurrentSession(sessionKey)) {
        router.push('/orders')
      }
      return
    }

    if (!isCheckoutAttemptActive(attemptId)) {
      return
    }

    setIsSubmitting(false)
    setCheckoutError(result.error.message)
  }

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Cart / composition-owned checkout</p>
          <h1>Selected objects</h1>
        </div>
        <span className={styles.count}>{cart.itemCount} units</span>
      </header>

      {isEmptyArray(cart.lines) && cart.isHydrated && (
        <FeedbackPanel
          variant="empty"
          title="Nothing crosses this boundary yet"
          description="Add an object from the catalog. The cart snapshot stays owned by its domain and persists locally."
        >
          <Link className={styles.catalogLink} href="/">
            Open catalog
          </Link>
        </FeedbackPanel>
      )}

      {hasLines && (
        <div className={styles.layout}>
          <section className={styles.lines} aria-label="Cart products">
            {cart.lines.map((line) => (
              <article key={line.product.id} className={styles.line}>
                <Link
                  className={styles.imageWrap}
                  href={`/products/${line.product.id}`}
                  aria-label={`Open ${line.product.name}`}
                >
                  <Image
                    className={styles.image}
                    src={line.product.imageUrl}
                    alt=""
                    fill
                    sizes="150px"
                    onError={(event) => {
                      event.currentTarget.srcset = ''
                      event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER
                    }}
                  />
                </Link>
                <div className={styles.lineInfo}>
                  <span>{line.product.categoryId.replace('category-', '')}</span>
                  <Link href={`/products/${line.product.id}`}>
                    <h2>{line.product.name}</h2>
                  </Link>
                  <strong>{formatMoney(line.product.priceCents, line.product.currency)}</strong>
                </div>
                <label className={styles.quantity}>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min={0}
                    max={getCartProductQuantityLimit(line.product)}
                    step={1}
                    value={quantityDraftsById[line.product.id] ?? String(line.quantity)}
                    disabled={isSubmitting}
                    onChange={(event) => handleQuantityChange(event, line.product.id)}
                    onBlur={(event) => handleQuantityCommit(event, line.product.id)}
                  />
                </label>
                <Button
                  variant="danger"
                  size="small"
                  disabled={isSubmitting}
                  onClick={() => void cart.removeProduct(line.product.id)}
                >
                  Remove
                </Button>
              </article>
            ))}
          </section>

          <aside className={styles.summary}>
            <p className={styles.sequence}>03 / CHECKOUT</p>
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>Units</dt>
                <dd>{cart.itemCount}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>{totalLabel}</dd>
              </div>
              <div>
                <dt>Session</dt>
                <dd>{auth.status}</dd>
              </div>
            </dl>

            {draftError && (
              <p className={styles.warning} role="status">
                {draftError.message}
              </p>
            )}

            {checkoutError && <p className={styles.error} role="alert">{checkoutError}</p>}

            <Button
              isLoading={isSubmitting}
              disabled={!canCheckout || isSubmitting}
              onClick={handleCheckout}
            >
              {checkoutLabel}
            </Button>
          </aside>
        </div>
      )}
    </main>
  )
}
