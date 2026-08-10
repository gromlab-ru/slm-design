import type { ComponentPropsWithoutRef } from 'react'

import type { CatalogProduct } from '../../../types/catalog-product.type'

/**
 * Собственные параметры CatalogPanel.
 */
export type CatalogPanelParams = {
  /** Разрешает административные mutations каталога. */
  isAdmin: boolean
  /** Передаёт выбранный продукт владельцу draft order. */
  onAddProduct: (product: CatalogProduct) => void
}

/** Атрибуты корневой section без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'section'>, 'children'>

/** Props интерактивной панели каталога. */
export type CatalogPanelProps = RootAttrs & CatalogPanelParams
