import cl from 'clsx'
import type { {{name.pascalCase}}LayoutProps } from './types/{{name.kebabCase}}-layout-props.type'
import styles from './styles/{{name.kebabCase}}.module.css'

/**
 * <Назначение layout {{name.pascalCase}} в 1 строке>.
 *
 * Используется для:
 *  - <сценарий 1>
 *  - <сценарий 2>
 */
export const {{name.pascalCase}}Layout = (props: {{name.pascalCase}}LayoutProps) => {
  const { children, className, ...rootAttrs } = props

  return (
    <div {...rootAttrs} className={cl(styles.root, className)}>
      {children}
    </div>
  )
}
