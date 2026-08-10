import cl from 'clsx'
import type { ButtonProps } from './types/button-props.type'
import styles from './styles/button.module.css'

/**
 * Универсальная кнопка действий с едиными состояниями.
 *
 * Используется для:
 *  - основных и вторичных действий в доменных формах
 *  - отображения состояния отправки запроса
 */
export const Button = (props: ButtonProps) => {
  const {
    children,
    className,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    disabled,
    type = 'button',
    ...rootAttrs
  } = props

  return (
    <button
      {...rootAttrs}
      type={type}
      className={cl(styles.root, styles[variant], styles[size], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}
