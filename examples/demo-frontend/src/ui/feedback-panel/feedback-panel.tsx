import cl from 'clsx'
import type { FeedbackPanelProps } from './types/feedback-panel-props.type'
import styles from './styles/feedback-panel.module.css'

/**
 * Выделенный outcome для loading, empty, error и success-состояний.
 *
 * Используется для:
 *  - восстановления после API-ошибки
 *  - объяснения пустой или недоступной страницы
 */
export const FeedbackPanel = (props: FeedbackPanelProps) => {
  const { title, description, variant = 'info', children, className, ...rootAttrs } = props
  const role = variant === 'error' ? 'alert' : 'status'

  return (
    <section
      {...rootAttrs}
      role={role}
      className={cl(styles.root, styles[variant], className)}
    >
      <span className={styles.marker} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        {children}
      </div>
    </section>
  )
}
