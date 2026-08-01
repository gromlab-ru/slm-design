/**
 * Управляемый сетевой сценарий fixture-бэкенда.
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
 * Подписчик на изменение активного сетевого сценария.
 */
export type DemoScenarioListener = () => void
