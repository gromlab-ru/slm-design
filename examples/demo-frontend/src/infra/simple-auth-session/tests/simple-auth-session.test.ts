import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearSimpleAuthSession,
  clearSimpleAuthSessionScope,
  discardSimpleAuthSession,
  getSimpleAuthSession,
  readSimpleAuthSession,
  replaceSimpleAuthSession,
  rotateSimpleAuthSession
} from '../simple-auth-session'
import type { SimpleAuthTokens } from '../types/simple-auth-tokens.type'

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
 * Создаёт изолированный localStorage для CAS unit tests.
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

describe('simple auth session CAS', () => {
  it('rotates revision without changing logical session id', async () => {
    const firstSession = await replaceSimpleAuthSession(TOKENS_A)

    expect(firstSession).not.toBeNull()

    if (firstSession === null) {
      return
    }

    const rotatedSession = await rotateSimpleAuthSession(firstSession, TOKENS_B)

    expect(rotatedSession?.sessionId).toBe(firstSession.sessionId)
    expect(rotatedSession?.revision).not.toBe(firstSession.revision)
    expect(rotatedSession?.tokens).toEqual(TOKENS_B)
  })

  it('rejects stale save and clear after a newer revision wins', async () => {
    const firstSession = await replaceSimpleAuthSession(TOKENS_A)

    expect(firstSession).not.toBeNull()

    if (firstSession === null) {
      return
    }

    const rotatedSession = await rotateSimpleAuthSession(firstSession, TOKENS_B)

    expect(rotatedSession).not.toBeNull()
    await expect(rotateSimpleAuthSession(firstSession, TOKENS_A)).resolves.toBeNull()
    await expect(clearSimpleAuthSession(firstSession)).resolves.toBe(false)
    expect(getSimpleAuthSession()?.tokens).toEqual(TOKENS_B)
  })

  it('does not publish a session when storage commit fails', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage denied')
    })

    await expect(replaceSimpleAuthSession(TOKENS_A)).resolves.toBeNull()
    expect(getSimpleAuthSession()).toBeNull()
  })

  it('reports a failed clear while persisted state remains', async () => {
    const session = await replaceSimpleAuthSession(TOKENS_A)

    expect(session).not.toBeNull()

    if (session === null) {
      return
    }

    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage denied')
    })

    await expect(clearSimpleAuthSession(session)).resolves.toBe(false)
    expect(getSimpleAuthSession()).toEqual(session)
  })

  it('distinguishes a storage read failure from a missing session', async () => {
    const session = await replaceSimpleAuthSession(TOKENS_A)

    expect(session).not.toBeNull()

    if (session === null) {
      return
    }

    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage denied')
    })

    expect(readSimpleAuthSession()).toEqual({
      status: 'unavailable',
      observedValue: null
    })
    await expect(clearSimpleAuthSessionScope(session.sessionId)).resolves.toBe(false)
  })

  it('discards a corrupt persisted session without parsing it', async () => {
    window.localStorage.setItem('demo-frontend:simple-auth-session', '{broken-json')
    const corruptResult = readSimpleAuthSession()

    expect(corruptResult).toEqual({
      status: 'unavailable',
      observedValue: '{broken-json'
    })

    if (corruptResult.status !== 'unavailable' || corruptResult.observedValue === null) {
      return
    }

    await expect(discardSimpleAuthSession(corruptResult.observedValue)).resolves.toBe(true)
    expect(readSimpleAuthSession()).toEqual({ status: 'ready', session: null })
  })

  it('does not discard a new login that replaced the observed corrupt payload', async () => {
    window.localStorage.setItem('demo-frontend:simple-auth-session', '{broken-json')
    const corruptResult = readSimpleAuthSession()

    if (corruptResult.status !== 'unavailable' || corruptResult.observedValue === null) {
      return
    }

    const replacementSession = await replaceSimpleAuthSession(TOKENS_B)

    await expect(discardSimpleAuthSession(corruptResult.observedValue)).resolves.toBe(false)
    expect(getSimpleAuthSession()).toEqual(replacementSession)
  })
})
