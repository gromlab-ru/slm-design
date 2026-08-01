import cl from 'clsx'
import type { ButtonProps } from './types/button-props.type'
import styles from './styles/button.module.css'

/**
 * Универсальное действие storefront-интерфейса.
 *
 * Используется для:
 *  - submit и mutation действий
 *  - компактных toolbar-контролов
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
  const content = isLoading ? 'Working...' : children

  return (
    <button
      {...rootAttrs}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cl(styles.root, styles[variant], styles[size], className)}
    >
      {content}
    </button>
  )
}
