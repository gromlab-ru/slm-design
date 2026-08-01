import type { DemoAccount } from './types/demo-account.type'

/**
 * Учётные записи Simple API для воспроизводимых auth/RBAC-сценариев.
 */
export const AUTH_DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: 'admin@demo.local',
    password: 'demo1234',
    role: 'admin',
    description: 'Catalog CRUD and every order'
  },
  {
    email: 'customer@demo.local',
    password: 'demo1234',
    role: 'customer',
    description: 'Checkout and own orders'
  }
]
