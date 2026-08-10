import type { CatalogCategory } from '../../../types/catalog-category.type'
import type {
  CatalogProduct,
  CreateCatalogProduct
} from '../../../types/catalog-product.type'

/**
 * Props внутренней формы создания и редактирования продукта.
 */
export type ProductFormProps = {
  /** Редактируемый продукт или null для создания. */
  product: CatalogProduct | null
  /** Доступные категории каталога. */
  categories: CatalogCategory[]
  /** Ожидаемая ошибка последней mutation. */
  errorMessage: string | null
  /** Выполняется ли mutation. */
  isSubmitting: boolean
  /** Отменяет редактирование без mutation. */
  onCancel: () => void
  /** Передаёт проверенные значения владельцу mutation. */
  onSubmit: (product: CreateCatalogProduct) => Promise<void>
}
