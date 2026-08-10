import { describe, expect, it, vi } from 'vitest'

import { mapCatalogError } from './map-catalog-error'

vi.mock('infra/simple-rest-api', () => ({
  toSimpleRestApiError: () => ({
    status: 409,
    code: 'PRODUCT_VERSION_CONFLICT',
    message: 'Source-specific message',
    requestId: 'req-test'
  })
}))

describe('mapCatalogError', () => {
  it('turns a source optimistic-lock failure into a catalog outcome', () => {
    const catalogError = mapCatalogError(new Error('transport failure'))

    expect(catalogError.code).toBe('version-conflict')
    expect(catalogError.message).not.toContain('Source-specific')
  })
})
