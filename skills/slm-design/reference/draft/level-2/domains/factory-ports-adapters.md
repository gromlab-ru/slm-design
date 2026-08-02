# Фабрики, ports и adapters

> Пояснение dependency inversion между Domain API и внешними runtime-возможностями.

## Связанные правила

- [`SLM-L2-API-A007`](../../rules/level-2.md#slm-l2-api-a007)
- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-API-R018`](../../rules/level-2.md#slm-l2-api-r018)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-API-A022`](../../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-API-R024`](../../rules/level-2.md#slm-l2-api-r024)
- [`SLM-L2-PORT-R027`](../../rules/level-2.md#slm-l2-port-r027)

## Одна фабрика на Domain API

```text
явные ports + cross-domain APIs + factory → один Domain API
```

Модуль `api` предоставляет одну именованную фабрику для каждого объявленного Domain API:

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'

import type {
  AuthIdentityPort,
  AuthRuntimePort,
} from '@/domains/auth/api/ports'

export type AuthSessionApiDependencies = Readonly<{
  identity: AuthIdentityPort
  runtime: AuthRuntimePort
}>

export type AuthSessionApiFactory = (
  dependencies: AuthSessionApiDependencies,
) => AuthSessionApi
```

```ts
import {
  createAuthSessionApi,
} from '@/domains/auth/api/factory'
```

Фабрика не выбирает environment, provider, adapter или assembly. Она не открывает connection, не запускает subscription и не создаёт framework state. Разные Domain API могут иметь разные dependency sets и собираться независимо.

## Consumer-owned ports

Port описывает capability с позиции модуля `api`, а не повторяет конкретный provider:

```ts
export type AuthIdentityRecord = Readonly<{
  expiresAt: number
  subject: string
}>

export type AuthIdentityPortFailure =
  | Readonly<{ type: 'FORBIDDEN' }>
  | Readonly<{ type: 'RATE_LIMITED' }>
  | Readonly<{ type: 'UNAVAILABLE' }>

export type AuthIdentityPortResult =
  | Readonly<{
      ok: true
      value: AuthIdentityRecord
    }>
  | Readonly<{
      ok: false
      failure: AuthIdentityPortFailure
    }>

export type AuthIdentityPort = {
  signIn: (
    command: AuthIdentityPortCommand,
  ) => Promise<AuthIdentityPortResult>
}
```

Port не экспортирует generated DTO, SDK error class, HTTP status или concrete client. `AuthIdentityRecord` не становится `AuthSession`: модуль `api` проверяет record и создаёт публичную модель.

Не каждый port обязан использовать `Result`. Exception, callback или async iterable допустимы при project policy, если expected failures, cancellation, outcome uncertainty и cleanup остаются типизированными и проверяемыми.

## Гранулярность ports

Port соответствует связной capability, а не каждому endpoint и не всему SDK:

```text
AuthIdentityPort
  ├── requestCode
  ├── verifyCode
  └── revokeSession
```

Допустимо разделить capability, если операции имеют разные trust boundaries, lifecycle или providers. Запрещено создавать десятки pass-through ports только ради зеркала transport operations.

Clock, timer, random, ID generator и environment также являются ports, если влияют на результат Domain API. Materialized framework state и query cache ports не являются: они принадлежат framework binding.

## Failure algebra

Expected failure проходит две явные стадии:

```text
provider-specific failure
  → adapter mapping
  → closed port failure
  → api mapping
  → stable domain error or outcome
```

Port failure должен сохранять различия, которые нужны Domain API. Если adapter сводит `FORBIDDEN`, `CONFLICT` и `UNAVAILABLE` к `unknown`, API не может выбрать корректную публичную семантику. Если adapter передаёт HTTP status или SDK error, concrete provider протекает внутрь API.

Unexpected exception не обязана превращаться в expected failure. Cancellation объявляется отдельно от failure, если caller управляет ею. Disconnect или timeout после отправки неидемпотентной команды может означать `OUTCOME_UNKNOWN`, а не доказанный отказ.

## Adapter module

Adapter соединяет port с concrete provider:

```text
api-owned port ← adapter → SDK / REST / storage / platform / realtime
```

```ts
import type {
  AuthIdentityPort,
} from '@/domains/auth/api/ports'

export const createAuthRestAdapter = (
  client: IdentityClient,
): AuthIdentityPort => ({
  async signIn(command) {
    try {
      const response = await client.signIn({
        login: command.identifier,
        password: command.secret,
      })

      return {
        ok: true,
        value: {
          expiresAt: response.expires_at,
          subject: response.user_id,
        },
      }
    } catch (error) {
      return mapIdentityProviderFailure(error)
    }
  },
})
```

Adapter преобразует protocol arguments, records и expected failures, но не решает, какой `AuthError` получит приложение, не добавляет предметный fallback и не объявляет метод Domain API.

## Размещение adapters

Каждая связная production-реализация является отдельным SLM-модулем Group `adapters`:

```text
auth/adapters/
├── identity-rest/
│   └── index.ts
├── identity-realtime/
│   └── index.ts
└── session-cookie/
    └── index.ts
```

Один adapter-модуль может реализовать несколько тесно связанных ports одного provider. Group `adapters` не имеет `index.ts` и не реэкспортирует дочерние модули.

Production adapter запрещено определять:

- внутри `api`;
- закрытым сегментом assembly;
- inline-функцией в `app` или composition;
- частью framework binding;
- mutable registry или service locator.

Concrete adapters в production импортируют только assemblies своего домена. Adapter tests импортируют соответствующий module напрямую.

## Универсальный infra service

Adapter может использовать публичный API `infra`, если concrete technical service является универсальным для приложения:

```text
auth adapter
  → infra/http-client
  → external identity provider
```

Совпадение сигнатур `infra` API и port не переносит ownership port в `infra`. Adapter остаётся явной границей provider mapping, failures и environment. Он может быть тонким, но не добавляет фиктивные преобразования ради объёма кода.

## Cross-domain API dependency

Готовый API другого домена не является technical port:

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'

export type UserProfileApiDependencies = Readonly<{
  auth: Pick<AuthSessionApi, 'getSession'>
  profile: UserProfilePort
}>
```

Graph owner создаёт Auth раньше User и передаёт `auth.session` в User assembly. User не объявляет structural copy чужого API и не создаёт bridge adapter без реального преобразования контракта.

Если expected Auth failure становится публичным outcome User, User API преобразует его в собственную `UserError`. При exception-модели он может использовать публичный guard из `auth/api/runtime`.

## Framework-only SDK

Некоторые SDK доступны только как framework Provider, hook или component, например CAPTCHA или payment element. Framework binding может получить opaque token или operation input через такой SDK и передать его команде Domain API:

```text
framework SDK
  → opaque token
  → Domain API command
  → port
  → provider adapter
```

Binding не вызывает предметную provider operation напрямую, SDK type не входит в public Domain API, а generic technical UI при необходимости разделяется между `infra`, `ui` и composition.

## Tests и fake ports

Локальные fake implementations в API-тестах не являются production adapters и не требуют SLM-модулей. Они существуют только внутри test boundary и позволяют детерминированно задавать records, failures, cancellation и realtime события.

Adapter contract tests отдельно доказывают, что concrete provider действительно реализует port. API-тест с идеальным fake не заменяет эту проверку.
