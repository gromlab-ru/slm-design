import cl from 'clsx'
import type { FormFieldProps } from './types/form-field-props.type'
import styles from './styles/form-field.module.css'

/**
 * Доступная подпись и feedback для form control.
 *
 * Используется для:
 *  - auth и catalog admin форм
 */
export const FormField = (props: FormFieldProps) => {
  const { label, htmlFor, hint, error, children, className, ...rootAttrs } = props
  const hasError = Boolean(error)

  return (
    <div {...rootAttrs} className={cl(styles.root, hasError && styles.hasError, className)}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !hasError && <span className={styles.hint}>{hint}</span>}
      {hasError && <span className={styles.error}>{error}</span>}
    </div>
  )
}
