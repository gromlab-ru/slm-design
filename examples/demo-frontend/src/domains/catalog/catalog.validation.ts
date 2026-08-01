import type { CreateProductInput, UpdateProductInput } from './types/catalog-command.type'
import type { CatalogError } from './types/catalog-error.type'

export const PRODUCT_IMAGE_PLACEHOLDER = '/product-placeholder.svg'

/**
 * Проверяет, что remote image может быть безопасно отрисован Next Image.
 */
export const isSupportedProductImageUrl = (value: string): boolean => {
  if (value === PRODUCT_IMAGE_PLACEHOLDER) {
    return true
  }

  try {
    const url = new URL(value)

    return url.protocol === 'https:' && url.hostname === 'picsum.photos'
  } catch {
    return false
  }
}

/**
 * Нормализует внешний image URL к гарантированно отображаемому product source.
 */
export const normalizeProductImageUrl = (value: string): string => {
  return isSupportedProductImageUrl(value) ? value : PRODUCT_IMAGE_PLACEHOLDER
}

/**
 * Проверяет frontend product contract до необратимой backend mutation.
 */
export const validateProductInput = (
  input: CreateProductInput | UpdateProductInput
): CatalogError | null => {
  if (
    input.imageUrl !== undefined &&
    (
      input.imageUrl === PRODUCT_IMAGE_PLACEHOLDER ||
      !isSupportedProductImageUrl(input.imageUrl)
    )
  ) {
    return {
      code: 'validation',
      message: 'Use an HTTPS image hosted on picsum.photos.'
    }
  }

  return null
}
