'use client'

export { useCategories } from './hooks/use-categories.hook'
export { useCatalogCommands } from './hooks/use-catalog-commands.hook'
export { useProduct } from './hooks/use-product.hook'
export { useProductCatalog } from './hooks/use-product-catalog.hook'
export {
  isSupportedProductImageUrl,
  PRODUCT_IMAGE_PLACEHOLDER
} from './catalog.validation'
export type {
  CatalogCommands,
  CreateProductInput,
  RemovedProduct,
  UpdateProductInput
} from './types/catalog-command.type'
export type { CatalogError, CatalogErrorCode } from './types/catalog-error.type'
export type {
  CatalogCurrency,
  CatalogPagination,
  Category,
  Product
} from './types/catalog-model.type'
export type { CatalogFilters, CatalogSort } from './types/catalog-query.type'
export type {
  CategoriesState,
  ProductCatalogState,
  ProductState
} from './types/catalog-state.type'
