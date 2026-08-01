import { describe, expect, it } from 'vitest'

import { formatDate } from './format-date'

describe('formatDate', () => {
  it('uses an explicit UTC calendar day', () => {
    expect(formatDate('2026-07-20T00:30:00.000Z')).toBe('Jul 20, 2026')
  })
})
