import cl from 'clsx'

import { SessionBadge } from 'domains/session'
import type { AppShellLayoutProps } from './types/app-shell-layout-props.type'
import styles from './styles/app-shell.module.css'

/**
 * Общий каркас авторизованного storefront.
 *
 * Используется для:
 *  - единой навигации между каталогом и историей заказов
 *  - отображения публичного session UI в header
 */
export const AppShellLayout = (props: AppShellLayoutProps) => {
  const { children, className, ...rootAttrs } = props

  return (
    <div {...rootAttrs} className={cl(styles.root, className)}>
      <header className={styles.header}>
        <a className={styles.brand} href="#catalog" aria-label="SLM Store, к каталогу">
          <span className={styles.brandMark}>S</span>
          <span>
            <strong>SLM Store</strong>
            <small>simple contract</small>
          </span>
        </a>
        <nav className={styles.nav} aria-label="Основная навигация">
          <a href="#catalog">Каталог</a>
          <a href="#orders">Заказы</a>
        </nav>
        <SessionBadge />
      </header>
      <div className={styles.content}>{children}</div>
      <footer className={styles.footer}>
        <span>React + Vite</span>
        <span>Scoped Layered Module Design</span>
        <span>Simple API · :3001</span>
      </footer>
    </div>
  )
}
