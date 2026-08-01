'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useEffectEvent, useRef } from 'react'
import cl from 'clsx'

import { useAuth } from '@/domains/auth'
import { useCart } from '@/domains/cart'
import { useDemoControl } from '@/domains/demo-control'
import { Button } from '@/ui/button'

import type { DemoToolbarWidgetProps } from './types/demo-toolbar-widget-props.type'
import styles from './styles/demo-toolbar.module.css'

/**
 * Управляет детерминированными сбоями и seed fixture-бэкенда.
 *
 * Используется для:
 *  - проверки loading, empty, error и auth outcomes
 *  - сброса данных между архитектурными демонстрациями
 */
export const DemoToolbarWidget = (props: DemoToolbarWidgetProps) => {
  const { className, ...rootAttrs } = props
  const demo = useDemoControl()
  const auth = useAuth()
  const cart = useCart()
  const selectedOption = demo.scenarios.find((option) => option.value === demo.scenario)
  const healthLabel = demo.health === 'online' ? `API ${demo.apiVersion ?? ''}`.trim() : demo.health
  const canChangeRole = auth.user !== null
  const nextRole = auth.user?.role === 'admin' ? 'customer' : 'admin'
  const roleActionLabel = `Become ${nextRole}`
  const previousFixtureChangeRef = useRef(demo.fixtureChange)
  const synchronizeFixtureOwners = useEffectEvent((change: string) => {
    if (change.startsWith('data:')) {
      void cart.clearCart()
    }

    if (auth.sessionKey !== null) {
      void auth.refreshCurrentUser()
    }
  })

  useEffect(() => {
    if (previousFixtureChangeRef.current !== demo.fixtureChange) {
      previousFixtureChangeRef.current = demo.fixtureChange
      synchronizeFixtureOwners(demo.fixtureChange)
    }
  }, [demo.fixtureChange])

  /**
   * Применяет выбранный request-local сценарий.
   */
  const handleScenarioChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedScenario = demo.scenarios.find((option) => option.value === event.target.value)

    if (selectedScenario !== undefined) {
      void demo.selectScenario(selectedScenario.value)
    }
  }

  /**
   * Восстанавливает исходный малый seed.
   */
  const handleReset = async (): Promise<void> => {
    await demo.resetData()
  }

  /**
   * Загружает большой deterministic dataset.
   */
  const handleLargeSeed = async (): Promise<void> => {
    await demo.seedData('large')
  }

  /**
   * Переключает роль текущего fixture-пользователя и обновляет профиль.
   */
  const handleRoleChange = async (): Promise<void> => {
    if (auth.user === null) {
      return
    }

    await demo.changeRole(auth.user.id, nextRole)
  }

  return (
    <aside {...rootAttrs} className={cl(styles.root, className)}>
      <details className={styles.panel}>
        <summary className={styles.summary}>
          <span className={styles.pulse} data-health={demo.health} />
          <span>Demo controls</span>
          <span className={styles.current}>{demo.scenario}</span>
        </summary>

        <div className={styles.body}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Fixture runtime</p>
            <p className={styles.description}>
              {selectedOption?.description ?? 'Choose a deterministic API behavior.'}
            </p>
            <span className={styles.health}>{healthLabel}</span>
          </div>

          <label className={styles.control}>
            <span>Request scenario</span>
            <select value={demo.scenario} onChange={handleScenarioChange}>
              {demo.scenarios.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.actions}>
            <Button variant="ghost" size="small" isLoading={demo.isMutating} onClick={handleReset}>
              Reset data
            </Button>
            <Button variant="ghost" size="small" isLoading={demo.isMutating} onClick={handleLargeSeed}>
              Seed 250
            </Button>
            {canChangeRole && (
              <Button
                variant="ghost"
                size="small"
                isLoading={demo.isMutating}
                onClick={handleRoleChange}
              >
                {roleActionLabel}
              </Button>
            )}
          </div>

          {demo.message && <p className={styles.message} role="status">{demo.message}</p>}
          {demo.error && <p className={styles.error} role="alert">{demo.error.message}</p>}
        </div>
      </details>
    </aside>
  )
}
