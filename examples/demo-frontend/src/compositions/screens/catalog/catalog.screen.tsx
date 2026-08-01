'use client'

import type { ChangeEvent } from 'react'
import { useDeferredValue, useState } from 'react'
import cl from 'clsx'

import { useCategories, useProductCatalog } from '@/domains/catalog'
import type { CatalogFilters } from '@/domains/catalog'
import { useOnDemoFixtureChange } from '@/domains/demo-control'
import { isEmptyArray, isNonEmptyArray, isOneOf } from '@/shared/lib/value-predicates'
import { Button } from '@/ui/button'
import { FeedbackPanel } from '@/ui/feedback-panel'

import { ProductCard } from './ui/product-card'
import type { CatalogScreenProps } from './types/catalog-screen-props.type'
import styles from './styles/catalog.module.css'

const CATALOG_SORTS = ['newest', 'price-asc', 'price-desc', 'name'] as const
const SKELETON_IDS = ['one', 'two', 'three', 'four', 'five', 'six'] as const

/**
 * Публичная витрина с фильтрами и offset pagination.
 *
 * Используется для:
 *  - поиска и сравнения fixture-продуктов
 *  - демонстрации loading, empty и transport error outcomes
 */
export const CatalogScreen = (props: CatalogScreenProps) => {
  const { className, ...rootAttrs } = props
  const [filters, setFilters] = useState<CatalogFilters>({
    page: 1,
    limit: 12,
    search: '',
    categoryId: '',
    sort: 'newest'
  })
  const deferredSearch = useDeferredValue(filters.search)
  const catalog = useProductCatalog({ ...filters, search: deferredSearch })
  const categoriesState = useCategories()
  const hasProducts = isNonEmptyArray(catalog.products)
  const shouldShowEmpty =
    !catalog.isLoading && catalog.error === null && isEmptyArray(catalog.products)
  const resultSummary = catalog.pagination
    ? `${catalog.pagination.total} objects / page ${catalog.pagination.page}`
    : 'Connecting to inventory'
  const canGoBack = (catalog.pagination?.page ?? 1) > 1
  const canGoForward =
    catalog.pagination !== null && catalog.pagination.page < catalog.pagination.totalPages

  useOnDemoFixtureChange((kind) => {
    if (kind === 'data') {
      setFilters((current) => ({ ...current, page: 1 }))
    }
  })

  /**
   * Обновляет search-фильтр, сохраняя ввод отзывчивым через deferred value.
   */
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))
  }

  /**
   * Применяет category-фильтр и возвращает выдачу на первую страницу.
   */
  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setFilters((current) => ({ ...current, categoryId: event.target.value, page: 1 }))
  }

  /**
   * Применяет только поддерживаемую доменом сортировку.
   */
  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value

    if (isOneOf(value, CATALOG_SORTS)) {
      setFilters((current) => ({ ...current, sort: value, page: 1 }))
    }
  }

  /**
   * Загружает предыдущую страницу выдачи.
   */
  const handlePreviousPage = (): void => {
    setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))
  }

  /**
   * Загружает следующую страницу выдачи.
   */
  const handleNextPage = (): void => {
    setFilters((current) => ({ ...current, page: current.page + 1 }))
  }

  /**
   * Повторяет неуспешный catalog query.
   */
  const handleReload = (): void => {
    void catalog.reload()
  }

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      <section className={styles.hero} aria-labelledby="catalog-title">
        <p className={styles.kicker}>Deterministic objects for frontend systems</p>
        <h1 className={styles.title} id="catalog-title">
          Useful things,
          <br />
          visible boundaries.
        </h1>
        <p className={styles.lede}>
          A storefront where every loading state, cache edge, auth transition and conflict can be
          reproduced on demand.
        </p>
        <span className={styles.sequence}>01 / CATALOG</span>
      </section>

      <section
        className={styles.catalog}
        aria-label="Product catalog"
        aria-busy={catalog.isLoading || catalog.isRefreshing}
      >
        <div className={styles.filters}>
          <label className={styles.searchField}>
            <span>Search inventory</span>
            <input
              type="search"
              value={filters.search}
              placeholder="Keyboard, desk, systems..."
              onChange={handleSearchChange}
            />
          </label>

          <label className={styles.selectField}>
            <span>Category</span>
            <select value={filters.categoryId} onChange={handleCategoryChange}>
              <option value="">All categories</option>
              {categoriesState.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.productCount})
                </option>
              ))}
            </select>
          </label>

          <label className={styles.selectField}>
            <span>Order</span>
            <select value={filters.sort} onChange={handleSortChange}>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        <div className={styles.resultBar}>
          <span>{resultSummary}</span>
          {catalog.isRefreshing && <span className={styles.refreshing}>Refreshing</span>}
        </div>

        {catalog.isLoading && (
          <div
            className={styles.productGrid}
            role="status"
            aria-live="polite"
            aria-label="Loading products"
          >
            {SKELETON_IDS.map((id) => (
              <div key={id} className={styles.skeleton} />
            ))}
          </div>
        )}

        {catalog.error && (
          <FeedbackPanel
            variant="error"
            title="The catalog boundary held"
            description={catalog.error.message}
          >
            <Button onClick={handleReload}>Retry request</Button>
          </FeedbackPanel>
        )}

        {shouldShowEmpty && (
          <FeedbackPanel
            variant="empty"
            title="A valid empty state"
            description="No objects match this request. Try another filter or select the normal demo scenario."
          />
        )}

        {hasProducts && (
          <div className={styles.productGrid}>
            {catalog.products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {catalog.pagination && (catalog.pagination.totalPages > 1 || filters.page > 1) && (
          <div className={styles.pagination}>
            <Button variant="ghost" disabled={!canGoBack} onClick={handlePreviousPage}>
              Previous
            </Button>
            <span>
              {catalog.pagination.page} / {catalog.pagination.totalPages}
            </span>
            <Button variant="ghost" disabled={!canGoForward} onClick={handleNextPage}>
              Next
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
