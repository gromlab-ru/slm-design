# Framework Groups и модули

> Пояснение domain-specific framework-кода, materialized state и RSC boundaries на примере React.

## Связанные правила

- [`SLM-L2-API-R006`](../../rules/level-2.md#slm-l2-api-r006)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-FRAMEWORK-R014`](../../rules/level-2.md#slm-l2-framework-r014)
- [`SLM-L2-FRAMEWORK-R015`](../../rules/level-2.md#slm-l2-framework-r015)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-API-A022`](../../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-STATE-R028`](../../rules/level-2.md#slm-l2-state-r028)

## Framework Group

Папка для domain-specific React binding modules называется `react`:

```text
domains/auth/react/            # Framework Group
├── session/                   # SLM-модуль
│   ├── hooks/
│   ├── providers/
│   └── index.ts
├── queries/                   # SLM-модуль
│   └── index.ts
└── login-form/                # SLM-модуль
    ├── components/
    └── index.ts
```

`react` является Group, а не модулем. У неё нет `index.ts`, реализации, state, lifecycle или агрегирующего API. Если пакет поддерживает Vue, рядом появляется отдельная Group `vue`.

Каждый прямой дочерний каталог является обычным SLM-модулем со своей ответственностью, публичным API и узлом графа.

## Framework binding module

Модуль принадлежит Framework Group, если его самостоятельная ответственность состоит в связывании готового Domain API своего домена с конкретным framework.

Framework binding может:

- передавать готовый API через Provider и context;
- предоставлять domain-specific hooks;
- хранить framework projection в query cache или store;
- отображать public models, outcomes и domain errors;
- реализовывать SSR prefetch и client hydration;
- реализовывать переиспользуемую domain-specific форму или guard;
- связывать framework lifecycle с явной realtime subscription.

Он не вызывает `api/factory` или assembly, не выбирает adapters, не импортирует SDK предметного external source и не определяет новые предметные операции.

Framework binding импортирует consumer types и deterministic runtime через разные фасеты:

```ts
import type {
  AuthError,
  AuthSessionApi,
} from '@/domains/auth/api'

import {
  isAuthError,
} from '@/domains/auth/api/runtime'
```

Импорты `api/ports`, `api/factory` и `adapters/*` запрещены.

## Готовый API

`auth/react/session` может владеть Provider для уже созданного `AuthSessionApi`:

```tsx
'use client'

type AuthSessionProviderProps = PropsWithChildren<{
  api: AuthSessionApi
}>

export const AuthSessionProvider = ({
  api,
  children,
}: AuthSessionProviderProps) => {
  return (
    <AuthSessionContext.Provider value={api}>
      {children}
    </AuthSessionContext.Provider>
  )
}
```

Публичный путь модуля:

```ts
import {
  AuthSessionProvider,
  useAuthApi,
} from '@/domains/auth/react/session'
```

Импорт `@/domains/auth/react` запрещён, потому что Group не имеет API.

## Query и store projection

`auth/react/queries` может использовать TanStack Query, SWR, Zustand или другой React runtime поверх готового API:

```ts
export const useAuthSessionQuery = () => {
  const api = useAuthApi()

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: api.getSession,
  })
}
```

Query keys, stale time, pending status и hydration принадлежат binding. Значения и ошибки поступают через Domain API. Framework types не становятся частью `AuthSessionApi`.

Framework projection не импортируется другим доменом. Cross-domain UI собирается в `compositions`.

## Realtime binding

Binding может запускать subscription готового API в framework lifecycle:

```text
component/provider scope
  → Domain API subscribe
  → verified domain events
  → query invalidation or API-owned projection
  → cleanup on scope end
```

Binding не импортирует WebSocket client и не разбирает frames. После cleanup он не принимает late callbacks. Если reconnect создаёт gap, binding обрабатывает публичный `RESYNC_REQUIRED` outcome и повторно загружает snapshot через Domain API.

## Domain-specific UI

`auth/react/login-form` может владеть переиспользуемой формой, если она работает только с Auth API, public models и errors своего домена. Она может использовать публичный API соседнего `auth/react/session`, если статический граф остаётся ацикличным.

Конкретная страница, продуктовый текст, layout, redirect и выбор маршрута принадлежат `compositions`. Domain API может вернуть `AUTH_REQUIRED`, но переход на `/login` выбирает composition.

## Framework-only SDK

SDK, доступный только через Provider, hook или component, может использоваться binding для получения opaque operation input:

```text
CAPTCHA React component
  → opaque token
  → AuthApi command
```

Binding не использует SDK для самостоятельной предметной операции, не превращает SDK response в public domain model и не экспортирует SDK type через Domain API. Если SDK предоставляет reusable technical UI без предметной модели, его generic integration может принадлежать `infra` и `ui`, а composition связывает её с доменом.

## Запрет cross-domain framework imports

Framework binding module не импортирует hooks, contexts, Providers, stores или components другого домена:

```ts
// Недопустимо: domains/user/react/profile
import {
  useAuthSessionQuery,
} from '@/domains/auth/react/queries'
```

Cross-domain UI собирается в `compositions`:

```tsx
const session = useAuthSessionQuery()

return (
  <UserProfile
    userId={session.data?.userId}
  />
)
```

Если User Domain API постоянно нуждается в Auth, готовый `AuthSessionApi` передаётся User assembly при сборке runtime-графа. User framework binding работает уже со своим API.

## SSR, RSC и client boundary

Server prefetch и client hooks могут принадлежать разным modules Framework Group с совместимыми entry points. Они не разделяют API instance или mutable cache:

```text
server binding
  → server API instance
  → prefetch
  → hydration payload

client binding
  → client API instance
  → hydrate
  → rendering
```

Server Component не передаёт API object в Client Component. Client reference и Server Action reference объявляются checker-у отдельно от executable imports. Если Client Component участвует в SSR или prerender, его server render graph проверяется отдельно от browser hydration graph; browser-only capability используется только через объявленную framework-deferred boundary.

## Публичные API

```ts
import {
  AuthSessionProvider,
} from '@/domains/auth/react/session'

import {
  useAuthSessionQuery,
} from '@/domains/auth/react/queries'

import {
  LoginForm,
} from '@/domains/auth/react/login-form'
```

Framework Group не реэкспортирует дочерние модули. Это сохраняет независимые ответственности и не превращает `react` в скрытый корневой модуль домена.
