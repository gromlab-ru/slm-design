import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры подписи поля формы.
 */
export type FormFieldParams = {
  /** Видимая подпись control. */
  label: string
  /** Идентификатор связанного form control. */
  htmlFor: string
  /** Необязательная подсказка формата. */
  hint?: string
  /** Ошибка конкретного поля. */
  error?: string
}

/**
 * Атрибуты корневого контейнера.
 */
type RootAttrs = ComponentPropsWithoutRef<'div'>

/**
 * Props подписи и состояния form control.
 */
export type FormFieldProps = RootAttrs & FormFieldParams
