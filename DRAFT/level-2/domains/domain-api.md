# Модуль api и Domain API

> Пояснение семантического шлюза домена, его публичных фасетов, моделей, операций и ошибок.

## Связанные правила

- [`SLM-L2-API-R005`](../../rules/level-2.md#slm-l2-api-r005)
- [`SLM-L2-API-R006`](../../rules/level-2.md#slm-l2-api-r006)
- [`SLM-L2-API-A007`](../../rules/level-2.md#slm-l2-api-a007)
- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ERROR-R009`](../../rules/level-2.md#slm-l2-error-r009)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-API-R018`](../../rules/level-2.md#slm-l2-api-r018)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-API-A022`](../../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-API-R024`](../../rules/level-2.md#slm-l2-api-r024)
- [`SLM-L2-API-R025`](../../rules/level-2.md#slm-l2-api-r025)
- [`SLM-L2-PORT-R027`](../../rules/level-2.md#slm-l2-port-r027)
- [`SLM-L2-STATE-R028`](../../rules/level-2.md#slm-l2-state-r028)

## Роль

`api` является обязательным SLM-модулем доменного пакета. Для прикладного consumer предметная область доступна только через объявленные им Domain API, public models, outcomes и errors.

Модуль `api` владеет:

- именованными Domain API;
- публичными командами, запросами и подписками;
- public domain models;
- validation внешних и port values;
- семантикой outcomes и expected errors;
- dependency ports и port failures;
- одной фабрикой для каждого Domain API;
- необходимыми consumers deterministic guards и pure-функциями.

Модуль не владеет framework store, query cache, hydration runtime, SDK, transport client или production adapter. Он может координировать одну операцию и замыкать переданные ports, но не хранит скрытую mutable projection данных приложения между вызовами.

## Domain API как шлюз

```text
consumer command
  → Domain API
  → dependency port
  → adapter
  → provider

provider record/failure
  → adapter mapping
  → port record/failure
  → Domain API validation and semantics
  → public model/outcome/error
  → consumer
```

Framework hook, store или composition не импортирует concrete SDK и не читает предметный внешний источник напрямую. Это позволяет менять endpoint, provider и transport, сохраняя публичный контракт, пока не изменилась продуктовая семантика.

Domain API не обязан скрывать реальное предметное изменение. Если backend изменил правило, которое влияет на публичный outcome приложения, контракт домена пересматривается явно.

## Публичные фасеты

Один логический публичный API модуля `api` разделён по аудиториям.

### Consumer types

Корневой `api/index.ts` экспортирует только типы, необходимые прикладным consumers:

```ts
export type {
  AuthError,
  AuthErrorCode,
  AuthSession,
  AuthSessionApi,
  RequestPhoneOtpCommand,
  VerifyPhoneOtpCommand,
} from './types'
```

```ts
import type {
  AuthSession,
  AuthSessionApi,
} from '@/domains/auth/api'
```

Port contracts, factory dependencies, provider records и technical failures не входят в consumer-facing barrel.

### Implementer types

`api/ports.ts` существует только при наличии dependency ports и экспортирует implementer-facing contracts:

```ts
export type {
  AuthIdentityPort,
  AuthIdentityPortFailure,
  AuthIdentityRecord,
  AuthSessionApiDependencies,
} from './ports'
```

```ts
import type {
  AuthIdentityPort,
} from '@/domains/auth/api/ports'
```

Этим фасетом пользуются adapters своего домена, assemblies и tests. Прикладной consumer не строит поведение по port records или failures.

### Factory entry

`api/factory.ts` экспортирует только именованные runtime-фабрики:

```ts
export {
  createAuthAdministrationApi,
  createAuthSessionApi,
} from './factories'
```

```ts
import {
  createAuthSessionApi,
} from '@/domains/auth/api/factory'
```

В production этот фасет импортируют только assemblies текущего домена. API-тесты используют его с fake ports.

### Runtime entry

Необязательный `api/runtime.ts` экспортирует только публичный детерминированный runtime:

```ts
export {
  AUTH_ERROR_CODES,
  isAuthError,
  projectSessionEvent,
} from './runtime'
```

Здесь допустимы error codes и guards, validators, value constructors, pure transitions, reconciliation functions и immutable-константы. Фасет не содержит фабрики, API instances, ports, I/O, subscriptions, mutable state или environment-specific код.

Если runtime-потребителей нет, файл не создаётся. Другие внешние пути внутри `api` являются deep imports.

## Stateless runtime boundary

Domain API управляет смыслом данных, а не способом их materialization. Query и command возвращают public values или outcomes, которые framework binding может сохранить в TanStack Query, Zustand, Pinia или другом runtime:

```ts
export type AuthSessionApi = {
  getSession: () => Promise<AuthSession>
  requestPhoneOtp: (
    command: RequestPhoneOtpCommand,
  ) => Promise<RequestPhoneOtpOutcome>
  verifyPhoneOtp: (
    command: VerifyPhoneOtpCommand,
  ) => Promise<AuthSession>
  signOut: () => Promise<void>
}
```

API не экспортирует `getState`, mutable store, QueryClient или framework subscription. Operation-local correlation, cancellation и validation допустимы; canonical cache приложения остаётся у framework consumer.

Если клиентский workflow имеет предметное состояние, framework хранит readonly value, а API определяет переход:

```ts
const nextCheckout = checkoutApi.applyCommand(
  currentCheckout,
  command,
)
```

Или consumer использует pure-функцию `api/runtime`. Framework не применяет предметный merge самостоятельно.

## Несколько Domain API

```ts
export type AuthSessionApi = {
  getSession: () => Promise<AuthSession>
  signIn: (command: SignInCommand) => Promise<AuthSession>
  signOut: () => Promise<void>
}

export type AuthAdministrationApi = {
  revokeUserSessions: (
    command: RevokeUserSessionsCommand,
  ) => Promise<void>
}
```

`AuthSessionApi` и `AuthAdministrationApi` могут иметь разные ports, trust boundaries и assemblies. Один публичный сценарий принадлежит ровно одному API.

Разделение не используется только ради файловой декомпозиции. Если APIs не могут быть созданы независимо из-за общей atomicity, состояния или lifecycle, они объединяются либо получают один явно созданный shared capability через assembly.

Assembly возвращает именованный граф готовых контрактов:

```ts
export type AuthGraph = Readonly<{
  session: AuthSessionApi
}>
```

Такой граф сообщает доступный набор API, но не является новым предметным API.

## Errors и failure algebra

Ожидаемая публичная ошибка имеет устойчивую readonly сериализуемую форму:

```ts
export type AuthErrorCode =
  | 'AUTH_IDENTITY_INVALID'
  | 'AUTH_RATE_LIMITED'
  | 'AUTH_SERVICE_UNAVAILABLE'

export type AuthError = Readonly<{
  code: AuthErrorCode
}>
```

Внешний failure проходит две границы:

```text
provider error
  → adapter
  → closed port failure
  → api
  → stable domain error
```

Например, adapter переводит HTTP `429`, SDK class или socket error frame в `AuthIdentityPortFailure` с типом `RATE_LIMITED`. Domain API решает, что публичная операция завершается `AUTH_RATE_LIMITED`.

Port failure не содержит raw provider object в публично доступной форме. Domain error не включает status, SDK class, source message, payload или `cause`. Диагностические данные остаются в observability-механизме adapter или infra.

Cancellation и `OUTCOME_UNKNOWN` не объединяются с обычным failure, если приложение должно различать их. Ошибка программирования и нарушенный внутренний инвариант не маскируются под expected domain error.

Выбор exception или discriminated `Result` остаётся policy проекта. Архитектурная цепочка provider failure → port failure → domain error не зависит от канала передачи.

## Недетерминизм

Clock, timer, random, ID generator и environment передаются как dependency ports:

```ts
export type AuthRuntimePort = {
  now: () => number
  createId: () => string
}
```

Модуль `api` не читает `Date.now`, `Math.random`, env или platform globals напрямую, если они влияют на результат операции. Это сохраняет детерминированность API-тестов и явную environment boundary.

## Потребители фасетов

| Потребитель | `api` | `api/ports` | `api/factory` | `api/runtime` |
|---|---|---|---|---|
| Adapter своего домена | Нет | Type-only | Нет | Нет |
| Assembly своего домена | Type-only | Type-only | Да | При необходимости |
| Framework binding своего домена | Type-only | Нет | Нет | При необходимости |
| `composition` или `app` | Type-only | Нет | Нет | При необходимости |
| Код другого домена | Type-only | Нет | Нет | При необходимости |
| API-тест | Type-only | Type-only | Да | По тестируемой границе |

Прикладной production graph создаётся assemblies. `app`, compositions и framework bindings не импортируют factory или concrete adapters.
