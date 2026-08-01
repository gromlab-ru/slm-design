'use client'

import { useEffect, useEffectEvent, useRef } from 'react'

import {
  getDemoFixtureChange,
  subscribeDemoFixtureChange
} from '@/infra/simple-rest-api'

import type { DemoFixtureChangeKind } from '../types/demo-control.type'

/**
 * Извлекает устойчивый domain kind из technical fixture token.
 */
const getFixtureChangeKind = (token: string): DemoFixtureChangeKind | null => {
  if (token.startsWith('data:')) {
    return 'data'
  }

  if (token.startsWith('role:')) {
    return 'role'
  }

  return null
}

/**
 * Подписывает composition-local state на будущие fixture transitions.
 */
export const useOnDemoFixtureChange = (
  onChange: (kind: DemoFixtureChangeKind) => void
): void => {
  const previousTokenRef = useRef(getDemoFixtureChange())
  const handleChange = useEffectEvent(() => {
    const token = getDemoFixtureChange()

    if (token === previousTokenRef.current) {
      return
    }

    previousTokenRef.current = token
    const kind = getFixtureChangeKind(token)

    if (kind !== null) {
      onChange(kind)
    }
  })

  useEffect(() => subscribeDemoFixtureChange(handleChange), [])
}
