import type { Result } from '@/shared/types/result.type'

/**
 * Управляемый сценарий архитектурной демонстрации.
 */
export type DemoScenario =
  | 'normal'
  | 'slow'
  | 'timeout'
  | 'server-error'
  | 'rate-limited'
  | 'empty'
  | 'expired-auth'
  | 'forbidden'
  | 'conflict'

/**
 * Seed deterministic fixture-данных.
 */
export type DemoSeed = 'small' | 'large'

/**
 * Семантический вид fixture transition для composition-local state.
 */
export type DemoFixtureChangeKind = 'data' | 'role'

/**
 * Состояние доступности backend fixture.
 */
export type DemoHealth = 'checking' | 'online' | 'offline'

/**
 * Описание одного управляемого сценария.
 */
export type DemoScenarioOption = {
  /** Значение X-Demo-Scenario. */
  value: DemoScenario
  /** Короткое имя для control UI. */
  label: string
  /** Frontend concern, который демонстрирует сценарий. */
  description: string
}

/**
 * Ожидаемая ошибка testing-сценария.
 */
export type DemoControlError = {
  /** Стабильный UI-код. */
  code: 'service-unavailable' | 'rejected'
  /** Сообщение без transport payload. */
  message: string
}

/**
 * Публичный API demo-control домена.
 */
export type DemoControl = {
  /** Текущий request-local сценарий. */
  scenario: DemoScenario
  /** Доступные управляемые сценарии. */
  scenarios: DemoScenarioOption[]
  /** Состояние health endpoint с учётом выбранного сценария. */
  health: DemoHealth
  /** Версия доступного Simple API. */
  apiVersion: string | null
  /** Выполняется ли reset, seed или role mutation. */
  isMutating: boolean
  /** Последнее сообщение testing API. */
  message: string | null
  /** Последняя ожидаемая ошибка control action. */
  error: DemoControlError | null
  /** Непрозрачный cross-tab token последнего fixture transition. */
  fixtureChange: string
  /** Переключает заголовок и ревалидирует REST cache. */
  selectScenario: (scenario: DemoScenario) => Promise<void>
  /** Восстанавливает малый deterministic seed. */
  resetData: () => Promise<Result<string, DemoControlError>>
  /** Загружает выбранный deterministic seed. */
  seedData: (seed: DemoSeed) => Promise<Result<string, DemoControlError>>
  /** Меняет роль fixture-пользователя без повторного login. */
  changeRole: (
    userId: string,
    role: 'admin' | 'customer'
  ) => Promise<Result<string, DemoControlError>>
}
