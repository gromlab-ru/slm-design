import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  hydrateCartLines,
  initializePersistedCartSnapshot,
  readPersistedCartSnapshot,
  resetPersistedCartSnapshot,
  updatePersistedCartSnapshot
} from '../cart.persistence'

const STORED_LINE = {
  product: {
    id: 'product-test',
    name: 'Test object',
    slug: 'test-object',
    description: 'Persisted cart fixture.',
    priceCents: 2500,
    currency: 'USD' as const,
    categoryId: 'category-test',
    stock: 2,
    rating: 4.5,
    imageUrl: 'https://picsum.photos/seed/test/640/480',
    createdAt: '2026-07-20T10:00:00.000Z',
    version: 1
  },
  quantity: 1
}

/**
 * Создаёт localStorage для persisted cart CAS tests.
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('cart persistence boundary', () => {
  it('rejects a persisted product image outside the configured host', () => {
    const storedLines = [
      {
        ...STORED_LINE,
        product: {
          ...STORED_LINE.product,
          imageUrl: 'https://example.com/untrusted.png'
        }
      }
    ]

    expect(hydrateCartLines(storedLines)).toEqual([])
  })

  it('rejects a legacy quantity above the order line limit', () => {
    const storedLines = [
      {
        ...STORED_LINE,
        product: { ...STORED_LINE.product, stock: 100 },
        quantity: 21
      }
    ]

    expect(hydrateCartLines(storedLines)).toEqual([])
  })

  it('rejects a fractional persisted quantity', () => {
    expect(hydrateCartLines([{ ...STORED_LINE, quantity: 1.5 }])).toEqual([])
  })

  it('does not clear a newer cross-tab snapshot before its storage event arrives', async () => {
    const initialSnapshot = await initializePersistedCartSnapshot()

    expect(initialSnapshot).not.toBeNull()

    if (initialSnapshot === null) {
      return
    }

    const checkoutSnapshot = await updatePersistedCartSnapshot(() => [STORED_LINE])

    expect(checkoutSnapshot.status).toBe('updated')

    if (checkoutSnapshot.status !== 'updated') {
      return
    }

    await updatePersistedCartSnapshot((lines) => {
      const line = lines[0]

      return line === undefined ? lines : [{ ...line, quantity: 2 }]
    })

    const staleClear = await updatePersistedCartSnapshot(
      () => [],
      checkoutSnapshot.snapshot.revision
    )
    const current = readPersistedCartSnapshot()

    expect(staleClear).toEqual({ status: 'stale' })
    expect(current.status === 'ready' ? current.snapshot?.lines[0]?.quantity : null).toBe(2)
  })

  it('keeps forced recovery above the local revision when the clock moves backwards', async () => {
    const currentSnapshot = await initializePersistedCartSnapshot()

    expect(currentSnapshot).not.toBeNull()

    if (currentSnapshot === null) {
      return
    }

    vi.spyOn(Date, 'now').mockReturnValue(1)
    window.localStorage.setItem('demo-frontend:cart', '{broken-json')

    const recoveredSnapshot = await resetPersistedCartSnapshot(currentSnapshot.revision)

    expect(recoveredSnapshot?.revision).toBeGreaterThan(currentSnapshot.revision)
  })
})
