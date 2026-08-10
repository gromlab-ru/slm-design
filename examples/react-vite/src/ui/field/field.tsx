import { useId } from 'react'
import cl from 'clsx'
import type { FieldProps } from './types/field-props.type'
import styles from './styles/field.module.css'

/**
 * Подписанное текстовое поле с подсказкой и ошибкой.
 *
 * Используется для:
 *  - единообразного ввода данных в доменных формах
 *  - доступного связывания label, input и сообщения ошибки
 */
export const Field = (props: FieldProps) => {
  const { label, hint, error, inputProps, className, ...rootAttrs } = props
  const generatedId = useId()
  const inputId = inputProps.id ?? generatedId
  const supportText = error ?? hint
  const supportId = supportText ? `${inputId}-support` : undefined
  const hasError = Boolean(error)

  return (
    <div {...rootAttrs} className={cl(styles.root, className)}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        className={cl(styles.input, inputProps.className)}
        aria-describedby={supportId}
        aria-invalid={hasError}
      />
      {supportText && (
        <span
          id={supportId}
          className={cl(styles.support, hasError && styles.error)}
        >
          {supportText}
        </span>
      )}
    </div>
  )
}
