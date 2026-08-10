import { useState } from 'react'
import { useSWRConfig } from 'swr'

import { getOrderListKey } from 'infra/simple-rest-api'
import { isEmptyArray } from 'shared/lib/value-predicates'
import { OrderError } from './errors/order.error'
import { OrdersContext } from './context/orders.context'
import { createOrder } from './source/orders.source'
import type { DraftOrderItem, DraftOrderProduct } from './types/draft-order.type'
import type { Order } from './types/order.type'
import type { OrdersProviderProps } from './types/orders-provider-props.type'

const ORDER_LIMIT_PER_PRODUCT = 20

/**
 * Владелец draft order и checkout lifecycle внутри storefront.
 *
 * Используется для:
 *  - фиксации product snapshots до подтверждения заказа
 *  - единственной координации локального draft и server mutation
 */
export const OrdersProvider = (props: OrdersProviderProps) => {
  const { children } = props
  const { mutate } = useSWRConfig()
  const [items, setItems] = useState<DraftOrderItem[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  /**
   * Добавляет USD product snapshot либо объясняет неподдерживаемый исход.
   */
  const addProduct = (product: DraftOrderProduct): void => {
    setNotice(null)
    setCreatedOrder(null)

    if (product.currency !== 'USD') {
      setNotice('Simple API оформляет только продукты в USD.')
      return
    }

    if (product.stock === 0) {
      setNotice('Товар закончился на складе.')
      return
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id)

      if (!existingItem) {
        return [
          ...currentItems,
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPriceCents: product.priceCents,
            currency: 'USD',
            expectedVersion: product.version,
            availableStock: product.stock,
            imageUrl: product.imageUrl
          }
        ]
      }

      const maxQuantity = Math.min(product.stock, ORDER_LIMIT_PER_PRODUCT)

      if (existingItem.quantity >= maxQuantity) {
        setNotice(`Для «${product.name}» достигнут доступный лимит.`)
        return currentItems
      }

      return currentItems.map((item) => {
        if (item.productId !== product.id) {
          return item
        }

        return {
          ...item,
          quantity: item.quantity + 1,
          unitPriceCents: product.priceCents,
          expectedVersion: product.version,
          availableStock: product.stock
        }
      })
    })
  }

  /**
   * Изменяет количество строки в допустимом диапазоне.
   */
  const setQuantity = (productId: string, quantity: number): void => {
    setNotice(null)
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        const maxQuantity = Math.min(item.availableStock, ORDER_LIMIT_PER_PRODUCT)
        const safeQuantity = Math.max(1, Math.min(quantity, maxQuantity))

        return { ...item, quantity: safeQuantity }
      })
    )
  }

  /**
   * Удаляет одну строку из draft order.
   */
  const removeProduct = (productId: string): void => {
    setNotice(null)
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId))
  }

  /**
   * Полностью очищает draft order и checkout feedback.
   */
  const clearDraft = (): void => {
    setItems([])
    setNotice(null)
    setCreatedOrder(null)
  }

  /**
   * Подтверждает product snapshots на backend и создаёт заказ.
   */
  const checkout = async (): Promise<void> => {
    if (isEmptyArray(items)) {
      setNotice('Добавьте хотя бы один продукт.')
      return
    }

    setNotice(null)
    setCreatedOrder(null)
    setIsCheckingOut(true)

    try {
      const order = await createOrder(items)
      setItems([])
      setCreatedOrder(order)
      await mutate(getOrderListKey({ page: 1, limit: 20 }))
    } catch (error) {
      const message = error instanceof OrderError ? error.message : 'Не удалось создать заказ.'
      setNotice(message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const totalCents = items.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0
  )

  return (
    <OrdersContext
      value={{
        items,
        itemCount,
        totalCents,
        notice,
        createdOrder,
        isCheckingOut,
        addProduct,
        setQuantity,
        removeProduct,
        clearDraft,
        checkout
      }}
    >
      {children}
    </OrdersContext>
  )
}
