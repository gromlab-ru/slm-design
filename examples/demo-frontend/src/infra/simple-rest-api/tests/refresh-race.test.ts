import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getSimpleAuthSession,
  replaceSimpleAuthSession
} from '@/infra/simple-auth-session'
import type { SimpleAuthTokens } from '@/infra/simple-auth-session'

import { refreshSimpleAccessToken } from '../refresh-access-token'

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

const ROTATED_TOKENS_A: SimpleAuthTokens = {
  accessToken: 'access-a-rotated',
  refreshToken: 'refresh-a-rotated',
  expiresIn: 60
}

/**
 * Создаёт browser storage для transport race tests.
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

describe('JWT refresh session races', () => {
  it('does not overwrite a newer login with a delayed refresh response', async () => {
    let resolveFetch!: (response: Response) => void
    const fetchPromise = new Promise<Response>((resolveResponse) => {
      resolveFetch = resolveResponse
    })
    vi.stubGlobal('fetch', vi.fn(() => fetchPromise))
    const firstSession = await replaceSimpleAuthSession(TOKENS_A)

    expect(firstSession).not.toBeNull()

    if (firstSession === null) {
      return
    }

    const pendingRefresh = refreshSimpleAccessToken(firstSession)

    const replacementSession = await replaceSimpleAuthSession(TOKENS_B)
    resolveFetch(
      new Response(JSON.stringify({ data: { tokens: ROTATED_TOKENS_A } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )

    await expect(pendingRefresh).resolves.toBeNull()
    expect(getSimpleAuthSession()).toEqual(replacementSession)
  })

  it('does not clear a newer login when stale refresh is rejected', async () => {
    let resolveFetch!: (response: Response) => void
    const fetchPromise = new Promise<Response>((resolveResponse) => {
      resolveFetch = resolveResponse
    })
    vi.stubGlobal('fetch', vi.fn(() => fetchPromise))
    const firstSession = await replaceSimpleAuthSession(TOKENS_A)

    expect(firstSession).not.toBeNull()

    if (firstSession === null) {
      return
    }

    const pendingRefresh = refreshSimpleAccessToken(firstSession)

    const replacementSession = await replaceSimpleAuthSession(TOKENS_B)
    resolveFetch(
      new Response(JSON.stringify({ code: 'REFRESH_TOKEN_REUSED', message: 'Rejected' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' }
      })
    )

    await expect(pendingRefresh).rejects.toThrow('401 Unauthorized')
    expect(getSimpleAuthSession()).toEqual(replacementSession)
  })
})
