import type { DemoScenario, DemoScenarioOption } from './types/demo-control.type'

/**
 * UI-метаданные сценариев, доступные даже при отказе testing endpoint.
 */
export const DEMO_SCENARIO_OPTIONS: readonly DemoScenarioOption[] = [
  { value: 'normal', label: 'Normal', description: 'Happy path responses' },
  { value: 'slow', label: 'Slow', description: 'Visible loading states' },
  { value: 'timeout', label: 'Timeout', description: 'Client abort after 5 seconds' },
  { value: 'server-error', label: '500', description: 'Deterministic server failure' },
  { value: 'rate-limited', label: '429', description: 'Rate-limit response' },
  { value: 'empty', label: 'Empty', description: 'Valid empty collections' },
  { value: 'expired-auth', label: 'Expired auth', description: 'Protected requests return 401' },
  { value: 'forbidden', label: 'Forbidden', description: 'Protected requests return 403' },
  { value: 'conflict', label: 'Conflict', description: 'Mutations return 409' }
]

/**
 * Возвращает fallback-описание известного сценария.
 */
export const getDemoScenarioOption = (scenario: DemoScenario): DemoScenarioOption => {
  return DEMO_SCENARIO_OPTIONS.find((option) => option.value === scenario) ?? DEMO_SCENARIO_OPTIONS[0]
}
