---
title: Business composition
description: Пример runtime-сборки business-фабрик в compositions/business
---

# Business composition

`compositions/business/{domain}` — composition module, который собирает конкретную business-фабрику с реальными runtime-зависимостями приложения.

Этот модуль не является бизнес-доменом. Он находится на слое `compositions`, потому что связывает `business`, `infra`, SDK, storage, browser API и другие внешние runtime-источники.

Это единственная integration-зона concrete product dependencies. Page, layout, screen и widget не импортируют SDK/client/storage напрямую и получают product data только через готовый `{Domain}Api`.

## Структура

```text
src/compositions/business/
├── auth/
│   ├── create-auth-business.ts
│   ├── create-auth-business.test.ts
│   ├── adapters/
│   │   ├── phone-auth.adapter.ts
│   │   ├── session.adapter.ts
│   │   ├── auth-session-events.adapter.ts
│   │   └── zustand-auth-state.adapter.ts
│   └── index.ts
├── user/
│   ├── create-user-business.ts
│   ├── create-user-business.test.ts
│   ├── adapters/
│   │   ├── user-profile.adapter.ts
│   │   └── user-storage.adapter.ts
│   ├── types/
│   │   └── create-user-business-deps.type.ts
│   └── index.ts
└── content/
    ├── create-content-business.ts
    ├── create-content-business.test.ts
    ├── adapters/
    │   └── content-api.adapter.ts
    └── index.ts
```

Если business-домены сгруппированы, `compositions/business` повторяет тот же относительный путь. Например: `business/app/auth` соответствует `compositions/business/app/auth`, `business/cms/content` соответствует `compositions/business/cms/content`.

Сегменты добавляются только по необходимости, но каждая concrete business dependency всегда оформляется отдельным файлом в `adapters/`. Не оставляй короткий adapter inline внутри builder.

## Ответственность

`compositions/business/{domain}` отвечает за adapter composition:

- создаёт или получает внешние клиенты из `infra`;
- отдельными adapters адаптирует SDK, API, storage, source/query hooks, state managers, events и browser API к `deps` business-модуля;
- вызывает business-фабрику;
- принимает API других business-модулей, если текущий домен зависит от них;
- экспортирует готовый `{Domain}Api` через builder-функцию;
- тестирует сборку и корректность адаптеров.

`compositions/business/{domain}` не должен содержать доменную логику. Если код описывает бизнес-правило, маппинг доменной модели, доменную ошибку или сценарий, он должен жить в соответствующем `business`-модуле.

`compositions/business/{domain}` не должен содержать React-компоненты, layouts, guards, providers и page-level wrappers. Применение logic API в React tree выполняется в обычных composition modules страниц, layouts, screens или widgets.

Builder не реализует dependencies inline. Он явно создаёт scoped runtime instances без I/O, создаёт adapters поверх них и передаёт adapters фабрике.

## Business-контракт

Business-модуль объявляет dependency contract.

```ts
// business/auth/types/auth-deps.type.ts
import type { AuthState } from './auth-state.type'
import type { VerifyPhoneCodeData } from './verify-phone-code-data.type'

export type AuthDeps = {
  phoneAuth: {
    requestCode: (phone: string) => Promise<unknown>
    resendCode: (challengeId: string) => Promise<unknown>
    verifyCode: (data: VerifyPhoneCodeData) => Promise<unknown>
  }
  session: {
    setToken: (token?: string | null) => void
    useToken: () => string | null | undefined
  }
  sessionEvents: {
    onInvalidated: (listener: () => void) => () => void
  }
  state: {
    create: (initialState: AuthState) => {
      get: () => AuthState
      set: (state: AuthState) => void
      useState: () => AuthState
    }
  }
}
```

Business-модуль не знает, через какой SDK, backend или storage реализованы эти возможности.

## Adapter composition

Composition-адаптер знает про конкретный runtime и приводит его к business-контракту.

```ts
// compositions/business/auth/adapters/phone-auth.adapter.ts
import type { AuthDeps } from '@/business/auth'
import type { AuthApiClient } from '@/infra/backend-api'

export const createPhoneAuthAdapter = (authApiClient: AuthApiClient): AuthDeps['phoneAuth'] => ({
  requestCode: (phone) => {
    return authApiClient.authOtp.phoneStart({ body: { phone } })
  },
  resendCode: (challengeId) => {
    return authApiClient.authOtp.phoneResend({ body: { challengeId } })
  },
  verifyCode: (data) => {
    return authApiClient.authOtp.phoneVerify({ body: data })
  },
})
```

Адаптер не формирует доменные ошибки и не выбирает доменный `code`. Он может вернуть результат внешнего вызова или пробросить ошибку dependency. Решение о доменном коде принимает business-модуль.

Плохо:

```ts
export const createVerifyPhoneCode = (
  authApiClient: AuthApiClient,
): AuthDeps['phoneAuth']['verifyCode'] => async (data) => {
  try {
    return await authApiClient.authOtp.phoneVerify({ body: data })
  } catch (error) {
    throw new AuthBusinessError('AUTH_PHONE_CODE_VERIFY_FAILED', error)
  }
}
```

Проблема: composition-адаптер начал владеть доменной ошибкой.

Хорошо:

```ts
export const createVerifyPhoneCode = (
  authApiClient: AuthApiClient,
): AuthDeps['phoneAuth']['verifyCode'] => (data) => {
  return authApiClient.authOtp.phoneVerify({ body: data })
}
```

## State adapter

Доменное состояние принадлежит business-контракту, но concrete state manager остаётся снаружи business.

```ts
// compositions/business/auth/adapters/zustand-auth-state.adapter.ts
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { AuthDeps, AuthState } from '@/business/auth'

export const authStateAdapter: AuthDeps['state'] = {
  create: (initialState) => {
    const store = createStore<AuthState>()(() => initialState)

    return {
      get: store.getState,
      set: (state) => store.setState(state),
      useState: () => useStore(store),
    }
  },
}
```

`authFactory` выбирает initial domain state и вызывает `deps.state.create(initialState)`. Он не импортирует Zustand и не раскрывает `StoreApi` через public contract. Adapter только создаёт concrete store с переданным состоянием и не выбирает доменную политику.

Для SWR, TanStack Query и других source hooks действует то же правило: adapter реализует business-owned hook contract, business wrapper нормализует `data`, заменяет source `error` собственной domain error и возвращает собственный result type.

## Lifecycle adapter

External event также передаётся через business-owned contract.

```ts
// compositions/business/auth/adapters/auth-session-events.adapter.ts
import type { AuthDeps } from '@/business/auth'
import { onAuthSessionInvalidated } from '@/infra/backend-api'

export const authSessionEventsAdapter: AuthDeps['sessionEvents'] = {
  onInvalidated: onAuthSessionInvalidated,
}
```

Business API предоставляет domain-level operation `startSessionInvalidationTracking()`. Внутри business она вызывает `deps.sessionEvents.onInvalidated`, выполняет доменный state transition и возвращает cleanup wrapper. Ошибки регистрации, callback и cleanup заменяются `AuthBusinessError`.

Graph owner запускает operation после commit и вызывает возвращённый cleanup при unmount, как показано в полном provider ниже. Provider не импортирует raw infra event и не связывает его с business command самостоятельно.

## Builder одного домена

Builder собирает одну business-фабрику.

```ts
// compositions/business/auth/create-auth-business.ts
import { authFactory } from '@/business/auth'
import { createBackendApiClient } from '@/infra/backend-api'
import { authSessionEventsAdapter } from './adapters/auth-session-events.adapter'
import { authStateAdapter } from './adapters/zustand-auth-state.adapter'
import { createPhoneAuthAdapter } from './adapters/phone-auth.adapter'
import { createSessionAdapter } from './adapters/session.adapter'

export const createAuthBusiness = () => {
  const authApiClient = createBackendApiClient()

  return authFactory({
    phoneAuth: createPhoneAuthAdapter(authApiClient),
    session: createSessionAdapter(),
    sessionEvents: authSessionEventsAdapter,
    state: authStateAdapter,
  })
}
```

Browser/application builder без cross-domain зависимостей вызывается без аргументов. Он явно создаёт runtime instances и передаёт их private adapter factories. Client/adapter constructors не выполняют I/O, не читают storage/env неявно и не запускают subscriptions; lifecycle каждого instance соответствует lifecycle builder result.

Request-scoped builder принимает отдельный `requestScopeInput` только с request data, а concrete client factory импортирует сам. Не используй application singleton для request credentials, cookies или tenant context.

## Cross-domain зависимости

Если один business-модуль зависит от API другого business-модуля, builder принимает уже собранный API.

```ts
// compositions/business/user/types/create-user-business-deps.type.ts
import type { AuthApi } from '@/business/auth'

export type CreateUserBusinessDeps = {
  authApi: Pick<AuthApi, 'useAuth'>
}
```

```ts
// compositions/business/user/create-user-business.ts
import { userFactory } from '@/business/user'
import { createBackendApiClient } from '@/infra/backend-api'
import { createUserProfileAdapter } from './adapters/user-profile.adapter'
import { createUserStorageAdapter } from './adapters/user-storage.adapter'
import type { CreateUserBusinessDeps } from './types/create-user-business-deps.type'

export const createUserBusiness = (deps: CreateUserBusinessDeps) => {
  const apiClient = createBackendApiClient()

  return userFactory({
    authApi: deps.authApi,
    profile: createUserProfileAdapter(apiClient),
    storage: createUserStorageAdapter(),
  })
}
```

Правила:

- сначала создаются независимые домены;
- затем создаются домены, которым нужны API уже созданных доменов;
- browser/application builder deps содержат только API других business-фабрик;
- request-scoped builder отделяет cross-domain API от `requestScopeInput` с request data;
- зависимость сужается через `Pick`, если нужен один метод;
- циклические runtime-зависимости между business API запрещены;
- если появляется цикл, нужно пересмотреть границы доменов или вынести общий сценарий в отдельный домен.

## Сборка графа в месте использования

Конечный граф создаётся там, где понятен lifecycle: page provider, route composition, application-lifetime composition provider, request scope или test setup. Слой `app` только подключает готовую composition.

```tsx
// compositions/routes/profile/providers/profile-business.provider.tsx
'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
import { createAuthBusiness } from '@/compositions/business/auth'
import { createUserBusiness } from '@/compositions/business/user'

type ProfileBusiness = {
  authApi: ReturnType<typeof createAuthBusiness>
  userApi: ReturnType<typeof createUserBusiness>
}

export const ProfileBusinessContext = createContext<ProfileBusiness | null>(null)

const createProfileBusiness = (): ProfileBusiness => {
  const authApi = createAuthBusiness()
  const userApi = createUserBusiness({ authApi })

  return { authApi, userApi }
}

export const ProfileBusinessProvider = ({ children }: { children: ReactNode }) => {
  const [business] = useState(createProfileBusiness)

  useEffect(() => {
    return business.authApi.startSessionInvalidationTracking()
  }, [business.authApi])

  return (
    <ProfileBusinessContext.Provider value={business}>
      {children}
    </ProfileBusinessContext.Provider>
  )
}
```

Route-level `ProfileBusinessProvider` владеет lifecycle graph. `compositions/business/*` только предоставляет чистые функции сборки. React Strict Mode может повторно вызвать lazy initializer в development, поэтому factory, builder и adapter constructors не выполняют I/O и не запускают subscriptions.

Graph owner импортирует builders, но не raw SDK/client/event bus для «досборки» конкретного домена. Если external event влияет на domain state, event subscription является частью `{Domain}Deps`; business API предоставляет domain-level lifecycle operation, которую provider запускает в effect и cleanup которой вызывает при unmount. Registration и cleanup errors преобразуются business-модулем в domain errors.

## Public API

`index.ts` composition-модуля экспортирует builder и type-only deps, если builder зависит от других business API.

```ts
// compositions/business/auth/index.ts
export { createAuthBusiness } from './create-auth-business'
```

```ts
// compositions/business/user/index.ts
export { createUserBusiness } from './create-user-business'

export type { CreateUserBusinessDeps } from './types/create-user-business-deps.type'
```

Не экспортируй из public API:

- внутренние SDK-клиенты;
- generated operation trees;
- private adapters;
- test mocks;
- helpers, которые нужны только для сборки.

Если адаптер нужен нескольким composition-модулям, сначала проверь, не является ли это infra-сервисом. Не поднимай адаптер в `shared` только ради удобного импорта.

## Как не превратить сборку в кашу

Признаки плохой сборки:

- один файл создаёт все API-клиенты, все dependency-адаптеры и все фабрики;
- рядом лежат unrelated helpers для разных доменов;
- dependency-адаптеры смешаны с domain mappers;
- Zustand/SWR/SDK logic написана прямо внутри builder;
- graph owner напрямую связывает raw infra event с business command;
- business-правила реализованы в `compositions/business`;
- public API экспортирует внутренние адаптеры;
- невозможно протестировать сборку одного домена отдельно.

Что делать вместо этого:

- один домен runtime-сборки — один composition module;
- dependency-адаптеры держать рядом с конкретной сборкой домена;
- большие dependency-адаптеры выносить в `adapters/`;
- типы сборщика выносить в `types/`, если они перестали быть локальными;
- доменные mappers оставлять в `business/{domain}/mappers`;
- тестировать сборку домена отдельно от полной сборки приложения.

## Тестирование сборки

Тесты `compositions/business/{domain}` не заменяют factory-level тесты business-модуля.

Они проверяют только composition-риск:

- правильные dependency-адаптеры переданы в фабрику;
- API другой фабрики передан в нужном виде;
- SDK operation вызывается с ожидаемым payload;
- storage/browser adapter соответствует dependency-контракту;
- state/query adapter соответствует business-owned contract и не раскрывает library types;
- сборка не делает запросы во время создания business API;
- client/adapter constructors не выполняют import-time I/O, storage access или subscriptions;
- lifecycle operation запускается владельцем scope и вызывает cleanup;
- минимальный API-клиент не тянет лишние generated-операции.

Factory-level поведение самого домена тестируется в `business/{domain}/tests/{domain}-factory`.

## Чеклист

- Runtime-сборка находится в `compositions/business/{domain}`.
- Business-модуль не импортирует реальные SDK, API или storage.
- Dependency-адаптер реализован на composition-слое.
- State/query runtime реализован adapter-ом, а не импортирован business-модулем.
- Файлы внутри модуля сборки разнесены по ответственности.
- Runtime-зависимости между доменами передаются через builder deps.
- Builder deps содержат только API других собранных business-фабрик.
- Request-scoped builder отделяет cross-domain API от `requestScopeInput`.
- Public API composition-модуля не раскрывает internal adapters.
- Builder не содержит inline integration logic.
- Lifecycle operation запускается после commit и имеет cleanup.
- Сборка покрыта тестами на корректность связки deps и адаптеров.
- Business-поведение покрыто factory-level тестами в business-модуле.
