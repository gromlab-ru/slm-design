import { describe, expect, it, vi } from 'vitest'

import { mapOrderError } from './map-order-error'

vi.mock('infra/simple-rest-api', () => ({
  toSimpleRestApiError: () => ({
    status: 422,
    code: 'UNSUPPORTED_ORDER_CURRENCY',
    message: 'Source-specific message',
    requestId: 'req-test'
  })
}))

describe('mapOrderError', () => {
  it('turns a source currency failure into an orders outcome', () => {
    const orderError = mapOrderError(new Error('transport failure'))

    expect(orderError.code).toBe('unsupported-currency')
    expect(orderError.message).not.toContain('Source-specific')
  })
})
