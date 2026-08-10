import { useOrders } from './use-orders.hook'
import type { DraftOrderProduct } from '../types/draft-order.type'

/**
 * Возвращает минимальную capability добавления product snapshot в draft order.
 */
export const useAddProductToOrder = (): ((product: DraftOrderProduct) => void) => {
  return useOrders().addProduct
}
