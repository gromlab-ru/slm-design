import type { ComponentPropsWithoutRef } from 'react'

import type {
  Category,
  CreateProductInput,
  Product,
  UpdateProductInput
} from '@/domains/catalog'

/**
 * Собственные параметры admin product form.
 */
export type ProductFormParams = {
  /** Справочник допустимых категорий. */
  categories: Category[]
  /** Редактируемый продукт или null для create mode. */
  product: Product | null
  /** Выполняется ли catalog mutation. */
  isSubmitting: boolean
  /** Ошибка последней catalog mutation. */
  error: string | null
  /** Передаёт валидный create/update input screen-владельцу. */
  onSubmit: (input: CreateProductInput | UpdateProductInput) => Promise<void>
  /** Возвращает форму в create mode. */
  onCancel: () => void
}

/**
 * Атрибуты корневой form без собственного submit callback.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'form'>, 'children' | 'onSubmit'>

/**
 * Props admin product form.
 */
export type ProductFormProps = RootAttrs & ProductFormParams
