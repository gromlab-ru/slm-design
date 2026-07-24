# Реорганизация Business-модуля

> Статус: proposal для обсуждения. Это не принятый канон и не инструкция для механической миграции.

## Решение, которое нужно принять

`business/{domain}` должен быть вертикальным продуктовым модулем, а не только чистым источником доменных данных.

Один business-модуль владеет:

- доменной моделью, правилами, сценариями и ошибками;
- доменным состоянием и его переходами;
- адаптацией внешних возможностей к потребностям домена;
- React hooks, Provider и UI, выражающими один домен;
- отдельными server/client entrypoints, когда этого требует runtime Next.js.

React не является причиной вынести domain hooks, store или domain UI в `compositions`. Он является входным runtime-адаптером того же домена.

`compositions` остаётся местом, где связываются несколько доменов, выбирается scope graph и собирается page/route UI. Но он не становится владельцем `useAuth`, `AuthProvider`, `LoginForm` или domain store.

## Почему текущая модель не подходит

Logic-only business делит один домен по технической природе файлов:

```text
business/auth                  # types, factory, scenarios
compositions/business/auth     # concrete runtime adapters
compositions/pages/login       # provider, hooks, domain UI
```

В результате у `auth` нет одной физической и понятной границы. Доменное поведение, его runtime, доступ из React и UI существуют отдельно, хотя меняются совместно.

Особенно проблемны следующие свойства.

1. Hooks остаются частью public API domain, но их React execution model прячется за `deps`. Business формально не импортирует React, но API всё равно нельзя вызвать из Server Component, обычной функции или теста без React render context.
2. Domain state имеет трёх владельцев: модель и transitions в `business`, concrete store в integration composition, instance и lifecycle в page Provider. Невозможно коротко ответить, где находится `auth`.
3. Правило «единственный runtime export - фабрика» защищает от обхода DI, но одновременно запрещает безопасные domain hooks, Provider и компоненты. Оно ограничивает форму public API вместо утечки реализации.
4. Разделение server/client - это граница module graph и runtime, а не две разные продуктовые ответственности. Перенос client-кода в `compositions` не решает границу, а скрывает её.
5. Consumer composition вынужден знать, как React подключается к домену, хотя это часть внутренней реализации domain runtime.

Цель реорганизации - вернуть business-модулю вертикальное владение, не потеряв полезные инварианты текущей модели: ports, domain errors, DI, минимальные API, lifecycle и отсутствие runtime-циклов.

## Новое определение Business-модуля

> Business-модуль - минимальная вертикальная граница продуктового домена. Он создаёт domain runtime через фабрику и предоставляет этому runtime несколько явных интерфейсов: обычный TypeScript API, React API и при необходимости server API.

Это один модуль и один owner. Внутри него допустимы несколько зон с разными правилами зависимостей.

```text
business/auth/
├── kernel/                     # доменная логика без React и concrete runtime
├── adapters/                   # реализации исходящих ports
├── react/                      # client-only React API домена
├── server/                     # server-only сборка, только при необходимости
├── auth.factory.ts             # создание domain runtime
├── index.ts                    # universal public API
├── react.ts                    # client-only public entrypoint
└── server.ts                   # server-only public entrypoint, optional
```

`kernel`, `adapters`, `react` и `server` - зоны ответственности внутри одного business-модуля. Они не являются новыми SLM-слоями и не должны автоматически появляться во всех доменах.

## Зоны и зависимости

### Kernel

`kernel/` содержит то, что определяет домен независимо от платформы:

- domain types и value objects;
- domain errors со стабильными `code`;
- правила, validators, normalizers и mappers;
- use cases, commands, queries и selectors;
- модель domain state, transitions и initial state;
- контракты исходящих ports.

`kernel` не импортирует:

- React, Next.js, browser API;
- SDK, HTTP client, storage implementation;
- Zustand, Redux, SWR, TanStack Query и другие concrete runtimes;
- `compositions`, `app` или UI.

Именно kernel делает business runtime переносимым между server, browser и test environment.

### Factory

Фабрика остаётся единственным способом создать instance domain runtime. Она принимает минимальный набор ports и возвращает поведение домена.

```ts
export type AuthPorts = {
  session: {
    getCurrent: () => Promise<unknown>
    signIn: (input: SignInInput) => Promise<unknown>
    signOut: () => Promise<void>
  }
  tokenStorage: {
    read: () => string | null
    write: (token: string | null) => void
  }
}

export type AuthRuntime = {
  getCurrentUser: () => Promise<User | null>
  signIn: (input: SignInInput) => Promise<Session>
  signOut: () => Promise<void>
  getSnapshot: () => AuthState
  subscribe: (listener: () => void) => () => void
}

export const authFactory = (ports: AuthPorts): AuthRuntime => {
  // Создаёт domain state, commands, queries и selectors.
}
```

Фабрика:

- не создаёт HTTP client, browser storage или query client;
- не запускает I/O, subscriptions или timers при создании instance;
- не импортирует React;
- не возвращает raw store, raw context, SDK client или adapter;
- может возвращать methods, selectors, subscriptions и другие framework-neutral runtime operations.

Фабрика не обязана быть единственным runtime export модуля. Она является единственным местом создания business runtime.

### Adapters

`adapters/` реализует исходящие ports kernel поверх конкретной технологии:

```text
business/auth/adapters/
├── auth-api.adapter.ts
├── browser-token-storage.adapter.ts
└── server-token-storage.adapter.ts
```

Адаптер нужен, когда concrete dependency не соответствует domain port или должен остаться внутренней деталью домена.

```ts
export const createAuthSessionAdapter = (
  apiClient: AuthApiClient,
): AuthPorts['session'] => ({
  getCurrent: () => apiClient.auth.getCurrentSession(),
  signIn: (input) => apiClient.auth.signIn({ body: input }),
  signOut: () => apiClient.auth.signOut(),
})
```

Назначение адаптера не в том, чтобы «упростить вызов фабрики». Он сохраняет границу:

- kernel знает потребность домена, а не форму SDK;
- transport payload и вызов конкретного API не становятся business contract;
- browser и server могут реализовать один port по-разному;
- замена SDK, storage или event runtime не требует менять kernel.

Адаптер:

- импортирует port type из kernel и concrete `infra` dependency;
- преобразует domain input в transport input;
- возвращает raw result или source error в kernel для нормализации и error mapping;
- не формирует domain model, domain error или fallback;
- не экспортируется из public entrypoint.

Адаптер не является обязательным ритуалом. Если конкретная dependency уже точно реализует domain port и не протекает через public API, её можно передать фабрике напрямую. Не нужно создавать файл-обёртку из одной строки без адаптации или runtime-границы.

Domain-specific adapter живёт рядом с доменом, потому что только он знает, какой endpoint или storage key реализует именно `AuthPorts`. Общий технический client, transport, logger или storage primitive остаётся в `infra`.

### React

`react/` - client-only входной адаптер domain runtime. Он содержит:

- закрытый Context;
- Provider, принимающий или создающий текущий `AuthRuntime`;
- access hooks, например `useAuthRuntime`;
- domain hooks, например `useAuth`, `useCurrentUser`, `usePermissions`;
- client state/query integration, если она выражает доменное состояние;
- domain-specific interactive UI, например `LoginForm` и `LogoutButton`.

```text
business/auth/react/
├── auth.provider.tsx
├── hooks/
│   ├── use-auth-runtime.ts
│   ├── use-auth.ts
│   └── use-current-user.ts
├── ui/
│   ├── login-form.tsx
│   └── logout-button.tsx
└── create-auth-browser-runtime.ts
```

React-код может импортировать kernel, factory и client-specific adapters. Обратный импорт запрещён:

```text
react → factory → kernel
react → browser adapter → infra
kernel -/→ react
factory -/→ react
```

Provider связывает статически экспортируемый React API с конкретным instance, созданным фабрикой:

```tsx
'use client'

const AuthRuntimeContext = createContext<AuthRuntime | null>(null)

export function AuthProvider({
  runtime,
  children,
}: {
  runtime: AuthRuntime
  children: ReactNode
}) {
  return (
    <AuthRuntimeContext.Provider value={runtime}>
      {children}
    </AuthRuntimeContext.Provider>
  )
}
```

```ts
export function useAuthRuntime(): AuthRuntime {
  const runtime = useContext(AuthRuntimeContext)

  if (!runtime) {
    throw new Error('AuthProvider is missing')
  }

  return runtime
}
```

```ts
export function useCurrentUser() {
  const auth = useAuthRuntime()

  return useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: auth.getCurrentUser,
  })
}
```

`useCurrentUser` принадлежит `auth`, хотя использует Query runtime: он выражает доменное понятие и работает только с `AuthRuntime`. Он не вызывает SDK и не выполняет domain normalization самостоятельно.

Компоненты из `react/ui/` могут вызывать hooks своего домена и использовать универсальные компоненты из `ui`. Они не должны:

- напрямую обращаться к SDK, storage или browser API;
- реализовывать business rule, error mapping или нормализацию;
- импортировать runtime другого домена;
- собирать UI из нескольких доменов.

Например, `LoginForm` принадлежит `auth`; `CheckoutHeader`, объединяющий `auth`, `cart` и `orders`, принадлежит composition module.

### Server

`server/` - optional зона для server-only assembly домена. Она нужна только если у домена действительно есть server-specific ports или запросный scope.

```text
business/auth/server/
└── create-auth-server-runtime.ts
```

Server builder создаёт новый runtime на request scope и передаёт в фабрику server adapters:

```ts
import 'server-only'

export function createAuthServerRuntime(
  input: AuthServerScopeInput,
): AuthRuntime {
  return authFactory({
    session: createServerSessionAdapter(input),
    tokenStorage: createRequestTokenStorageAdapter(input),
  })
}
```

`server/` не импортирует `react/`, а `react/` не импортирует `server/`. Два runtime создаются над одной factory/kernel, но имеют разные lifecycle и concrete ports.

Создавать `server/` симметрично в каждом домене не нужно. Если server использует только universal factory с явно переданными testable ports, отдельный entrypoint не добавляется.

## Public entrypoints

Ограничивать public API только фабрикой не нужно. Следует разделять public entrypoints по runtime, чтобы Next.js мог построить корректные module graphs.

```ts
// business/auth/index.ts
export { authFactory } from './auth.factory'

export type {
  AuthPorts,
  AuthRuntime,
  AuthState,
  SignInInput,
  User,
} from './kernel'
```

```ts
// business/auth/react.ts
'use client'

export { AuthProvider } from './react/auth.provider'
export { useAuth, useAuthRuntime, useCurrentUser } from './react/hooks'
export { LoginForm, LogoutButton } from './react/ui'
export { createAuthBrowserRuntime } from './react/create-auth-browser-runtime'
```

```ts
// business/auth/server.ts
import 'server-only'

export { createAuthServerRuntime } from './server/create-auth-server-runtime'
export type { AuthServerScopeInput } from './server/auth-server-scope-input.type'
```

Правила:

- `index.ts` не импортирует и не реэкспортирует `react` или `server`;
- `react.ts` является client entrypoint и не импортирует `server`;
- `server.ts` является server entrypoint и не импортирует `react`;
- public API может содержать стабильные pure functions, factory, hooks, Provider и domain UI в соответствующем entrypoint;
- public API не раскрывает raw context, raw store, mutable singleton, persistence key, SDK client или private adapter;
- каждый runtime export имеет реального внешнего consumer.

Это не ослабление encapsulation. Оно заменяет запрет «runtime export вообще» на полезный запрет «не раскрывай concrete mutable implementation и не смешивай runtime graphs».

## SSR и RSC

Разделение entrypoints существует для Next.js module graph, а не для разделения business ownership.

```text
Server Component
  → @/business/auth/server или @/business/auth
  → authFactory
  → server ports/adapters

Client Component
  → @/business/auth/react
  → AuthProvider + hooks + UI
  → browser runtime
  → authFactory
  → browser ports/adapters
```

Один `AuthRuntime` нельзя передавать из Server Component в Client Component: он содержит functions и не сериализуется через RSC. Через границу передаются только serializable domain data, например `AuthSnapshot`, `User` или initial form state.

Server runtime:

- создаётся на request scope;
- получает headers, cookies, request ID и abort signal только через server input/adapters;
- не становится module singleton;
- не использует browser storage или React state.

Browser runtime:

- создаётся на Provider или client graph scope;
- не использует request credentials другого пользователя;
- не запускает I/O, subscriptions или timers во время module import;
- получает server bootstrap data только как serializable input.

Провайдер может принимать готовый browser runtime. Convenience API, который создаёт runtime внутри Provider, допустим только если constructor side-effect free и lifecycle явно определён. Этот выбор нужно проверить на полном примере до фиксации канона.

## Роль Compositions после реорганизации

`compositions` не владеет domain hooks, domain Provider, domain UI или domain adapters. Он отвечает за связи между модулями:

- собирает граф из нескольких готовых domain runtimes;
- выбирает application, route, page или request scope;
- передаёт суженные cross-domain dependencies при создании runtime;
- монтирует domain Providers в нужной точке React tree;
- реализует UI и orchestration, объединяющие несколько доменов;
- владеет page-local presentation state.

```tsx
const authRuntime = createAuthBrowserRuntime()
const profileRuntime = createProfileBrowserRuntime({
  auth: pickAuthForProfile(authRuntime),
})

return (
  <AuthProvider runtime={authRuntime}>
    <ProfileProvider runtime={profileRuntime}>
      <ProfilePage />
    </ProfileProvider>
  </AuthProvider>
)
```

Это не означает, что composition реализует `AuthProvider` или `useAuth`: она только использует public React API домена и создаёт graph в scope, который реально им владеет.

## State и lifecycle

Нужно различать три разные ответственности.

| Ответственность | Владелец |
|---|---|
| Модель state, transitions, selectors, commands | kernel домена |
| Concrete implementation, например Zustand или Query | `react/` или runtime-specific adapter домена |
| Количество instances и время жизни | graph owner: Provider, route, page, application или request scope |

Concrete store не должен экспортироваться. React API отдаёт selectors, commands и hooks:

```ts
export function useAuthState(): AuthState {
  const auth = useAuthRuntime()

  return useSyncExternalStore(
    auth.subscribe,
    auth.getSnapshot,
    auth.getSnapshot,
  )
}
```

Если Zustand, Redux или другой state runtime полезен только как техническая реализация, он должен быть закрыт в `react/` или adapter. Если его модель становится частью domain API, сначала нужно описать стабильный domain contract, а не экспортировать `StoreApi`.

Любые subscription, timer, socket и event listener:

- запускаются после mount/commit или в явно названной `start` operation;
- возвращают cleanup;
- не запускаются при import или создании factory instance;
- не делают browser runtime частью server graph.

## Domain UI и граница с Compositions

Возврат UI в business не означает, что любой UI становится domain UI.

| Сущность | Владелец |
|---|---|
| `Button`, `Modal`, `Tabs`, input primitive | `ui` |
| `LoginForm`, `LogoutButton`, `AuthRequired` | `business/auth/react/ui` |
| `CartSummary`, `AddToCartButton` | соответствующий business-домен |
| Header, объединяющий Auth, Cart и Navigation | `compositions` |
| Page, route, layout и screen | `compositions` |
| Sidebar open state, active tab и page-only flow | соответствующая composition |

Критерий для domain UI:

> Если сущность нельзя назвать и использовать без терминов конкретного домена, она вероятно принадлежит business-модулю.

Критерий для composition UI:

> Если сущность связывает несколько доменов, route/page scope или формирует конкретный экран, она принадлежит composition module.

## Что сохранить из текущей модели

Реорганизация не должна вернуть проблемы старого permissive подхода. Сохраняются следующие инварианты.

1. Concrete SDK, DTO и raw external errors не становятся public contract домена.
2. Домен нормализует внешние данные и наружу выдаёт только domain model и domain errors.
3. Cross-domain runtime dependencies передаются при сборке graph, сужаются до необходимого API и не образуют циклы.
4. Factory constructors и adapter constructors не делают I/O.
5. Lifecycle subscription/resource явно запускается и очищается владельцем scope.
6. Mutable internals, raw contexts, stores, adapters и clients закрыты от consumers.
7. Common UI остаётся в `ui`; domain UI не получает право быть бесконтрольным feature layer.
8. Product data не извлекается напрямую из SDK в page/screen/component, если она уже принадлежит domain scenario.

## Что меняется относительно текущей модели

| Текущая идея | Предложение |
|---|---|
| Business содержит только logic API | Business владеет vertical domain: kernel, runtime adapters и React API |
| React hooks - dependency wrapper business | Hooks - client input adapter домена |
| Concrete adapters в `compositions/business/{domain}` | Domain-specific adapters рядом с доменом; `infra` хранит только общие техсервисы |
| Factory - единственный runtime export | Factory - единственный creator domain runtime; public entrypoints могут экспортировать hooks, Provider и UI |
| Business не содержит UI | Domain-specific UI находится в `business/{domain}/react/ui` |
| Provider реализуется в composition | Domain Provider реализуется в business; composition выбирает место mount и graph scope |
| Каждый домен обязан иметь одинаковую server/client форму | `server/` добавляется только при реальной server-only необходимости |

## Не цели

- Не нужно создавать `kernel`, `adapters`, `react` и `server` в каждом модуле заранее.
- Не нужно переносить в business page/layout/route UI.
- Не нужно возвращать прямые SDK calls из hooks или компонентов.
- Не нужно создавать generic global `BusinessProvider` или service locator.
- Не нужно вводить module singleton как замену явному graph owner.
- Не нужно считать любой `useX` domain hook: многие hooks остаются page-local или universal UI hooks.
- Не нужно механически переносить все существующие `compositions/business/*` без подтверждения ownership на реальном домене.

## Проверочный пример перед изменением канонов

Новая модель должна быть проверена на одном полном домене, предпочтительно `auth`.

Минимальная цепочка:

```text
business/auth/kernel
  → AuthPorts, AuthRuntime, domain errors, session transitions

business/auth/adapters
  → HTTP session adapter, browser storage adapter, request storage adapter

business/auth/react
  → AuthProvider, useAuth, useCurrentUser, LoginForm, LogoutButton

business/auth/server (если нужен)
  → request-scoped AuthRuntime

composition
  → создаёт auth runtime в нужном scope и монтирует AuthProvider
```

Пример должен доказать:

1. Server Component получает current user через server или universal API без client imports.
2. Client Component получает то же доменное состояние через `useAuth` без SDK import.
3. `LoginForm` использует domain commands и domain errors без page-specific wiring.
4. Browser и server используют одну factory/kernel, но разные adapters и instances.
5. Нельзя передать runtime instance через RSC; передаётся только serializable snapshot.
6. Cross-domain dependency можно передать без runtime cycle.
7. Provider/store lifecycle не создаёт I/O при import и не оставляет subscription после unmount.
8. Public entrypoints не тянут server код в client bundle и client code в Server Component.

## Открытые вопросы для следующего шага

Эти вопросы нужно решить на проверочном примере, а не декларацией.

1. Где именно создаётся browser runtime по умолчанию: в graph composition или в convenience Provider домена? Вероятно, нужны обе формы: явный низкоуровневый Provider с `runtime` и ограниченный convenience root для независимого домена.
2. Какие зависимости вправе собирать domain-specific browser builder: только собственные adapters или также API других доменов? Рекомендуемое ограничение: другие domain APIs передаются снаружи как явный input.
3. Должен ли Query cache быть частью domain runtime или только React adapter? Базовая гипотеза: cache - React implementation detail, а domain runtime предоставляет commands/queries и invalidation intent в domain language.
4. В каких случаях domain adapter остаётся в приложении, а не рядом с business? Предлагаемый критерий: если адаптер реализует app-specific integration, недоступную другим приложениям монорепозитория, его можно держать в app assembly, сохраняя тот же port.
5. Нужно ли предоставлять Server Actions в `business/{domain}/server`? Базовая гипотеза: server action - framework entry и остаётся в app/composition; domain server facade предоставляет только business operation.
6. Какой минимальный contract нужен для server hydration domain state, чтобы не дублировать запрос на первом client render?
7. Какие типы domain UI допустимо экспортировать напрямую, а какие должны оставаться private implementation Provider/flow?

## Критерий принятия

Модель стоит переносить в каноны, только если проверочный домен позволяет одновременно ответить «да» на все вопросы:

- У домена один понятный owner, несмотря на server/client runtime surfaces?
- Фабрика по-прежнему является единственным creator business runtime?
- Hooks, Provider и domain UI colocated с доменом, а не вынесены ради технической чистоты?
- Server Component не тянет React/client module graph?
- Client Component не тянет server-only graph?
- Concrete implementation не протекает через public API?
- Сценарии, нормализация и errors не дублируются между server и client?
- Graph ownership и lifecycle instances по-прежнему явны?
- Новый подход проще объяснить и применить, чем текущие `business` + `compositions/business` + consumer composition?

Если хотя бы один ответ отрицательный, сначала нужно скорректировать proposal и проверить его на реальном коде, а не добавлять новые жёсткие правила.
