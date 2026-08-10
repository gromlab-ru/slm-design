/**
 * Исправленные параметры списка заказов.
 *
 * OpenAPI backend ошибочно описывает page и limit через пустой Object schema.
 */
export type GetOrdersParams = {
  /** Номер страницы, начиная с единицы. */
  page?: number
  /** Число заказов на странице. */
  limit?: number
}
