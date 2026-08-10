import { toSimpleRestApiError } from 'infra/simple-rest-api'
import { OrderError } from '../errors/order.error'

/**
 * Преобразует REST failure в ожидаемый исход домена заказов.
 */
export const mapOrderError = (error: unknown): OrderError => {
  if (error instanceof OrderError) {
    return error
  }

  const apiError = toSimpleRestApiError(error)

  if (apiError.code === 'PRODUCT_CHANGED') {
    return new OrderError('product-changed', 'Цена или версия продукта изменилась. Обновите каталог и корзину.')
  }

  if (apiError.code === 'INSUFFICIENT_STOCK') {
    return new OrderError('insufficient-stock', 'Товара уже недостаточно на складе.')
  }

  if (apiError.code === 'UNSUPPORTED_ORDER_CURRENCY') {
    return new OrderError('unsupported-currency', 'Checkout Simple API принимает только продукты в USD.')
  }

  if (apiError.code === 'ORDER_CANNOT_BE_CANCELLED') {
    return new OrderError('cannot-cancel', 'Заказ в этом статусе уже нельзя отменить.')
  }

  if (apiError.status === 404) {
    return new OrderError('not-found', 'Заказ или продукт больше не существует.')
  }

  if (apiError.status === 400 || apiError.status === 422) {
    return new OrderError('invalid-order', 'Состав заказа не соответствует правилам checkout.')
  }

  if (apiError.status === 429) {
    return new OrderError('rate-limited', 'Simple API ограничил частоту запросов.')
  }

  return new OrderError('unavailable', 'Не удалось выполнить операцию с заказом.')
}
