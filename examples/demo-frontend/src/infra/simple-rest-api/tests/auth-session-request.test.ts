import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { replaceSimpleAuthSession } from '@/infra/simple-auth-session'
import type { SimpleAuthTokens } from '@/infra/simple-auth-session'

import { createSimpleAuthSessionRequest } from '../auth-session-request'
import { simpleHttpClient } from '../client'
import { readSimpleApiFailure } from '../errors'

const TOKENS_A: SimpleAuthTokens = {
  accessToken: 'access-a',
  refreshToken: 'refresh-a',
  expiresIn: 60
}
const TOKENS_B: SimpleAuthTokens = {
  accessToken: 'access-b',
  refreshToken: 'refresh-b',
  expiresIn: 60
}

/**
 * Создаёт browser storage для session-bound transport test.
 */
const createStorage = (): Storage => {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value)
  }
}

beforeEach(() => {
  vi.stubGlobal('window', {
    localStorage: createStorage(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('session-bound REST requests', () => {
  it('stops a protected mutation before fetch when the logical session changed', async () => {
    const fetchMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)
    const firstSession = await replaceSimpleAuthSession(TOKENS_A)

    expect(firstSession).not.toBeNull()

    if (firstSession === null) {
      return
    }

    await replaceSimpleAuthSession(TOKENS_B)

    const error = await simpleHttpClient.request({
      path: '/api/v1/orders',
      method: 'POST',
      secure: true,
      ...createSimpleAuthSessionRequest(firstSession.sessionId)
    }).catch((requestError: unknown) => requestError)

    expect(readSimpleApiFailure(error).code).toBe('SESSION_CHANGED')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
