import { readJsonStorage, writeJsonStorage } from '@/infra/browser-storage'
import { isOneOf, isString } from '@/shared/lib/value-predicates'

import type { DemoScenario, DemoScenarioListener } from './types/demo-scenario.type'

const DEMO_SCENARIO_KEY = 'demo-frontend:scenario'
const DEMO_FIXTURE_CHANGE_KEY = 'demo-frontend:fixture-change'
const demoScenarioListeners = new Set<DemoScenarioListener>()
const demoFixtureListeners = new Set<DemoScenarioListener>()
let currentFixtureChange = ''

/**
 * Допустимые значения X-Demo-Scenario для Simple API.
 */
export const DEMO_SCENARIOS = [
  'normal',
  'slow',
  'timeout',
  'server-error',
  'rate-limited',
  'empty',
  'expired-auth',
  'forbidden',
  'conflict'
] as const satisfies readonly DemoScenario[]

/**
 * Возвращает сценарий, выбранный для последующих запросов Simple API.
 */
export const getDemoScenario = (): DemoScenario => {
  const value = readJsonStorage(DEMO_SCENARIO_KEY)

  return isOneOf(value, DEMO_SCENARIOS) ? value : 'normal'
}

/**
 * Возвращает стабильное SSR-значение внешнего store.
 */
export const getServerDemoScenario = (): DemoScenario => {
  return 'normal'
}

/**
 * Изменяет X-Demo-Scenario для будущих запросов.
 */
export const setDemoScenario = (scenario: DemoScenario): void => {
  if (writeJsonStorage(DEMO_SCENARIO_KEY, scenario)) {
    demoScenarioListeners.forEach((listener) => listener())
  }
}

/**
 * Подписывает UI на local и cross-tab изменения request scenario.
 */
export const subscribeDemoScenario = (listener: DemoScenarioListener): (() => void) => {
  demoScenarioListeners.add(listener)

  /**
   * Передаёт изменение request scenario из другой вкладки.
   */
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === DEMO_SCENARIO_KEY) {
      listener()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  return () => {
    demoScenarioListeners.delete(listener)

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }
}

/**
 * Возвращает последний непрозрачный fixture transition token.
 */
export const getDemoFixtureChange = (): string => {
  if (currentFixtureChange !== '') {
    return currentFixtureChange
  }

  const value = readJsonStorage(DEMO_FIXTURE_CHANGE_KEY)

  currentFixtureChange = isString(value) ? value : ''

  return currentFixtureChange
}

/**
 * Возвращает стабильный SSR snapshot fixture transitions.
 */
export const getServerDemoFixtureChange = (): string => {
  return ''
}

/**
 * Публикует fixture transition всем вкладкам одного origin.
 */
export const publishDemoFixtureChange = (kind: 'data' | 'role'): string | null => {
  const token = `${kind}:${globalThis.crypto.randomUUID()}`
  const isPersisted = writeJsonStorage(DEMO_FIXTURE_CHANGE_KEY, token)

  currentFixtureChange = token
  demoFixtureListeners.forEach((listener) => listener())

  return isPersisted ? token : null
}

/**
 * Подписывает cache и composition owners на fixture transitions.
 */
export const subscribeDemoFixtureChange = (
  listener: DemoScenarioListener
): (() => void) => {
  demoFixtureListeners.add(listener)

  /**
   * Передаёт fixture transition из другой вкладки.
   */
  const handleStorage = (event: StorageEvent): void => {
    if (event.key === DEMO_FIXTURE_CHANGE_KEY) {
      currentFixtureChange = ''
      listener()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  return () => {
    demoFixtureListeners.delete(listener)

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }
}
