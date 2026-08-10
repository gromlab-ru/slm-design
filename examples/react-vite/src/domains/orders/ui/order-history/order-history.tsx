import { useState } from 'react'
import cl from 'clsx'

import { formatCurrency, formatDate } from 'shared/lib/format'
import { isEmptyArray, isNonEmptyArray } from 'shared/lib/value-predicates'
import { Button } from 'ui/button'
import { OrderError } from '../../errors/order.error'
import { useOrderHistory } from '../../hooks/use-order-history.hook'
import { cancelOrder } from '../../source/orders.source'
import type { OrderHistoryProps } from './types/order-history-props.type'
import styles from './styles/order-history.module.css'

const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  cancelled: 'Отменён'
} as const

/**
 * История доступных пользователю заказов и допустимая отмена.
 *
 * Используется для:
 *  - просмотра customer-owned или всех admin-заказов
 *  - выполнения разрешённого status transition в cancelled
 */
export const OrderHistory = (props: OrderHistoryProps) => {
  const { className, ...rootAttrs } = props
  const { page, isLoading, error, refresh } = useOrderHistory()
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  /**
   * Отменяет заказ и повторно получает серверную историю.
   */
  const handleCancel = async (orderId: string): Promise<void> => {
    setMutationError(null)
    setCancellingOrderId(orderId)

    try {
      await cancelOrder(orderId)
      await refresh()
    } catch (cancelError) {
      const message =
        cancelError instanceof OrderError ? cancelError.message : 'Не удалось отменить заказ.'
      setMutationError(message)
    } finally {
      setCancellingOrderId(null)
    }
  }

  let content = <div className={styles.state}>Загружаем историю…</div>

  if (error) {
    content = (
      <div className={styles.state} role="alert">
        <strong>История недоступна</strong>
        <span>{error.message}</span>
        <Button variant="secondary" size="small" onClick={() => void refresh()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (!isLoading && page && isEmptyArray(page.orders)) {
    content = <div className={styles.state}>Заказов пока нет. Соберите первый draft.</div>
  }

  if (page && isNonEmptyArray(page.orders)) {
    content = (
      <div className={styles.list}>
        {page.orders.map((order) => {
          const canCancel = order.status === 'pending' || order.status === 'paid'
          const itemSummary = order.items
            .map((item) => `${item.productName} × ${item.quantity}`)
            .join(', ')

          return (
            <article key={order.id} className={styles.order}>
              <div className={styles.orderTopline}>
                <div>
                  <span className={styles.orderId}>{order.id}</span>
                  <span className={cl(styles.status, styles[order.status])}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <strong>{formatCurrency(order.totalCents, order.currency)}</strong>
              </div>
              <p>{itemSummary}</p>
              <div className={styles.orderFooter}>
                <span>{formatDate(order.createdAt)}</span>
                <span>Владелец: {order.userId}</span>
                {canCancel && (
                  <Button
                    variant="danger"
                    size="small"
                    isLoading={cancellingOrderId === order.id}
                    onClick={() => void handleCancel(order.id)}
                  >
                    Отменить
                  </Button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <section {...rootAttrs} className={cl(styles.root, className)}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Protected resource</span>
          <h2>История заказов</h2>
        </div>
        {page && <span>{page.total} записей</span>}
      </div>
      {mutationError && (
        <p className={styles.error} role="alert">
          {mutationError}
        </p>
      )}
      {content}
    </section>
  )
}
