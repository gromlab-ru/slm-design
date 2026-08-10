import cl from 'clsx'

import { CatalogPanel } from 'domains/catalog'
import { CartPanel, OrderHistory, useAddProductToOrder } from 'domains/orders'
import { useSessionState } from 'domains/session'
import { AppShellLayout } from 'compositions/layouts/app-shell'
import type { StorefrontScreenProps } from './types/storefront-screen-props.type'
import styles from './styles/storefront.module.css'

/**
 * Авторизованный storefront, координирующий независимые доменные UI.
 *
 * Используется для:
 *  - передачи product snapshot из catalog в draft order
 *  - совместного отображения каталога, корзины и истории
 */
export const StorefrontScreen = (props: StorefrontScreenProps) => {
  const { className, ...rootAttrs } = props
  const { user } = useSessionState()
  const addProduct = useAddProductToOrder()
  const isAdmin = user?.role === 'admin'

  return (
    <AppShellLayout>
      <main {...rootAttrs} className={cl(styles.root, className)}>
        <section className={styles.hero}>
          <div>
            <span className={styles.kicker}>One contract · three owners</span>
            <h1>Simple Store,<br />без простой архитектуры.</h1>
          </div>
          <div className={styles.heroAside}>
            <span className={styles.pulse}><i /> API online</span>
            <p>
              JWT refresh, RBAC, pagination, stock validation и optimistic locking
              проходят через отдельные SLM boundaries.
            </p>
          </div>
        </section>

        <div id="catalog" className={styles.workspace}>
          <CatalogPanel isAdmin={isAdmin} onAddProduct={addProduct} />
          <CartPanel />
        </div>

        <OrderHistory id="orders" />
      </main>
    </AppShellLayout>
  )
}
