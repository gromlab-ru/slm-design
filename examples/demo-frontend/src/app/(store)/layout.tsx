import { StoreShellLayout } from '@/compositions/layouts/store-shell'

import type { AppLayoutProps } from '../types/app-layout-props.type'

/**
 * Подключает общий storefront layout ко всем leaf routes группы.
 */
export default function StoreLayout(props: AppLayoutProps) {
  const { children } = props

  return <StoreShellLayout>{children}</StoreShellLayout>
}
