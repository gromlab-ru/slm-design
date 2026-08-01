'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import cl from 'clsx'

import type { CatalogCurrency, CreateProductInput, UpdateProductInput } from '@/domains/catalog'
import { isOneOf } from '@/shared/lib/value-predicates'
import { Button } from '@/ui/button'
import { FormField } from '@/ui/form-field'

import type { ProductFormProps } from './types/product-form-props.type'
import styles from './styles/product-form.module.css'

const CURRENCIES = ['USD', 'EUR'] as const

/**
 * Локальное редактируемое состояние admin-формы.
 */
type ProductFormValues = {
  /** Название продукта. */
  name: string
  /** Полное описание. */
  description: string
  /** Цена в cents как form string. */
  priceCents: string
  /** Валюта. */
  currency: CatalogCurrency
  /** Выбранная категория. */
  categoryId: string
  /** Stock как form string. */
  stock: string
  /** URL удалённого изображения. */
  imageUrl: string
}

/**
 * Создаёт initial form state из create mode или catalog snapshot.
 */
const createInitialValues = (props: ProductFormProps): ProductFormValues => {
  const { product, categories } = props

  if (product !== null) {
    return {
      name: product.name,
      description: product.description,
      priceCents: String(product.priceCents),
      currency: product.currency,
      categoryId: product.categoryId,
      stock: String(product.stock),
      imageUrl: product.imageUrl
    }
  }

  return {
    name: '',
    description: '',
    priceCents: '9900',
    currency: 'USD',
    categoryId: categories[0]?.id ?? '',
    stock: '10',
    imageUrl: 'https://picsum.photos/seed/new-object/640/480'
  }
}

/**
 * Форма create/update с сохранением optimistic-lock версии продукта.
 *
 * Используется для:
 *  - создания fixture-продукта
 *  - редактирования последнего catalog snapshot
 */
export const ProductForm = (props: ProductFormProps) => {
  const {
    categories,
    product,
    isSubmitting,
    error,
    onSubmit,
    onCancel,
    className,
    ...rootAttrs
  } = props
  const [values, setValues] = useState<ProductFormValues>(() => createInitialValues(props))
  const isEditMode = product !== null
  const title = isEditMode ? `Edit ${product.name}` : 'Create object'
  const submitLabel = isEditMode ? 'Save version' : 'Create product'

  /**
   * Обновляет текстовое поле формы по имени control.
   */
  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const field = event.target.name
    const value = event.target.value

    if (field === 'name' || field === 'description' || field === 'imageUrl') {
      setValues((current) => ({ ...current, [field]: value }))
    }
  }

  /**
   * Обновляет числовое поле, сохраняя browser form representation.
   */
  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const field = event.target.name
    const value = event.target.value

    if (field === 'priceCents' || field === 'stock') {
      setValues((current) => ({ ...current, [field]: value }))
    }
  }

  /**
   * Обновляет выбранную category.
   */
  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setValues((current) => ({ ...current, categoryId: event.target.value }))
  }

  /**
  * Обновляет только поддерживаемую backend currency.
  */
  const handleCurrencyChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value

    if (isOneOf(value, CURRENCIES)) {
      setValues((current) => ({ ...current, currency: value }))
    }
  }

  /**
   * Передаёт нормализованный domain input screen-владельцу.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const baseInput: CreateProductInput = {
      name: values.name.trim(),
      description: values.description.trim(),
      priceCents: Number(values.priceCents),
      currency: values.currency,
      categoryId: values.categoryId,
      stock: Number(values.stock),
      imageUrl: values.imageUrl.trim()
    }

    if (product !== null) {
      const updateInput: UpdateProductInput = {
        ...baseInput,
        id: product.id,
        version: product.version
      }

      await onSubmit(updateInput)
      return
    }

    await onSubmit(baseInput)
  }

  return (
    <form {...rootAttrs} className={cl(styles.root, className)} onSubmit={handleSubmit}>
      <div className={styles.heading}>
        <div>
          <span>{isEditMode ? `Version ${product.version}` : 'New catalog entry'}</span>
          <h2>{title}</h2>
        </div>
        {isEditMode && (
          <Button variant="ghost" size="small" onClick={onCancel}>
            Cancel edit
          </Button>
        )}
      </div>

      <FormField label="Name" htmlFor="product-name">
        <input
          id="product-name"
          name="name"
          value={values.name}
          minLength={2}
          maxLength={120}
          required
          onChange={handleTextChange}
        />
      </FormField>

      <FormField label="Description" htmlFor="product-description">
        <textarea
          id="product-description"
          name="description"
          value={values.description}
          minLength={10}
          maxLength={1000}
          required
          onChange={handleTextChange}
        />
      </FormField>

      <div className={styles.columns}>
        <FormField label="Price, cents" htmlFor="product-price">
          <input
            id="product-price"
            name="priceCents"
            type="number"
            min={0}
            value={values.priceCents}
            required
            onChange={handleNumberChange}
          />
        </FormField>

        <FormField label="Currency" htmlFor="product-currency">
          <select id="product-currency" value={values.currency} onChange={handleCurrencyChange}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </FormField>
      </div>

      <div className={styles.columns}>
        <FormField label="Category" htmlFor="product-category">
          <select
            id="product-category"
            value={values.categoryId}
            required
            onChange={handleCategoryChange}
          >
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Stock" htmlFor="product-stock">
          <input
            id="product-stock"
            name="stock"
            type="number"
            min={0}
            value={values.stock}
            required
            onChange={handleNumberChange}
          />
        </FormField>
      </div>

      <FormField label="Image URL" htmlFor="product-image" hint="Allowed demo host: picsum.photos">
        <input
          id="product-image"
          name="imageUrl"
          type="url"
          value={values.imageUrl}
          required
          onChange={handleTextChange}
        />
      </FormField>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <Button type="submit" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
