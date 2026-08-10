import cl from 'clsx'

import { formatCurrency } from 'shared/lib/format'
import { isEmptyArray, isNonEmptyArray } from 'shared/lib/value-predicates'
import { Button } from 'ui/button'
import { useOrders } from '../../hooks/use-orders.hook'
import type { CartPanelProps } from './types/cart-panel-props.type'
import styles from './styles/cart-panel.module.css'

/**
 * Панель draft order с количеством и checkout.
 *
 * Используется для:
 *  - проверки выбранных product snapshots перед отправкой
 *  - запуска единственного checkout-сценария домена orders
 */
export const CartPanel = (props: CartPanelProps) => {
  const { className, ...rootAttrs } = props
  const {
    items,
    itemCount,
    totalCents,
    notice,
    createdOrder,
    isCheckingOut,
    setQuantity,
    removeProduct,
    clearDraft,
    checkout
  } = useOrders()

  return (
    <aside {...rootAttrs} className={cl(styles.root, className)}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Draft order</span>
          <h2>Корзина</h2>
        </div>
        <span className={styles.count}>{itemCount}</span>
      </div>

      {isEmptyArray(items) && !createdOrder && (
        <div className={styles.empty}>
          <span className={styles.emptyMark}>+</span>
          <p>Выберите продукты в каталоге. Версия и цена сохранятся до checkout.</p>
        </div>
      )}

      {isNonEmptyArray(items) && (
        <div className={styles.items}>
          {items.map((item) => (
            <article key={item.productId} className={styles.item}>
              <img src={item.imageUrl} alt="" />
              <div className={styles.itemInfo}>
                <strong>{item.productName}</strong>
                <span>
                  {formatCurrency(item.unitPriceCents, item.currency)} · v{item.expectedVersion}
                </span>
              </div>
              <div className={styles.quantity}>
                <button
                  type="button"
                  aria-label={`Уменьшить количество ${item.productName}`}
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Увеличить количество ${item.productName}`}
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeProduct(item.productId)}
              >
                Удалить
              </button>
            </article>
          ))}
        </div>
      )}

      {notice && (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      )}

      {createdOrder && (
        <div className={styles.success} role="status">
          <span>Заказ создан</span>
          <strong>{createdOrder.id}</strong>
          <small>{formatCurrency(createdOrder.totalCents, createdOrder.currency)}</small>
        </div>
      )}

      {isNonEmptyArray(items) && (
        <div className={styles.summary}>
          <div>
            <span>Итого</span>
            <strong>{formatCurrency(totalCents, 'USD')}</strong>
          </div>
          <Button isLoading={isCheckingOut} onClick={() => void checkout()}>
            Оформить заказ
          </Button>
          <Button variant="ghost" size="small" onClick={clearDraft}>
            Очистить
          </Button>
        </div>
      )}
    </aside>
  )
}
