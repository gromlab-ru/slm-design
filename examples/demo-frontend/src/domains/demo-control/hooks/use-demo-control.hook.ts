'use client'

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'

import {
  DEMO_SCENARIOS,
  getDemoFixtureChange,
  getDemoScenario,
  getServerDemoFixtureChange,
  getServerDemoScenario,
  publishDemoFixtureChange,
  setDemoScenario,
  simpleRestApi,
  subscribeDemoFixtureChange,
  subscribeDemoScenario,
  useSimpleRestApiCache,
  useGetDemoScenarios,
  useGetHealth
} from '@/infra/simple-rest-api'
import { isOneOf } from '@/shared/lib/value-predicates'
import type { Result } from '@/shared/types/result.type'

import { DEMO_SCENARIO_OPTIONS } from '../demo-control.constants'
import { mapDemoControlError } from '../errors/demo-control-error.mapper'
import type {
  DemoControl,
  DemoControlError,
  DemoScenario,
  DemoSeed
} from '../types/demo-control.type'

const FIXTURE_SYNC_ERROR: DemoControlError = {
  code: 'service-unavailable',
  message: 'Backend data changed, but cross-tab synchronization is unavailable. Reload this page.'
}

/**
 * Предоставляет UI управляемые backend-сценарии и testing actions.
 */
export const useDemoControl = (): DemoControl => {
  const cache = useSimpleRestApiCache()
  const scenario = useSyncExternalStore(
    subscribeDemoScenario,
    getDemoScenario,
    getServerDemoScenario
  )
  const fixtureChange = useSyncExternalStore(
    subscribeDemoFixtureChange,
    getDemoFixtureChange,
    getServerDemoFixtureChange
  )
  const previousScenarioRef = useRef(scenario)
  const previousFixtureChangeRef = useRef(fixtureChange)
  const healthQuery = useGetHealth({ refreshInterval: 15_000 })
  const scenariosQuery = useGetDemoScenarios()
  const [isMutating, setIsMutating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<DemoControlError | null>(null)
  const descriptionsByScenario = new Map<DemoScenario, string>()

  const synchronizeScenarioCache = useEffectEvent(() => {
    void cache.invalidateAll()
  })
  const synchronizeFixtureCache = useEffectEvent((change: string) => {
    if (change.startsWith('role:')) {
      void cache.invalidateOrders()
      return
    }

    void cache.invalidateAll()
  })

  useEffect(() => {
    if (previousScenarioRef.current !== scenario) {
      previousScenarioRef.current = scenario
      synchronizeScenarioCache()
    }
  }, [scenario])

  useEffect(() => {
    if (previousFixtureChangeRef.current !== fixtureChange) {
      previousFixtureChangeRef.current = fixtureChange
      synchronizeFixtureCache(fixtureChange)
    }
  }, [fixtureChange])

  scenariosQuery.data?.data.forEach((item) => {
    if (!isOneOf(item.name, DEMO_SCENARIOS)) {
      return
    }

    descriptionsByScenario.set(item.name, item.description)
  })

  const scenarios = DEMO_SCENARIO_OPTIONS.map((option) => ({
    ...option,
    description: descriptionsByScenario.get(option.value) ?? option.description
  }))

  /**
   * Переключает request header и принудительно обновляет активные queries.
   */
  const selectScenario = async (nextScenario: DemoScenario): Promise<void> => {
    previousScenarioRef.current = nextScenario
    setDemoScenario(nextScenario)
    setMessage(null)
    setError(null)
    await cache.invalidateAll()
  }

  /**
   * Сбрасывает backend state к малому deterministic seed.
   */
  const resetData = async (): Promise<Result<string, DemoControlError>> => {
    setIsMutating(true)
    setError(null)

    try {
      const response = await simpleRestApi.testing.simpleTestingReset()
      const nextMessage = response.data.message

      setMessage(nextMessage)
      await cache.invalidateAll()
      const changeToken = publishDemoFixtureChange('data')

      previousFixtureChangeRef.current = getDemoFixtureChange()

      if (changeToken === null) {
        setMessage(null)
        setError(FIXTURE_SYNC_ERROR)
        return { isSuccess: false, error: FIXTURE_SYNC_ERROR }
      }

      return { isSuccess: true, data: nextMessage }
    } catch (actionError) {
      const nextError = mapDemoControlError(actionError)
      setError(nextError)

      return { isSuccess: false, error: nextError }
    } finally {
      setIsMutating(false)
    }
  }

  /**
   * Загружает малый или большой deterministic seed.
   */
  const seedData = async (seed: DemoSeed): Promise<Result<string, DemoControlError>> => {
    setIsMutating(true)
    setError(null)

    try {
      const response = await simpleRestApi.testing.simpleTestingSeed({ preset: seed })
      const nextMessage = response.data.message

      setMessage(nextMessage)
      await cache.invalidateAll()
      const changeToken = publishDemoFixtureChange('data')

      previousFixtureChangeRef.current = getDemoFixtureChange()

      if (changeToken === null) {
        setMessage(null)
        setError(FIXTURE_SYNC_ERROR)
        return { isSuccess: false, error: FIXTURE_SYNC_ERROR }
      }

      return { isSuccess: true, data: nextMessage }
    } catch (actionError) {
      const nextError = mapDemoControlError(actionError)
      setError(nextError)

      return { isSuccess: false, error: nextError }
    } finally {
      setIsMutating(false)
    }
  }

  /**
   * Меняет роль fixture-пользователя без выпуска новой JWT-пары.
   */
  const changeRole = async (
    userId: string,
    role: 'admin' | 'customer'
  ): Promise<Result<string, DemoControlError>> => {
    setIsMutating(true)
    setError(null)

    try {
      const response = await simpleRestApi.testing.simpleTestingChangeRole({ userId }, { role })
      const nextMessage = `${response.data.name} is now ${response.data.role}.`

      setMessage(nextMessage)
      await cache.invalidateOrders()
      const changeToken = publishDemoFixtureChange('role')

      previousFixtureChangeRef.current = getDemoFixtureChange()

      if (changeToken === null) {
        setMessage(null)
        setError(FIXTURE_SYNC_ERROR)
        return { isSuccess: false, error: FIXTURE_SYNC_ERROR }
      }

      return { isSuccess: true, data: nextMessage }
    } catch (actionError) {
      const nextError = mapDemoControlError(actionError)
      setError(nextError)

      return { isSuccess: false, error: nextError }
    } finally {
      setIsMutating(false)
    }
  }

  const health = healthQuery.error
    ? 'offline'
    : healthQuery.isLoading || healthQuery.data === undefined
      ? 'checking'
      : 'online'

  return {
    scenario,
    scenarios,
    health,
    apiVersion: healthQuery.data?.data.version ?? null,
    isMutating,
    message,
    error,
    fixtureChange,
    selectScenario,
    resetData,
    seedData,
    changeRole
  }
}
