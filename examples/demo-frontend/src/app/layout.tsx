import type { Metadata } from 'next'

import { AppProviders } from './providers'
import type { AppLayoutProps } from './types/app-layout-props.type'
import './globals.css'

/**
 * Статические metadata архитектурного demo-приложения.
 */
export const metadata: Metadata = {
  title: {
    default: 'Layer Supply',
    template: '%s / Layer Supply'
  },
  description: 'A complete Next.js storefront demonstrating Scoped Layered Module Design.'
}

/**
 * Корневая Next.js entry point с application-scoped providers.
 */
export default function RootLayout(props: AppLayoutProps) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
