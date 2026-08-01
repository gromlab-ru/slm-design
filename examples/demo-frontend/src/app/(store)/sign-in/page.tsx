import type { Metadata } from 'next'

import { SignInScreen } from '@/compositions/screens/sign-in'

/**
 * Metadata sign-in route.
 */
export const metadata: Metadata = {
  title: 'Sign in'
}

/**
 * Подключает auth composition к framework route.
 */
export default function SignInPage() {
  return <SignInScreen />
}
