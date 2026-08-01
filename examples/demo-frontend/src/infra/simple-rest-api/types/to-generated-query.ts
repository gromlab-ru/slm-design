import type {
  SimpleOrdersListParams,
  SimpleProductsListParams
} from '../generated'
import type { SimpleOrdersQuery, SimpleProductsQuery } from './simple-api-query.type'

/**
 * Адаптирует корректные числовые query-поля к неточному generated OpenAPI-типу.
 *
 * Nest Swagger описал преобразуемые number-поля как object; runtime-контракт остаётся числовым.
 */
export const toGeneratedProductsQuery = (query: SimpleProductsQuery): SimpleProductsListParams => {
  return query as unknown as SimpleProductsListParams
}

/**
 * Адаптирует pagination к неточному generated OpenAPI-типу заказов.
 */
export const toGeneratedOrdersQuery = (query: SimpleOrdersQuery): SimpleOrdersListParams => {
  return query as unknown as SimpleOrdersListParams
}
