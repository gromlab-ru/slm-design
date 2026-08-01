import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры универсальной кнопки.
 */
export type ButtonParams = {
  /** Визуальный приоритет действия. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** Размер интерактивной области. */
  size?: 'small' | 'medium'
  /** Выполняется ли асинхронное действие. */
  isLoading?: boolean
}

/**
 * Атрибуты корневой button-кнопки.
 */
type RootAttrs = ComponentPropsWithoutRef<'button'>

/**
 * Props универсальной кнопки.
 */
export type ButtonProps = RootAttrs & ButtonParams
