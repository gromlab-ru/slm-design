import { Navigate, Route, Routes } from 'react-router-dom'

import { SignInScreen } from 'compositions/screens/sign-in'
import { StorefrontScreen } from 'compositions/screens/storefront'
import { OrdersProvider } from 'domains/orders'
import { useSessionState } from 'domains/session'
import styles from './styles/app.module.css'

/**
 * Browser entry, выбирающий экран по session lifecycle.
 *
 * Используется для:
 *  - защиты storefront route пользовательской сессией
 *  - завершения bootstrap до первого route render
 */
export const App = () => {
  const { status } = useSessionState()

  if (status === 'restoring') {
    return (
      <main className={styles.loader} aria-live="polite">
        <span className={styles.loaderMark}>S</span>
        <strong>Восстанавливаем сессию</strong>
        <small>Simple API · JWT rotation</small>
      </main>
    )
  }

  const isAuthenticated = status === 'authenticated'
  const signInElement = isAuthenticated ? <Navigate to="/" replace /> : <SignInScreen />
  const storefrontElement = isAuthenticated ? (
    <OrdersProvider>
      <StorefrontScreen />
    </OrdersProvider>
  ) : (
    <Navigate to="/login" replace />
  )

  return (
    <Routes>
      <Route path="/login" element={signInElement} />
      <Route path="/" element={storefrontElement} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  )
}
