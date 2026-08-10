import { useDeferredValue, useState } from 'react'
import cl from 'clsx'

import { formatCurrency } from 'shared/lib/format'
import { isEmptyArray, isNonEmptyArray } from 'shared/lib/value-predicates'
import { Button } from 'ui/button'
import { CatalogError } from '../../errors/catalog.error'
import { useCatalog } from '../../hooks/use-catalog.hook'
import {
  createCatalogProduct,
  deleteCatalogProduct,
  updateCatalogProduct
} from '../../source/catalog.source'
import type { CatalogProduct, CreateCatalogProduct } from '../../types/catalog-product.type'
import type { CatalogSort } from '../../types/catalog-filters.type'
import { ProductForm } from '../product-form/product-form'
import type { CatalogPanelProps } from './types/catalog-panel-props.type'
import styles from './styles/catalog-panel.module.css'

/**
 * Каталог продуктов с поиском, покупкой и административными mutations.
 *
 * Используется для:
 *  - выбора актуального product snapshot для draft order
 *  - управления продуктами пользователем с ролью admin
 */
export const CatalogPanel = (props: CatalogPanelProps) => {
  const { isAdmin, onAddProduct, className, ...rootAttrs } = props
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [categoryId, setCategoryId] = useState('')
  const [sort, setSort] = useState<CatalogSort>('newest')
  const [pageNumber, setPageNumber] = useState(1)
  const [editorProduct, setEditorProduct] = useState<CatalogProduct | null | undefined>(undefined)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const { page, categories, isLoading, error, refresh } = useCatalog({
    page: pageNumber,
    limit: 6,
    search: deferredSearch || undefined,
    categoryId: categoryId || undefined,
    sort
  })

  /**
   * Создаёт или обновляет продукт в зависимости от открытого editor state.
   */
  const handleProductSubmit = async (input: CreateCatalogProduct): Promise<void> => {
    setMutationError(null)
    setIsMutating(true)

    try {
      if (editorProduct) {
        await updateCatalogProduct(editorProduct.id, {
          ...input,
          version: editorProduct.version
        })
      } else {
        await createCatalogProduct(input)
      }

      setEditorProduct(undefined)
      await refresh()
    } catch (mutationFailure) {
      const message =
        mutationFailure instanceof CatalogError
          ? mutationFailure.message
          : 'Не удалось изменить продукт.'
      setMutationError(message)

      if (mutationFailure instanceof CatalogError && mutationFailure.code === 'version-conflict') {
        await refresh()
      }
    } finally {
      setIsMutating(false)
    }
  }

  /**
   * Подтверждает удаление и обновляет текущую страницу каталога.
   */
  const handleDelete = async (product: CatalogProduct): Promise<void> => {
    const shouldDelete = window.confirm(`Удалить «${product.name}» из каталога?`)

    if (!shouldDelete) {
      return
    }

    setMutationError(null)
    setIsMutating(true)

    try {
      await deleteCatalogProduct(product.id)
      await refresh()
    } catch (mutationFailure) {
      const message =
        mutationFailure instanceof CatalogError
          ? mutationFailure.message
          : 'Не удалось удалить продукт.'
      setMutationError(message)
    } finally {
      setIsMutating(false)
    }
  }

  let productsContent = (
    <div className={styles.state} aria-live="polite">
      Загружаем актуальный каталог…
    </div>
  )

  if (error) {
    productsContent = (
      <div className={styles.state} role="alert">
        <strong>Каталог недоступен</strong>
        <span>{error.message}</span>
        <Button variant="secondary" size="small" onClick={() => void refresh()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (!isLoading && page && isEmptyArray(page.products)) {
    productsContent = (
      <div className={styles.state}>
        <strong>Ничего не найдено</strong>
        <span>Измените запрос или категорию.</span>
      </div>
    )
  }

  if (page && isNonEmptyArray(page.products)) {
    productsContent = (
      <div className={styles.grid}>
        {page.products.map((product) => {
          const category = categories.find((item) => item.id === product.categoryId)
          const isOutOfStock = product.stock === 0
          const addLabel = isOutOfStock ? 'Нет в наличии' : 'В заказ'

          return (
            <article key={product.id} className={styles.card}>
              <div className={styles.imageFrame}>
                <img src={product.imageUrl} alt="" loading="lazy" />
                <span className={styles.rating}>★ {product.rating.toFixed(1)}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span>{category?.name ?? 'Без категории'}</span>
                  <span>{product.stock} шт.</span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className={styles.cardFooter}>
                  <strong>{formatCurrency(product.priceCents, product.currency)}</strong>
                  <Button
                    size="small"
                    disabled={isOutOfStock}
                    onClick={() => onAddProduct(product)}
                  >
                    {addLabel}
                  </Button>
                </div>
                {isAdmin && (
                  <div className={styles.adminActions}>
                    <Button variant="ghost" size="small" onClick={() => setEditorProduct(product)}>
                      Изменить v{product.version}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      disabled={isMutating}
                      onClick={() => void handleDelete(product)}
                    >
                      Удалить
                    </Button>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  const hasPreviousPage = Boolean(page && page.page > 1)
  const hasNextPage = Boolean(page && page.page < page.totalPages)

  return (
    <section {...rootAttrs} className={cl(styles.root, className)}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Deterministic catalog</span>
          <h2>Рабочее место с товарами</h2>
          <p>Фильтры читают Simple API, корзина фиксирует версию и цену перед checkout.</p>
        </div>
        {isAdmin && (
          <Button variant="secondary" onClick={() => setEditorProduct(null)}>
            + Новый продукт
          </Button>
        )}
      </div>

      <div className={styles.filters}>
        <label className={styles.searchField}>
          <span>Поиск</span>
          <input
            type="search"
            value={search}
            placeholder="Клавиатура, книга…"
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setPageNumber(1)
            }}
          />
        </label>
        <label className={styles.selectField}>
          <span>Категория</span>
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.currentTarget.value)
              setPageNumber(1)
            }}
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} · {category.productCount}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.selectField}>
          <span>Сортировка</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.currentTarget.value as CatalogSort)
              setPageNumber(1)
            }}
          >
            <option value="newest">Сначала новые</option>
            <option value="price-asc">Цена по возрастанию</option>
            <option value="price-desc">Цена по убыванию</option>
            <option value="name">По названию</option>
          </select>
        </label>
      </div>

      {editorProduct !== undefined && (
        <ProductForm
          key={editorProduct?.id ?? 'new-product'}
          product={editorProduct}
          categories={categories}
          errorMessage={mutationError}
          isSubmitting={isMutating}
          onCancel={() => {
            setEditorProduct(undefined)
            setMutationError(null)
          }}
          onSubmit={handleProductSubmit}
        />
      )}

      {productsContent}

      {page && page.totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="secondary"
            size="small"
            disabled={!hasPreviousPage}
            onClick={() => setPageNumber((currentPage) => currentPage - 1)}
          >
            Назад
          </Button>
          <span>
            {page.page} / {page.totalPages} · {page.total} товаров
          </span>
          <Button
            variant="secondary"
            size="small"
            disabled={!hasNextPage}
            onClick={() => setPageNumber((currentPage) => currentPage + 1)}
          >
            Далее
          </Button>
        </div>
      )}
    </section>
  )
}
