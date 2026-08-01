'use client'

import { useState } from 'react'
import cl from 'clsx'
import Link from 'next/link'

import { useAuth } from '@/domains/auth'
import { canCancelOrder, useOrderCommands, useOrders } from '@/domains/orders'
import type { OrderError } from '@/domains/orders'
import { formatDate } from '@/shared/lib/format-date'
import { formatMoney } from '@/shared/lib/format-money'
import { isEmptyArray, isNonEmptyArray } from '@/shared/lib/value-predicates'
import { Button } from '@/ui/button'
import { FeedbackPanel } from '@/ui/feedback-panel'

import type { OrdersScreenProps } from './types/orders-screen-props.type'
import styles from './styles/orders.module.css'

/**
 * Protected история заказов с допустимыми state transitions.
 *
 * Используется для:
 *  - проверки auth-aware deferred query
 *  - демонстрации успешной и конфликтной отмены заказа
 */
export const OrdersScreen = (props: OrdersScreenProps) => {
  const { className, ...rootAttrs } = props
  const auth = useAuth()
  const isAuthenticated = auth.status === 'authenticated'
  const ordersState = useOrders(isAuthenticated)
  const orderCommands = useOrderCommands()
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<OrderError | null>(null)
  const hasOrders = isNonEmptyArray(ordersState.orders)

  /**
   * Повторяет неуспешный protected orders query.
   */
  const handleReload = (): void => {
    void ordersState.reload()
  }

  /**
   * Повторяет recoverable auth check перед protected query.
   */
  const handleSessionRetry = (): void => {
    void auth.refreshCurrentUser()
  }

  /**
   * Запрашивает допустимый переход заказа в cancelled.
   */
  const handleCancel = async (orderId: string): Promise<void> => {
    const sessionKey = auth.sessionKey

    if (sessionKey === null) {
      return
    }

    setCancellingOrderId(orderId)
    setActionError(null)

    const result = await orderCommands.cancelOrder(orderId, sessionKey)

    setCancellingOrderId(null)

    if (!result.isSuccess) {
      setActionError(result.error)
    }
  }

  if (auth.status === 'checking') {
    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          title="Restoring protected scope"
          description="The orders query stays disabled until auth resolves its application-scoped session."
        />
      </main>
    )
  }

  if (!isAuthenticated) {
    if (auth.status === 'unavailable') {
      return (
        <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
          <FeedbackPanel
            variant="error"
            title="Session authority is unavailable"
            description={auth.sessionError?.message ?? 'The session was preserved for retry.'}
          >
            <Button onClick={handleSessionRetry}>Retry session</Button>
          </FeedbackPanel>
        </main>
      )
    }

    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          variant="empty"
          title="This route needs a session"
          description="Sign in as customer to see own orders, or as admin to see every fixture order."
        >
          <Link className={styles.primaryLink} href="/sign-in">
            Choose account
          </Link>
        </FeedbackPanel>
      </main>
    )
  }

  return (
    <main
      {...rootAttrs}
      className={cl(styles.root, className)}
      aria-busy={ordersState.isLoading}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Orders / {auth.user?.role}</p>
          <h1>State in motion</h1>
        </div>
        <p className={styles.lede}>
          Backend transitions remain authoritative. The UI only offers cancellation where the
          current domain model allows it.
        </p>
      </header>

      {ordersState.isLoading && (
        <div
          className={styles.loading}
          role="status"
          aria-live="polite"
          aria-label="Loading orders"
        />
      )}

      {ordersState.error && (
        <FeedbackPanel
          variant="error"
          title="Orders stayed inside their boundary"
          description={ordersState.error.message}
        >
          <Button onClick={handleReload}>Retry orders</Button>
        </FeedbackPanel>
      )}

      {actionError && <p className={styles.actionError} role="alert">{actionError.message}</p>}

      {isEmptyArray(ordersState.orders) && !ordersState.isLoading && ordersState.error === null && (
        <FeedbackPanel
          variant="empty"
          title="No visible orders"
          description="Create one from the cart or switch the demo scenario back to normal."
        >
          <Link className={styles.primaryLink} href="/">
            Browse catalog
          </Link>
        </FeedbackPanel>
      )}

      {hasOrders && (
        <section className={styles.orders} aria-label="Order history">
          {ordersState.orders.map((order, index) => {
            const canCancel = canCancelOrder(order)
            const isCancelling = cancellingOrderId === order.id

            return (
              <article key={order.id} className={styles.order}>
                <div className={styles.orderIndex}>{String(index + 1).padStart(2, '0')}</div>
                <div className={styles.orderHeader}>
                  <div>
                    <span>{formatDate(order.createdAt)}</span>
                    <h2>{order.id}</h2>
                  </div>
                  <span className={styles.status} data-status={order.status}>
                    {order.status}
                  </span>
                </div>

                <div className={styles.lines}>
                  {order.lines.map((line) => (
                    <div key={line.productId} className={styles.line}>
                      <span>{line.quantity} x</span>
                      <strong>{line.productName}</strong>
                      <span>{formatMoney(line.unitPriceCents, order.currency)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.orderFooter}>
                  <strong>{formatMoney(order.totalCents, order.currency)}</strong>
                  {canCancel && (
                    <Button
                      variant="danger"
                      size="small"
                      isLoading={isCancelling}
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancel order
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
