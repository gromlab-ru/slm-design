import cl from 'clsx'
import type { {{name.pascalCase}}WidgetProps } from './types/{{name.kebabCase}}-widget-props.type'
import styles from './styles/{{name.kebabCase}}.module.css'

/**
 * <Назначение виджета {{name.pascalCase}} в 1 строке>.
 *
 * Используется для:
 *  - <сценарий 1>
 *  - <сценарий 2>
 */
export const {{name.pascalCase}}Widget = (props: {{name.pascalCase}}WidgetProps) => {
  const { children, className, ...rootAttrs } = props

  return (
    <div {...rootAttrs} className={cl(styles.root, className)}>
      {children}
    </div>
  )
}
