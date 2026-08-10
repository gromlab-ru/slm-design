import { afterEach, describe, expect, it, vi } from 'vitest'

import { simpleUsersMe } from '../generated/operations/simple-users-me'
import {
  clearSimpleRestApiTokens,
  setSimpleRestApiTokens
} from '../session/simple-rest-api-credentials'
import { simpleHttpClient } from './client'

/**
 * Создаёт JSON response для transport-level проверки.
 */
const jsonResponse = (body: unknown, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

afterEach(() => {
  clearSimpleRestApiTokens()
})

describe('simpleHttpClient', () => {
  it('coalesces concurrent 401 responses into one refresh request', async () => {
    let releaseRefresh = (): void => undefined
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve
    })
    let refreshRequestCount = 0
    let expiredRequestCount = 0

    /**
     * Эмулирует истёкший access token и управляемую ротацию token pair.
     */
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = new URL(String(input))
        const authorization = new Headers(init?.headers).get('Authorization')

        if (url.pathname === '/api/v1/auth/refresh') {
          refreshRequestCount += 1
          await refreshGate
          return jsonResponse({
            data: {
              tokens: {
                accessToken: 'fresh-access',
                refreshToken: 'fresh-refresh',
                expiresIn: 60,
                tokenType: 'Bearer'
              },
              user: {
                id: 'user-admin',
                email: 'admin@demo.local',
                name: 'Demo Admin',
                role: 'admin',
                avatarUrl: null
              }
            }
          })
        }

        if (authorization === 'Bearer expired-access') {
          expiredRequestCount += 1
          return jsonResponse({ code: 'JWT_INVALID', message: 'Expired' }, 401)
        }

        return jsonResponse({
          data: {
            id: 'user-admin',
            email: 'admin@demo.local',
            name: 'Demo Admin',
            role: 'admin',
            avatarUrl: null
          }
        })
      }
    )

    vi.stubGlobal('fetch', fetchMock)
    setSimpleRestApiTokens({
      accessToken: 'expired-access',
      refreshToken: 'refresh-token',
      expiresIn: 0,
      tokenType: 'Bearer'
    })

    const requests = Promise.all([
      simpleUsersMe(simpleHttpClient),
      simpleUsersMe(simpleHttpClient)
    ])

    await vi.waitFor(() => {
      expect(expiredRequestCount).toBe(2)
      expect(refreshRequestCount).toBe(1)
    })

    releaseRefresh()

    const responses = await requests

    expect(responses).toHaveLength(2)
    expect(responses[0].data.email).toBe('admin@demo.local')
    expect(refreshRequestCount).toBe(1)
  })
})
