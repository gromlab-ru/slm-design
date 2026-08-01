'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import cl from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { AUTH_DEMO_ACCOUNTS, useAuth } from '@/domains/auth'
import type { AuthError, DemoAccount, SignInCredentials } from '@/domains/auth'
import { Button } from '@/ui/button'
import { FeedbackPanel } from '@/ui/feedback-panel'
import { FormField } from '@/ui/form-field'

import type { SignInScreenProps } from './types/sign-in-screen-props.type'
import styles from './styles/sign-in.module.css'

/**
 * Auth route с двумя воспроизводимыми fixture-ролями.
 *
 * Используется для:
 *  - запуска JWT login/refresh lifecycle
 *  - переключения customer и admin RBAC outcomes
 */
export const SignInScreen = (props: SignInScreenProps) => {
  const { className, ...rootAttrs } = props
  const auth = useAuth()
  const router = useRouter()
  const [credentials, setCredentials] = useState<SignInCredentials>({
    email: AUTH_DEMO_ACCOUNTS[0].email,
    password: AUTH_DEMO_ACCOUNTS[0].password
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  /**
   * Подставляет выбранную deterministic account в форму.
   */
  const handleAccountSelect = (account: DemoAccount): void => {
    setCredentials({ email: account.email, password: account.password })
    setError(null)
  }

  /**
   * Обновляет email login-формы.
   */
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setCredentials((current) => ({ ...current, email: event.target.value }))
  }

  /**
   * Обновляет password login-формы.
   */
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setCredentials((current) => ({ ...current, password: event.target.value }))
  }

  /**
   * Выполняет auth-domain login и переводит пользователя в каталог.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await auth.signIn(credentials)

    setIsSubmitting(false)

    if (result.isSuccess) {
      router.push('/')
      return
    }

    setError(result.error)
  }

  /**
   * Повторяет recoverable проверку сохранённой session.
   */
  const handleSessionRetry = (): void => {
    void auth.refreshCurrentUser()
  }

  /**
   * Явно завершает сохранённую session после recoverable failure.
   */
  const handleSignOut = (): void => {
    void auth.signOut()
  }

  if (auth.status === 'checking') {
    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          title="Restoring session"
          description="The auth owner is validating persisted JWT data before exposing a route outcome."
        />
      </main>
    )
  }

  if (auth.status === 'authenticated' && auth.user !== null) {
    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          variant="success"
          title={`Signed in as ${auth.user.name}`}
          description={`The active ${auth.user.role} session is available to every composition through the auth public API.`}
        >
          <div className={styles.outcomeActions}>
            <Link className={styles.primaryLink} href="/">
              Browse catalog
            </Link>
            <Link className={styles.textLink} href="/orders">
              Open orders
            </Link>
          </div>
        </FeedbackPanel>
      </main>
    )
  }

  if (auth.status === 'unavailable') {
    return (
      <main {...rootAttrs} className={cl(styles.root, styles.outcome, className)}>
        <FeedbackPanel
          variant="error"
          title="Session check is temporarily unavailable"
          description={auth.sessionError?.message ?? 'The saved session was kept for a safe retry.'}
        >
          <div className={styles.outcomeActions}>
            <Button onClick={handleSessionRetry}>Retry session</Button>
            <Button variant="ghost" onClick={handleSignOut}>End session</Button>
          </div>
        </FeedbackPanel>
      </main>
    )
  }

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      <section className={styles.intro}>
        <p className={styles.kicker}>Auth / JWT transport</p>
        <h1 className={styles.title}>Choose a boundary to cross.</h1>
        <p className={styles.description}>
          Both accounts use the same password, but their domain permissions produce different
          navigation, mutations and order visibility.
        </p>

        <div className={styles.accounts}>
          {AUTH_DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className={styles.accountCard}
              onClick={() => handleAccountSelect(account)}
            >
              <span>{account.role}</span>
              <strong>{account.email}</strong>
              <small>{account.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.formPanel} aria-labelledby="sign-in-title">
        <span className={styles.sequence}>02 / SESSION</span>
        <h2 id="sign-in-title">Enter the fixture</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField label="Email" htmlFor="email" hint="Try either demo account">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={credentials.email}
              required
              onChange={handleEmailChange}
            />
          </FormField>

          <FormField label="Password" htmlFor="password" hint="Fixture default: demo1234">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              value={credentials.password}
              required
              onChange={handlePasswordChange}
            />
          </FormField>

          {error && <p className={styles.error} role="alert">{error.message}</p>}

          <Button type="submit" isLoading={isSubmitting}>
            Start session
          </Button>
        </form>
      </section>
    </main>
  )
}
