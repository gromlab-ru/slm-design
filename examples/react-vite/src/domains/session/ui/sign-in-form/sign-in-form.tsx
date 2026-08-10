import { useState } from 'react'
import type { FormEvent } from 'react'
import cl from 'clsx'

import { Button } from 'ui/button'
import { Field } from 'ui/field'
import { SessionError } from '../../errors/session.error'
import { useSession } from '../../hooks/use-session.hook'
import type { SignInFormProps } from './types/sign-in-form-props.type'
import styles from './styles/sign-in-form.module.css'

const DEMO_PASSWORD = 'demo1234'

/**
 * Форма входа в Simple Store с быстрым выбором demo-роли.
 *
 * Используется для:
 *  - входа администратора для управления каталогом
 *  - входа покупателя для оформления и просмотра заказов
 */
export const SignInForm = (props: SignInFormProps) => {
  const { className, ...rootAttrs } = props
  const { login } = useSession()
  const [email, setEmail] = useState('admin@demo.local')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Проверяет credentials через session domain и показывает ожидаемый исход.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
    } catch (error) {
      const message =
        error instanceof SessionError ? error.message : 'Не удалось выполнить вход.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      {...rootAttrs}
      className={cl(styles.root, className)}
      onSubmit={handleSubmit}
    >
      <div className={styles.accounts} aria-label="Demo accounts">
        <button
          type="button"
          className={cl(styles.account, email === 'admin@demo.local' && styles.accountActive)}
          onClick={() => setEmail('admin@demo.local')}
        >
          <span className={styles.accountRole}>Администратор</span>
          <span>Каталог и заказы</span>
        </button>
        <button
          type="button"
          className={cl(styles.account, email === 'customer@demo.local' && styles.accountActive)}
          onClick={() => setEmail('customer@demo.local')}
        >
          <span className={styles.accountRole}>Покупатель</span>
          <span>Покупки и история</span>
        </button>
      </div>

      <Field
        label="Email"
        inputProps={{
          type: 'email',
          name: 'email',
          autoComplete: 'username',
          value: email,
          onChange: (event) => setEmail(event.currentTarget.value),
          required: true
        }}
      />
      <Field
        label="Пароль"
        hint="Для обеих demo-учётных записей: demo1234"
        inputProps={{
          type: 'password',
          name: 'password',
          autoComplete: 'current-password',
          value: password,
          minLength: 8,
          onChange: (event) => setPassword(event.currentTarget.value),
          required: true
        }}
      />

      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Войти в магазин
      </Button>
    </form>
  )
}
