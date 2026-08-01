'use client'

import { useState } from 'react'
import cl from 'clsx'
import Link from 'next/link'

import { useAuth } from '@/domains/auth'
import {
  useCategories,
  useCatalogCommands,
  useProductCatalog
} from '@/domains/catalog'
import type {
  CatalogError,
  CreateProductInput,
  Product,
  UpdateProductInput
} from '@/domains/catalog'
import { useOnDemoFixtureChange } from '@/domains/demo-control'
import { formatMoney } from '@/shared/lib/format-money'
import { isNonEmptyArray } from '@/shared/lib/value-predicates'
import { Button } from '@/ui/button'
import { FeedbackPanel } from '@/ui/feedback-panel'

import { ProductForm } from './ui/product-form'
import type { ProductAdminScreenProps } from './types/product-admin-screen-props.type'
import styles from './styles/product-admin.module.css'

/**
 * Admin-only catalog mutation workspace.
 *
 * Используется для:
 *  - create/update/delete RBAC-сценариев
 *  - проверки optimistic-lock conflict outcome
 */
export const ProductAdminScreen = (props: ProductAdminScreenProps) => {
  const { className, ...rootAttrs } = props
  const auth = useAuth()
  const catalogCommands = useCatalogCommands()
  const [adminPage, setAdminPage] = useState(1)
  const catalog = useProductCatalog({
    page: adminPage,
    limit: 100,
    search: '',
    categoryId: '',
    sort: 'newest'
  })
  const categoriesState = useCategories()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formGeneration, setFormGeneration] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<CatalogError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const isAdmin = auth.status === 'authenticated' && auth.user?.role === 'admin'
  const hasProducts = isNonEmptyArray(catalog.products)
  const canGoBack = (catalog.pagination?.page ?? 1) > 1
  const canGoForward =
    catalog.pagination !== null && catalog.pagination.page < catalog.pagination.totalPages
  const isSelectedProductAvailable =
    selectedProduct !== null &&
    (
      catalog.isLoading ||
      catalog.error !== null ||
      catalog.products.some((product) => product.id === selectedProduct.id)
    )
  const formProduct = isSelectedProductAvailable ? selectedProduct : null
  const formKey = `${formProduct?.id ?? 'new'}-${formProduct?.version ?? 0}-${categoriesState.categories.length}-${formGeneration}`

  useOnDemoFixtureChange((kind) => {
    if (kind === 'data') {
      setAdminPage(1)
      setSelectedProduct(null)
      setMutationError(null)
      setFormGeneration((value) => value + 1)
    }
  })

  /**
   * Переключает product form в edit mode с последним catalog snapshot.
   */
  const handleEdit = (product: Product): void => {
    setSelectedProduct(product)
    setMutationError(null)
    setSuccessMessage(null)
  }

  /**
   * Возвращает product form в create mode.
   */
  const handleCancelEdit = (): void => {
    setSelectedProduct(null)
    setMutationError(null)
    setFormGeneration((value) => value + 1)
  }

  /**
   * Выбирает create или update domain scenario по форме input.
   */
  const handleSubmit = async (
    input: CreateProductInput | UpdateProductInput
  ): Promise<void> => {
    const sessionKey = auth.sessionKey

    if (sessionKey === null) {
      return
    }

    setIsSubmitting(true)
    setMutationError(null)
    setSuccessMessage(null)

    const result = 'id' in input
      ? await catalogCommands.updateProduct(input, sessionKey)
      : await catalogCommands.createProduct(input, sessionKey)

    setIsSubmitting(false)

    if (!result.isSuccess) {
      setMutationError(result.error)
      return
    }

    setSuccessMessage(`${result.data.name} saved at version ${result.data.version}.`)
    setSelectedProduct(null)
    setFormGeneration((value) => value + 1)
  }

  /**
   * Удаляет продукт после явного browser confirmation.
   */
  const handleRemove = async (product: Product): Promise<void> => {
    const sessionKey = auth.sessionKey

    if (sessionKey === null) {
      return
    }

    const shouldRemove = window.confirm(`Remove ${product.name}?`)

    if (!shouldRemove) {
      return
    }

    setDeletingProductId(product.id)
    setMutationError(null)
    setSuccessMessage(null)

    const result = await catalogCommands.removeProduct(product.id, sessionKey)

    setDeletingProductId(null)

    if (!result.isSuccess) {
      setMutationError(result.error)
      return
    }

    setSuccessMessage(`${product.name} removed.`)

    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null)
      setFormGeneration((value) => value + 1)
    }
  }

  /**
   * Повторяет catalog query после transport failure.
   */
  const handleReload = (): void => {
    void catalog.reload()
  }

  /**
   * Открывает предыдущую admin inventory page.
   */
  const handlePreviousPage = (): void => {
    setAdminPage((page) => Math.max(1, page - 1))
  }

  /**
   * Открывает следующую admin inventory page.
   */
  const handleNextPage = (): void => {
    setAdminPage((page) => page + 1)
  }

  /**
   * Повторяет recoverable auth check перед admin workspace.
   */
  const handleSessionRetry = (): void => {
    void auth.refreshCurrentUser()
  }

  /**
   * Загружает authority snapshot после optimistic-lock conflict.
   */
  const handleLoadLatest = async (): Promise<void> => {
    if (formProduct === null) {
      return
    }

    setIsSubmitting(true)
    const result = await catalogCommands.loadProducts([formProduct.id])
    setIsSubmitting(false)

    if (!result.isSuccess) {
      setMutationError(result.error)
      return
    }

    const latestProduct = result.data[0]

    if (latestProduct !== undefined) {
      setSelectedProduct(latestProduct)
      setMutationError(null)
      setSuccessMessage('Loaded the latest product version. Review changes before saving.')
    }
  }

  if (auth.status === 'checking') {
    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          title="Resolving admin scope"
          description="Catalog mutation UI waits for the auth owner before rendering protected controls."
        />
      </main>
    )
  }

  if (!isAdmin) {
    if (auth.status === 'unavailable') {
      return (
        <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
          <FeedbackPanel
            variant="error"
            title="Admin session is temporarily unavailable"
            description={auth.sessionError?.message ?? 'The session was preserved for retry.'}
          >
            <Button onClick={handleSessionRetry}>Retry session</Button>
          </FeedbackPanel>
        </main>
      )
    }

    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          variant="error"
          title="Admin boundary"
          description="This composition does not infer permissions from the route. It reads the role owned by auth."
        >
          <Link className={styles.primaryLink} href="/sign-in">
            Sign in as admin
          </Link>
        </FeedbackPanel>
      </main>
    )
  }

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Catalog / protected mutations</p>
          <h1>Versioned inventory</h1>
        </div>
        <p>
          Every update carries the last-read version. Use the conflict demo scenario to inspect
          the domain error without exposing transport payloads.
        </p>
      </header>

      {catalog.error && (
        <FeedbackPanel variant="error" title="Catalog query failed" description={catalog.error.message}>
          <Button onClick={handleReload}>Retry inventory</Button>
        </FeedbackPanel>
      )}

      <div className={styles.workspace}>
        <div className={styles.formColumn}>
          <ProductForm
            key={formKey}
            categories={categoriesState.categories}
            product={formProduct}
            isSubmitting={isSubmitting}
            error={mutationError?.message ?? null}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
          />
          {mutationError?.code === 'conflict' && formProduct !== null && (
            <Button variant="secondary" onClick={handleLoadLatest}>
              Load latest version
            </Button>
          )}
        </div>

        <section className={styles.inventory} aria-labelledby="inventory-title">
          <div className={styles.inventoryHeader}>
            <div>
              <span>Live snapshot</span>
              <h2 id="inventory-title">Inventory</h2>
            </div>
            <strong>{catalog.pagination?.total ?? 0} products</strong>
          </div>

          {successMessage && <p className={styles.success} role="status">{successMessage}</p>}

          {hasProducts && (
            <div className={styles.productList}>
              {catalog.products.map((product) => (
                <article key={product.id} className={styles.productRow}>
                  <div>
                    <span>v{product.version} / {product.stock} stock</span>
                    <h3>{product.name}</h3>
                    <small>{formatMoney(product.priceCents, product.currency)}</small>
                  </div>
                  <div className={styles.rowActions}>
                    <Button variant="ghost" size="small" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      isLoading={deletingProductId === product.id}
                      onClick={() => handleRemove(product)}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {catalog.pagination && (catalog.pagination.totalPages > 1 || adminPage > 1) && (
            <div className={styles.pagination}>
              <Button variant="ghost" size="small" disabled={!canGoBack} onClick={handlePreviousPage}>
                Previous 100
              </Button>
              <span>{catalog.pagination.page} / {catalog.pagination.totalPages}</span>
              <Button variant="ghost" size="small" disabled={!canGoForward} onClick={handleNextPage}>
                Next 100
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
