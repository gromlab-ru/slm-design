'use client'

import { useEffect, useRef, useState } from 'react'

import { CartContext } from './cart.context'
import {
  addCartProduct,
  calculateCartTotals,
  reconcileCartProducts,
  removeCartProduct,
  setCartProductQuantity
} from './cart.logic'
import {
  initializePersistedCartSnapshot,
  isPersistedCartRevisionCurrent,
  resetPersistedCartSnapshot,
  subscribePersistedCartSnapshot,
  updatePersistedCartSnapshot
} from './cart.persistence'
import type { PersistedCartSnapshot } from './cart.persistence'
import type { CartProviderProps } from './types/cart-provider-props.type'
import type { CartContextValue, CartLine, CartReconciliationStatus } from './types/cart.type'
import type { Product } from '@/domains/catalog'

const CART_STORAGE_ERROR = {
  code: 'storage-unavailable',
  message: 'Cart storage is unavailable. Changes are paused to prevent cross-tab data loss.'
} as const

/**
 * Владеет корзиной в application scope и сохраняет её между перезагрузками.
 *
 * Используется для:
 *  - координации каталога и checkout composition
 *  - восстановления валидного cart snapshot из browser storage
 */
export const CartProvider = (props: CartProviderProps) => {
  const { children } = props
  const [cartState, setCartState] = useState({
    lines: [] as CartLine[],
    revision: 0
  })
  const cartStateRef = useRef(cartState)
  const [isHydrated, setIsHydrated] = useState(false)
  const [error, setError] = useState<CartContextValue['error']>(null)
  const lines = cartState.lines

  /**
   * Публикует только текущий или более новый persisted cart snapshot.
   */
  const publishSnapshot = (snapshot: PersistedCartSnapshot): void => {
    if (snapshot.revision < cartStateRef.current.revision) {
      return
    }

    const nextState = {
      lines: snapshot.lines,
      revision: snapshot.revision
    }

    cartStateRef.current = nextState
    setCartState(nextState)
  }

  useEffect(() => {
    let isActive = true

    void initializePersistedCartSnapshot().then((snapshot) => {
      if (isActive) {
        if (snapshot !== null) {
          publishSnapshot(snapshot)
          setError(null)
        } else {
          setError(CART_STORAGE_ERROR)
        }

        setIsHydrated(true)
      }
    })

    const unsubscribe = subscribePersistedCartSnapshot((result) => {
      if (isActive && result.status === 'ready' && result.snapshot !== null) {
        publishSnapshot(result.snapshot)
        setError(null)
      } else if (isActive && result.status === 'unavailable') {
        setError(CART_STORAGE_ERROR)
      }
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  /**
   * Применяет cart transform к последнему cross-tab authority snapshot.
   */
  const updateLines = async (
    transform: (currentLines: CartLine[]) => CartLine[]
  ): Promise<void> => {
    const result = await updatePersistedCartSnapshot(transform)

    if (result.status === 'updated' || result.status === 'unchanged') {
      publishSnapshot(result.snapshot)
      setError(null)
    } else if (result.status === 'unavailable') {
      setError(CART_STORAGE_ERROR)
    }
  }

  /**
   * Добавляет одну доступную единицу продукта.
   */
  const addProduct = async (product: Product): Promise<void> => {
    await updateLines((currentLines) => addCartProduct(currentLines, product))
  }

  /**
   * Изменяет количество выбранного продукта.
   */
  const setQuantity = async (productId: string, quantity: number): Promise<void> => {
    await updateLines((currentLines) => {
      return setCartProductQuantity(currentLines, productId, quantity)
    })
  }

  /**
   * Удаляет продукт из корзины.
   */
  const removeProduct = async (productId: string): Promise<void> => {
    await updateLines((currentLines) => removeCartProduct(currentLines, productId))
  }

  /**
   * Обновляет stale snapshots перед checkout и сообщает о расхождении.
   */
  const reconcileProducts = (
    products: Product[],
    expectedRevision: number
  ): Promise<CartReconciliationStatus> => {
    return updatePersistedCartSnapshot((currentLines) => {
      const reconciliation = reconcileCartProducts(currentLines, products)

      return reconciliation.hasChanges ? reconciliation.lines : null
    }, expectedRevision).then((result) => {
      if (result.status === 'unavailable') {
        setError(CART_STORAGE_ERROR)
        return 'unavailable'
      }

      if (result.status === 'stale') {
        return 'stale'
      }

      publishSnapshot(result.snapshot)
      setError(null)

      return result.status === 'updated' ? 'updated' : 'unchanged'
    })
  }

  /**
   * Проверяет revision перед необратимым продолжением async checkout.
   */
  const isCurrentRevision: CartContextValue['isCurrentRevision'] = (revision) => {
    return isPersistedCartRevisionCurrent(revision).then((status) => {
      if (status === 'unavailable') {
        setError(CART_STORAGE_ERROR)
      }

      return status
    })
  }

  /**
   * Завершает checkout очисткой всех строк.
   */
  const clearCart: CartContextValue['clearCart'] = async (expectedRevision) => {
    const result = await updatePersistedCartSnapshot(() => [], expectedRevision)

    if (result.status === 'unavailable') {
      if (expectedRevision === undefined) {
        const recoveredSnapshot = await resetPersistedCartSnapshot(
          cartStateRef.current.revision
        )

        if (recoveredSnapshot !== null) {
          publishSnapshot(recoveredSnapshot)
          setError(null)
          return 'cleared'
        }
      }

      setError(CART_STORAGE_ERROR)
      return 'unavailable'
    }

    if (result.status === 'stale') {
      return 'stale'
    }

    publishSnapshot(result.snapshot)
    setError(null)

    return 'cleared'
  }

  const totals = calculateCartTotals(lines)
  const value: CartContextValue = {
    ...totals,
    lines,
    isHydrated,
    revision: cartState.revision,
    error,
    addProduct,
    setQuantity,
    removeProduct,
    reconcileProducts,
    isCurrentRevision,
    clearCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
