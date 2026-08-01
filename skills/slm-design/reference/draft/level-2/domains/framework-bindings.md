# Framework Groups и модули

> Пояснение domain-specific framework-кода на примере React.

## Связанные правила

- [`SLM-L2-BUSINESS-R006`](../../rules/level-2.md#slm-l2-business-r006)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-FRAMEWORK-R014`](../../rules/level-2.md#slm-l2-framework-r014)
- [`SLM-L2-FRAMEWORK-R015`](../../rules/level-2.md#slm-l2-framework-r015)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

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

`react` является Group, а не модулем. У неё нет `index.ts`, состояния, реализации, lifecycle или агрегирующего API. Если пакет поддерживает Vue, рядом появляется отдельная Group `vue`.

Каждый прямой дочерний каталог является обычным SLM-модулем со своей ответственностью, публичным API и узлом графа. Он не является вложенным модулем, потому что родительская граница `react` является Group.

## Framework binding module

Модуль принадлежит Framework Group, если его самостоятельная ответственность состоит в связывании одного или нескольких готовых Domain API своего домена с конкретным framework. Сам факт зависимости от framework недостаточен: framework-specific assembly остаётся в `assemblies`, а page-specific модуль остаётся в `compositions`.

Framework binding module может:

- передавать готовые API через Provider и context;
- предоставлять domain-specific hooks;
- отображать состояние и безопасные ошибки домена;
- использовать framework-compatible state/query runtime;
- реализовывать переиспользуемую domain-specific форму или guard;
- связывать framework lifecycle с явными операциями Domain API.

Он не вызывает business-фабрику или assembly, не выбирает adapters и не создаёт новые предметные сценарии.

Framework binding импортирует типы и deterministic runtime через разные фасеты:

```ts
import type {
  AuthError,
  AuthSessionApi,
} from '@/domains/auth/business'

import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/runtime'
```

Импорт `business/factory` запрещён: готовые API передаются модулю извне.

## Модуль session

`auth/react/session` может владеть Provider и hooks доступа к уже созданному `AuthSessionApi`:

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
  useAuthSession,
} from '@/domains/auth/react/session'
```

Импорт `@/domains/auth/react` запрещён, потому что Group не имеет API.

## State/query runtime

`auth/react/queries` может использовать TanStack Query, SWR или другой React runtime поверх готового `AuthSessionApi`. Query cache остаётся framework projection, пока данные и transitions проходят через API, а optimistic values создаются или проверяются business-владельцем.

```ts
export const useAuthSessionQuery = () => {
  const api = useAuthSession()

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: api.getCurrentSession,
  })
}
```

Server prefetch и client hook могут быть разными модулями Framework Group с совместимыми environment markers. Общая query policy выносится в отдельный framework-модуль при наличии нескольких потребителей, а не дублируется в compositions.

Подробности описаны в [Состоянии и кэше](./state-cache.md).

## Модуль login-form

`auth/react/login-form` может владеть переиспользуемой формой, если она работает только с Auth API, состоянием и ошибками своего домена. Она может использовать публичный API соседнего `auth/react/session`, если зависимость остаётся ацикличной.

Конкретная страница, продуктовый текст, layout, redirect и выбор маршрута принадлежат `compositions`. Domain-owned guard может решить, разрешено ли действие, но политика перехода на `/login` остаётся у route composition.

## Запрет cross-domain framework imports

Framework binding module не импортирует hooks, contexts, Providers, components или framework state другого домена:

```ts
// Недопустимо: domains/user/react/profile
import { useAuthSession } from '@/domains/auth/react/session'
```

Cross-domain UI собирается в `compositions`:

```tsx
const session = useAuthSession()

return (
  <UserProfile
    userId={session.userId}
    canEdit={session.isAuthenticated}
  />
)
```

Передача через props является границей композиции, но не требует prop drilling внутри домена: каждый пакет может использовать собственный Provider и context. Если User business постоянно нуждается в Auth, готовый `AuthSessionApi` передаётся User factory при сборке графа, а User framework module работает уже со своим API.

## Публичные API

```ts
import { AuthSessionProvider } from '@/domains/auth/react/session'
import { LoginForm } from '@/domains/auth/react/login-form'
```

Framework Group не реэкспортирует дочерние модули. Это сохраняет независимые ответственности и не превращает `react` в скрытый корневой модуль домена.
