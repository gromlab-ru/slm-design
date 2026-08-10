import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from 'ui/button'
import { Field } from 'ui/field'
import type { CatalogCurrency } from '../../types/catalog-product.type'
import type { ProductFormProps } from './types/product-form-props.type'
import styles from './styles/product-form.module.css'

/**
 * Внутренняя форма административного product mutation.
 *
 * Используется для:
 *  - создания продукта в выбранной категории
 *  - редактирования последней прочитанной версии продукта
 */
export const ProductForm = (props: ProductFormProps) => {
  const { product, categories, errorMessage, isSubmitting, onCancel, onSubmit } = props
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.priceCents / 100) : '')
  const [currency, setCurrency] = useState<CatalogCurrency>(product?.currency ?? 'USD')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '')
  const [stock, setStock] = useState(product ? String(product.stock) : '')
  const [imageUrl, setImageUrl] = useState(
    product?.imageUrl ?? 'https://picsum.photos/seed/new-product/640/480'
  )

  /**
   * Нормализует значения HTML-формы в product contract.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      priceCents: Math.round(Number(price) * 100),
      currency,
      categoryId,
      stock: Number(stock),
      imageUrl: imageUrl.trim()
    })
  }

  const title = product ? `Редактирование · v${product.version}` : 'Новый продукт'
  const submitLabel = product ? 'Сохранить версию' : 'Добавить продукт'

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <div className={styles.editorHeader}>
        <div>
          <span className={styles.eyebrow}>Admin workspace</span>
          <h3>{title}</h3>
        </div>
        <Button variant="ghost" size="small" onClick={onCancel}>
          Закрыть
        </Button>
      </div>

      <div className={styles.editorGrid}>
        <Field
          label="Название"
          inputProps={{
            value: name,
            minLength: 2,
            maxLength: 120,
            onChange: (event) => setName(event.currentTarget.value),
            required: true
          }}
        />
        <Field
          label="Цена"
          inputProps={{
            value: price,
            type: 'number',
            min: 0,
            step: '0.01',
            onChange: (event) => setPrice(event.currentTarget.value),
            required: true
          }}
        />
        <label className={styles.selectField}>
          <span>Валюта</span>
          <select value={currency} onChange={(event) => setCurrency(event.currentTarget.value as CatalogCurrency)}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span>Категория</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.currentTarget.value)} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Остаток"
          inputProps={{
            value: stock,
            type: 'number',
            min: 0,
            step: 1,
            onChange: (event) => setStock(event.currentTarget.value),
            required: true
          }}
        />
        <Field
          label="Изображение"
          inputProps={{
            value: imageUrl,
            type: 'url',
            pattern: 'https://picsum\\.photos/.*',
            onChange: (event) => setImageUrl(event.currentTarget.value),
            required: true
          }}
        />
      </div>

      <label className={styles.textareaField}>
        <span>Описание</span>
        <textarea
          value={description}
          minLength={10}
          maxLength={1000}
          rows={3}
          onChange={(event) => setDescription(event.currentTarget.value)}
          required
        />
      </label>

      {errorMessage && (
        <p className={styles.formError} role="alert">
          {errorMessage}
        </p>
      )}

      <div className={styles.editorActions}>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
