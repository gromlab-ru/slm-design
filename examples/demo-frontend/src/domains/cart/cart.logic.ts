import type { Product } from '@/domains/catalog'

import type { CartLine, CartReconciliation, CartTotals } from './types/cart.type'

const MAX_CART_LINE_QUANTITY = 20

/**
 * Возвращает единый cart/order limit для конкретного продукта.
 */
export const getCartProductQuantityLimit = (product: Product): number => {
  return Math.min(product.stock, MAX_CART_LINE_QUANTITY)
}

/**
 * Ограничивает cart quantity текущим stock продукта.
 */
const clampQuantity = (product: Product, quantity: number): number => {
  if (!Number.isFinite(quantity)) {
    return 0
  }

  return Math.max(0, Math.min(Math.floor(quantity), getCartProductQuantityLimit(product)))
}

/**
 * Добавляет продукт или увеличивает существующую строку корзины.
 */
export const addCartProduct = (lines: CartLine[], product: Product): CartLine[] => {
  const existingLine = lines.find((line) => line.product.id === product.id)

  if (existingLine === undefined) {
    const quantity = clampQuantity(product, 1)

    return quantity === 0 ? lines : [...lines, { product, quantity }]
  }

  return lines.map((line) => {
    if (line.product.id !== product.id) {
      return line
    }

    return {
      product,
      quantity: clampQuantity(product, line.quantity + 1)
    }
  })
}

/**
 * Устанавливает количество строки и удаляет её при нулевом результате.
 */
export const setCartProductQuantity = (
  lines: CartLine[],
  productId: string,
  quantity: number
): CartLine[] => {
  return lines.flatMap((line) => {
    if (line.product.id !== productId) {
      return [line]
    }

    const nextQuantity = clampQuantity(line.product, quantity)

    return nextQuantity === 0 ? [] : [{ ...line, quantity: nextQuantity }]
  })
}

/**
 * Удаляет одну продуктовую строку.
 */
export const removeCartProduct = (lines: CartLine[], productId: string): CartLine[] => {
  return lines.filter((line) => line.product.id !== productId)
}

/**
 * Заменяет product snapshots authority-значениями перед checkout.
 */
export const reconcileCartProducts = (
  lines: CartLine[],
  products: Product[]
): CartReconciliation => {
  const productsById = new Map(products.map((product) => [product.id, product]))
  let hasChanges = false
  const nextLines = lines
    .map((line) => {
      const currentProduct = productsById.get(line.product.id)

      if (currentProduct === undefined) {
        return line
      }

      const hasProductChanged =
        currentProduct.version !== line.product.version ||
        currentProduct.priceCents !== line.product.priceCents ||
        currentProduct.currency !== line.product.currency ||
        currentProduct.stock !== line.product.stock

      if (hasProductChanged) {
        hasChanges = true
      }

      return {
        product: currentProduct,
        quantity: clampQuantity(currentProduct, line.quantity)
      }
    })
    .filter((line) => line.quantity > 0)

  if (nextLines.length !== lines.length) {
    hasChanges = true
  }

  return { lines: nextLines, hasChanges }
}

/**
 * Рассчитывает item count, subtotal и допустимость checkout.
 */
export const calculateCartTotals = (lines: CartLine[]): CartTotals => {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0
  )
  const firstCurrency = lines[0]?.product.currency ?? null
  const hasSingleCurrency = lines.every((line) => line.product.currency === firstCurrency)

  return {
    itemCount,
    subtotalCents,
    currency: hasSingleCurrency ? firstCurrency : null
  }
}
