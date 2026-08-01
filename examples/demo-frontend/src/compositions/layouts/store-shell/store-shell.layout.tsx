'use client'

import cl from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/domains/auth'
import { useCart } from '@/domains/cart'
import { DemoToolbarWidget } from '@/compositions/widgets/demo-toolbar'
import { Button } from '@/ui/button'

import type { StoreShellLayoutProps } from './types/store-shell-layout-props.type'
import styles from './styles/store-shell.module.css'

/**
 * Общий каркас навигации и application-scoped controls магазина.
 *
 * Используется для:
 *  - сохранения auth/cart контекста между App Router страницами
 *  - доступа к deterministic demo controls
 */
export const StoreShellLayout = (props: StoreShellLayoutProps) => {
  const { children, className, ...rootAttrs } = props
  const pathname = usePathname()
  const auth = useAuth()
  const cart = useCart()
  const isAdmin = auth.status === 'authenticated' && auth.user?.role === 'admin'
  const hasSession = auth.sessionKey !== null
  const accountLabel = auth.user?.name ?? 'Sign in'

  /**
   * Определяет активный верхнеуровневый navigation item.
   */
  const isActivePath = (path: string): boolean => {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  const isCatalogActive = isActivePath('/')
  const isCartActive = isActivePath('/cart')
  const isOrdersActive = isActivePath('/orders')
  const isAdminActive = isActivePath('/admin')

  /**
   * Завершает текущую сессию из общего header.
   */
  const handleSignOut = (): void => {
    void auth.signOut()
  }

  /**
   * Пытается восстановить unreadable cart явным empty snapshot.
   */
  const handleCartReset = (): void => {
    void cart.clearCart()
  }

  return (
    <div {...rootAttrs} className={cl(styles.root, className)}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Layer Supply home">
          <span className={styles.brandMark}>LS</span>
          <span className={styles.brandText}>
            Layer
            <br />
            Supply
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Primary navigation">
          <Link
            className={cl(styles.navLink, isCatalogActive && styles.active)}
            href="/"
            aria-current={isCatalogActive ? 'page' : undefined}
          >
            Catalog
          </Link>
          <Link
            className={cl(styles.navLink, isCartActive && styles.active)}
            href="/cart"
            aria-current={isCartActive ? 'page' : undefined}
          >
            Cart <span className={styles.count}>{cart.itemCount}</span>
          </Link>
          <Link
            className={cl(styles.navLink, isOrdersActive && styles.active)}
            href="/orders"
            aria-current={isOrdersActive ? 'page' : undefined}
          >
            Orders
          </Link>
          {isAdmin && (
            <Link
              className={cl(styles.navLink, isAdminActive && styles.active)}
              href="/admin/products"
              aria-current={isAdminActive ? 'page' : undefined}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className={styles.account}>
          <span className={styles.accountMeta}>{auth.status}</span>
          <Link className={styles.accountLink} href="/sign-in">
            {accountLabel}
          </Link>
          {hasSession && (
            <Button variant="ghost" size="small" onClick={handleSignOut}>
              Exit
            </Button>
          )}
        </div>

        {cart.error && (
          <div className={styles.cartError} role="alert">
            <span>{cart.error.message}</span>
            <Button variant="ghost" size="small" onClick={handleCartReset}>
              Reset cart
            </Button>
          </div>
        )}
      </header>

      <div className={styles.page}>{children}</div>

      <footer className={styles.footer}>
        <span>Next.js 16 + SLM Level 1</span>
        <span>Simple API / localhost:3001</span>
      </footer>

      <DemoToolbarWidget />
    </div>
  )
}
