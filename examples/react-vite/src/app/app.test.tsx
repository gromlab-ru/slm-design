import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearSimpleRestApiTokens } from 'infra/simple-rest-api'
import { App } from './app'
import { AppProviders } from './providers/app-providers'

const demoUser = {
  id: 'user-admin',
  email: 'admin@demo.local',
  name: 'Demo Admin',
  role: 'admin',
  avatarUrl: 'https://i.pravatar.cc/160?img=12'
}

const demoProduct = {
  id: 'product-keyboard',
  name: 'Mechanical Keyboard',
  slug: 'mechanical-keyboard',
  description: 'Mechanical Keyboard is a deterministic demo product used by frontend examples.',
  priceCents: 12990,
  currency: 'USD',
  categoryId: 'category-electronics',
  stock: 24,
  rating: 4.8,
  imageUrl: 'https://picsum.photos/seed/mechanical-keyboard/640/480',
  createdAt: '2026-07-10T09:00:00.000Z',
  version: 1
}

/**
 * Создаёт JSON response, совместимый с generated HttpClient.
 */
const jsonResponse = (body: unknown, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Эмулирует минимальный Simple API для app-level smoke-сценария.
 */
const createSimpleApiFetch = () => {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input))
    const method = init?.method ?? 'GET'

    if (url.pathname === '/api/v1/auth/login' && method === 'POST') {
      return jsonResponse({
        data: {
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 60,
            tokenType: 'Bearer'
          },
          user: demoUser
        }
      })
    }

    if (url.pathname === '/api/v1/products' && method === 'GET') {
      return jsonResponse({
        data: [demoProduct],
        meta: { page: 1, limit: 6, total: 1, totalPages: 1 }
      })
    }

    if (url.pathname === '/api/v1/categories' && method === 'GET') {
      return jsonResponse({
        data: [
          {
            id: 'category-electronics',
            name: 'Electronics',
            slug: 'electronics',
            productCount: 1
          }
        ]
      })
    }

    if (url.pathname === '/api/v1/orders' && method === 'GET') {
      return jsonResponse({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 }
      })
    }

    if (url.pathname === '/api/v1/orders' && method === 'POST') {
      return jsonResponse(
        {
          data: {
            id: 'order-010',
            userId: 'user-admin',
            status: 'pending',
            items: [
              {
                productId: demoProduct.id,
                productName: demoProduct.name,
                quantity: 1,
                unitPriceCents: demoProduct.priceCents
              }
            ],
            totalCents: demoProduct.priceCents,
            currency: 'USD',
            createdAt: '2026-08-10T10:00:00.000Z'
          }
        },
        201
      )
    }

    return jsonResponse({ code: 'NOT_FOUND', message: 'Not found' }, 404)
  })
}

afterEach(() => {
  clearSimpleRestApiTokens()
})

describe('App', () => {
  it('authenticates, loads domain data and checks out a product', async () => {
    const user = userEvent.setup()
    const fetchMock = createSimpleApiFetch()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <AppProviders>
        <App />
      </AppProviders>
    )

    await user.click(await screen.findByRole('button', { name: 'Войти в магазин' }))

    expect(await screen.findByRole('heading', { name: 'Mechanical Keyboard' })).toBeInTheDocument()
    expect(screen.getByText('Demo Admin')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'В заказ' }))
    expect(screen.getByText('Draft order')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Оформить заказ' }))

    expect(await screen.findByText('order-010')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/orders',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
