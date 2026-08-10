import { toSimpleRestApiError } from 'infra/simple-rest-api'
import { CatalogError } from '../errors/catalog.error'

/**
 * Преобразует REST failure в ожидаемый исход каталога.
 */
export const mapCatalogError = (error: unknown): CatalogError => {
  if (error instanceof CatalogError) {
    return error
  }

  const apiError = toSimpleRestApiError(error)

  if (apiError.status === 403) {
    return new CatalogError('forbidden', 'Управление каталогом доступно только администратору.')
  }

  if (apiError.status === 404) {
    return new CatalogError('not-found', 'Продукт больше не существует.')
  }

  if (apiError.code === 'PRODUCT_VERSION_CONFLICT') {
    return new CatalogError(
      'version-conflict',
      'Продукт уже изменён. Каталог обновлён, повторите редактирование.'
    )
  }

  if (apiError.status === 400 || apiError.status === 422) {
    return new CatalogError('invalid-input', 'Проверьте поля продукта и выбранную категорию.')
  }

  if (apiError.status === 429) {
    return new CatalogError('rate-limited', 'Simple API ограничил частоту запросов.')
  }

  return new CatalogError('unavailable', 'Не удалось получить каталог из Simple API.')
}
