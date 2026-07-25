---
title: Композиция через Provider
description: Пример page-level Provider для composition modules в React-проекте
---

# Композиция через Provider

Раздел показывает, как page composition может владеть provider, store и business composition, которые нужны layout, screen и другим composition modules.

## Идея

Page composition хранит состояние и композицию бизнес-доменов на уровне страницы. Layout и screen не импортируют друг друга: они получают доступ к page-level данным через публичный API page composition.

В примере `ProfilePageState` — только локальное UI-state страницы. Это не domain state и не product data cache. Доменное состояние описывается business-модулем, а concrete store/query hook передаётся его фабрике через adapter в `compositions/business/{domain}`.

В примере page composition владеет scope-контрактом страницы, но не экспортирует готовый `ProfilePage`, потому что layout и screen импортируют hooks из `pages/profile`. Дерево страницы собирается в отдельном entry-point composition module, который слой `app` только подключает.

## Принципы

1. **Владение.** Page-level store, provider и business composition принадлежат page composition module.
2. **Обычные сегменты.** Provider, hooks, stores и types лежат в обычных сегментах модуля: `providers/`, `hooks/`, `stores/`, `types/`.
3. **Публичный контракт.** Page composition экспортирует только безопасные hooks, provider и типы, которые нужны другим composition modules.
4. **Сборка снаружи business.** Business-модули не используют page-level providers. Page composition вызывает builders из `compositions/business/{domain}` и владеет lifecycle готового графа.
5. **Без deep imports.** Layout и screen импортируют hooks только из public API page composition.

## Структура модулей

```text
compositions/pages/profile/
├── profile-business-composition.ts
├── providers/
│   └── profile-page.provider.tsx
├── hooks/
│   ├── use-profile-page-store.hook.ts
│   └── use-profile-business-composition.hook.ts
├── stores/
│   └── profile-page.store.ts
├── types/
│   └── profile-page-state.type.ts
└── index.ts

compositions/layouts/profile-main/
├── profile-main.layout.tsx
└── index.ts

compositions/screens/profile/
├── profile.screen.tsx
├── ui/
│   ├── profile-error/
│   ├── profile-summary/
│   └── profile-summary-skeleton/
└── index.ts
```

## Тип состояния страницы

Файл: `compositions/pages/profile/types/profile-page-state.type.ts`.

```ts
export type ProfilePageState = {
  title: string
  isSidebarOpen: boolean
  setSidebarOpen: (value: boolean) => void
}
```

## Store страницы

Файл: `compositions/pages/profile/stores/profile-page.store.ts`.

```ts
import { createStore } from 'zustand/vanilla'
import type { ProfilePageState } from '../types/profile-page-state.type'

export const createProfilePageStore = () =>
  createStore<ProfilePageState>((set) => ({
    title: 'Profile',
    isSidebarOpen: false,
    setSidebarOpen: (value) => set({ isSidebarOpen: value }),
  }))
```

`createProfilePageStore` не экспортируется через public API модуля. Это внутренняя деталь создания состояния.

## Business composition страницы

Файл: `compositions/pages/profile/profile-business-composition.ts`.

```ts
import { createAuthBusiness } from '@/compositions/business/auth'
import { createProfileBusiness } from '@/compositions/business/profile'

export const createProfileBusinessComposition = () => {
  const authApi = createAuthBusiness()
  const profileApi = createProfileBusiness({ authApi })

  return { authApi, profileApi }
}
```

Page composition собирает нужный для страницы граф из per-domain builders. Реальные runtime-зависимости остаются в `compositions/business/{domain}`, а не внутри `business`.

Page composition не импортирует SDK, product storage, source hook или raw infra event для дополнительной настройки домена. Такое wiring принадлежит соответствующему integration module.

## Provider страницы

Файл: `compositions/pages/profile/providers/profile-page.provider.tsx`.

```tsx
'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { createProfileBusinessComposition } from '../profile-business-composition'
import { createProfilePageStore } from '../stores/profile-page.store'
import type { ProfilePageState } from '../types/profile-page-state.type'

type ProfileBusinessComposition = ReturnType<typeof createProfileBusinessComposition>

type ProfilePageProviderValue = {
  store: StoreApi<ProfilePageState>
  business: ProfileBusinessComposition
}

export const ProfilePageContext = createContext<ProfilePageProviderValue | null>(null)

type Props = {
  children: ReactNode
}

const createProfilePageProviderValue = (): ProfilePageProviderValue => ({
  store: createProfilePageStore(),
  business: createProfileBusinessComposition(),
})

export const ProfilePageProvider = ({ children }: Props) => {
  const [value] = useState(createProfilePageProviderValue)

  useEffect(() => {
    return value.business.authApi.startSessionInvalidationTracking()
  }, [value.business.authApi])

  return (
    <ProfilePageContext.Provider value={value}>
      {children}
    </ProfilePageContext.Provider>
  )
}
```

Context object остаётся технической деталью provider и не должен использоваться внешними модулями напрямую. Наружу экспортируются hooks доступа.

Lazy initializer может быть повторно вызван React Strict Mode в development. Поэтому store/business constructors не выполняют I/O и не запускают subscriptions. Domain-level lifecycle operations запускаются отдельно в effect и возвращают cleanup.

## Hooks доступа

Файл: `compositions/pages/profile/hooks/use-profile-page-store.hook.ts`.

```ts
'use client'

import { useContext } from 'react'
import { useStore } from 'zustand'
import { ProfilePageContext } from '../providers/profile-page.provider'
import type { ProfilePageState } from '../types/profile-page-state.type'

export const useProfilePageStore = <T,>(selector: (state: ProfilePageState) => T) => {
  const ctx = useContext(ProfilePageContext)

  if (!ctx) {
    throw new Error('useProfilePageStore must be used within ProfilePageProvider')
  }

  return useStore(ctx.store, selector)
}
```

Файл: `compositions/pages/profile/hooks/use-profile-business-composition.hook.ts`.

```ts
'use client'

import { useContext } from 'react'
import { ProfilePageContext } from '../providers/profile-page.provider'

export const useProfileBusinessComposition = () => {
  const ctx = useContext(ProfilePageContext)

  if (!ctx) {
    throw new Error('useProfileBusinessComposition must be used within ProfilePageProvider')
  }

  return ctx.business
}
```

## Layout использует page-level store

Файл: `compositions/layouts/profile-main/profile-main.layout.tsx`.

```tsx
'use client'

import type { ReactNode } from 'react'
import { useProfilePageStore } from '@/compositions/pages/profile'

type Props = {
  children: ReactNode
}

export const ProfileMainLayout = ({ children }: Props) => {
  const title = useProfilePageStore((state) => state.title)
  const isSidebarOpen = useProfilePageStore((state) => state.isSidebarOpen)

  return (
    <div data-sidebar-open={isSidebarOpen}>
      <header>{title}</header>
      <main>{children}</main>
    </div>
  )
}
```

Layout импортирует hook из public API page composition. Он не импортирует screen и не лезет во внутренние файлы `pages/profile`.

## Screen использует business composition

Файл: `compositions/screens/profile/profile.screen.tsx`.

```tsx
'use client'

import { useProfileBusinessComposition } from '@/compositions/pages/profile'
import { ProfileError } from './ui/profile-error'
import { ProfileSummary } from './ui/profile-summary'
import { ProfileSummarySkeleton } from './ui/profile-summary-skeleton'

export const ProfileScreen = () => {
  const { profileApi } = useProfileBusinessComposition()
  const currentProfile = profileApi.useCurrentProfile()

  if (currentProfile.isLoading) {
    return <ProfileSummarySkeleton />
  }

  if (currentProfile.error) {
    return <ProfileError code={currentProfile.error.code} />
  }

  return currentProfile.data ? <ProfileSummary profile={currentProfile.data} /> : null
}
```

Screen получает готовые доменные API из page composition и не собирает граф фабрик самостоятельно. `ProfileSummary` — компонент screen composition, а не часть `business/profile`.

## Публичный API page composition

Файл: `compositions/pages/profile/index.ts`.

```ts
export { ProfilePageProvider } from './providers/profile-page.provider'
export { useProfilePageStore } from './hooks/use-profile-page-store.hook'
export { useProfileBusinessComposition } from './hooks/use-profile-business-composition.hook'

export type { ProfilePageState } from './types/profile-page-state.type'
```

Внутренние `createProfilePageStore`, `createProfileBusinessComposition` и `ProfilePageContext` не экспортируются через public API.

Готовое дерево собирай в отдельном entry-point composition module. Не смешивай в одном public API готовую page composition и hooks, которые импортируют её дочерние layout/screen modules: это может создать runtime-цикл.

## Подключение в app

Entry composition связывает provider, layout и screen:

```tsx
// compositions/entries/profile/profile.entry.tsx
'use client'

import { ProfilePageProvider } from '@/compositions/pages/profile'
import { ProfileMainLayout } from '@/compositions/layouts/profile-main'
import { ProfileScreen } from '@/compositions/screens/profile'

export const ProfileEntry = () => (
  <ProfilePageProvider>
    <ProfileMainLayout>
      <ProfileScreen />
    </ProfileMainLayout>
  </ProfilePageProvider>
)
```

React Router config только подключает готовый entry:

```tsx
import { ProfileEntry } from '@/compositions/entries/profile'

export const profileRoute = {
  path: '/profile',
  element: <ProfileEntry />,
}
```

Для Next App Router создай готовые layout/page entries в `compositions`, а framework files только подключают их.

```tsx
// compositions/entries/profile/profile-layout.entry.tsx
'use client'

import { ProfilePageProvider } from '@/compositions/pages/profile'
import { ProfileMainLayout } from '@/compositions/layouts/profile-main'
import type { ReactNode } from 'react'

export const ProfileLayoutEntry = ({ children }: { children: ReactNode }) => {
  return (
    <ProfilePageProvider>
      <ProfileMainLayout>{children}</ProfileMainLayout>
    </ProfilePageProvider>
  )
}
```

```tsx
// compositions/entries/profile/profile-page.entry.tsx
'use client'

import { ProfileScreen } from '@/compositions/screens/profile'

export const ProfilePageEntry = () => <ProfileScreen />
```

```tsx
// app/(profile)/layout.tsx
import { ProfileLayoutEntry } from '@/compositions/entries/profile'

export default ProfileLayoutEntry
```

```tsx
// app/(profile)/page.tsx
import { ProfilePageEntry } from '@/compositions/entries/profile'

export default ProfilePageEntry
```

`app` размещает готовые entry composition modules по правилам фреймворка, но не реализует product tree внутри себя.
