import cl from 'clsx'
import type { {{name.pascalCase}}ScreenProps } from './types/{{name.kebabCase}}-screen-props.type'
import styles from './styles/{{name.kebabCase}}.module.css'

/**
 * <Назначение экрана {{name.pascalCase}} в 1 строке>.
 *
 * Используется для:
 *  - <сценарий 1>
 *  - <сценарий 2>
 */
export const {{name.pascalCase}}Screen = (props: {{name.pascalCase}}ScreenProps) => {
  const { children, className, ...rootAttrs } = props

  return (
    <main {...rootAttrs} className={cl(styles.root, className)}>
      {children}
    </main>
  )
}
