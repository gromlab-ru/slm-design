import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры Button.
 */
export type ButtonParams = {
  /** Визуальный приоритет действия. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** Размер кнопки. */
  size?: 'small' | 'medium'
  /** Показывает выполнение действия и блокирует повторное нажатие. */
  isLoading?: boolean
}

/** Атрибуты корневой кнопки. */
type RootAttrs = ComponentPropsWithoutRef<'button'>

/** Props универсальной кнопки приложения. */
export type ButtonProps = RootAttrs & ButtonParams
