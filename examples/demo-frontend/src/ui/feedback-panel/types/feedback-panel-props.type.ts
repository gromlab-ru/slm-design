import type { ComponentPropsWithoutRef } from 'react'

/**
 * Собственные параметры универсального route outcome.
 */
export type FeedbackPanelParams = {
  /** Короткий заголовок состояния. */
  title: string
  /** Пояснение и возможное действие пользователя. */
  description: string
  /** Семантический вариант состояния. */
  variant?: 'info' | 'error' | 'empty' | 'success'
}

/**
 * Атрибуты корневой section без обязательного title-атрибута.
 */
type RootAttrs = Omit<ComponentPropsWithoutRef<'section'>, 'title'>

/**
 * Props универсального route outcome.
 */
export type FeedbackPanelProps = RootAttrs & FeedbackPanelParams
