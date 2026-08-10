import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры Field.
 */
export type FieldParams = {
  /** Подпись поля формы. */
  label: string
  /** Дополнительная подсказка под полем. */
  hint?: string
  /** Сообщение ошибки, имеющее приоритет над подсказкой. */
  error?: string
  /** Атрибуты вложенного input. */
  inputProps: ComponentPropsWithoutRef<'input'>
}

/** Атрибуты корневого div без children. */
type RootAttrs = Omit<ComponentPropsWithoutRef<'div'>, 'children'>

/** Props подписанного поля формы. */
export type FieldProps = RootAttrs & FieldParams
