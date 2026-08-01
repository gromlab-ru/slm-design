# Модуль business

> Пояснение предметного владельца, нескольких Domain API и публичного deterministic runtime.

## Связанные правила

- [`SLM-L2-BUSINESS-R005`](../../rules/level-2.md#slm-l2-business-r005)
- [`SLM-L2-BUSINESS-R006`](../../rules/level-2.md#slm-l2-business-r006)
- [`SLM-L2-BUSINESS-A007`](../../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ERROR-R009`](../../rules/level-2.md#slm-l2-error-r009)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-BUSINESS-R018`](../../rules/level-2.md#slm-l2-business-r018)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L2-BUSINESS-R024`](../../rules/level-2.md#slm-l2-business-r024)
- [`SLM-L2-BUSINESS-R025`](../../rules/level-2.md#slm-l2-business-r025)

## Роль

`business` является обязательным SLM-модулем доменного пакета. Он владеет:

- публичными предметными сценариями;
- одним или несколькими именованными Domain API;
- одной публичной фабрикой для каждого API;
- типами явных зависимостей фабрик;
- предметными типами и детерминированными правилами;
- контрактами ожидаемых доменных ошибок;
- публичным представлением доменных данных и состояния.

Несколько API остаются частью одного модуля, пока относятся к одной связной предметной области. Они нужны не для копирования use cases, а для независимой сборки разных наборов сценариев, зависимостей и сред.

## Публичные фасеты

Один логический API модуля `business` имеет два обязательных и один необязательный entry point.

### Type-only barrel

Корневой `business/index.ts` экспортирует только типы:

```ts
export type {
  AuthAdministrationApi,
  AuthAdministrationDeps,
  AuthAdministrationFactory,
  AuthError,
  AuthErrorCode,
  AuthSessionApi,
  AuthSessionDeps,
  AuthSessionFactory,
  AuthState,
} from './types'
```

Потребитель использует этот путь только через `import type`:

```ts
import type {
  AuthSessionApi,
  AuthState,
} from '@/domains/auth/business'
```

### Factory entry

`business/factory.ts` экспортирует только именованные runtime-фабрики:

```ts
export { authAdministrationFactory } from './factories/auth-administration.factory'
export { authSessionFactory } from './factories/auth-session.factory'
```

```ts
import {
  authAdministrationFactory,
  authSessionFactory,
} from '@/domains/auth/business/factory'
```

Каждому API соответствует одна фабрика. Фасет не экспортирует готовые instances, adapters или environment-specific assembly.

### Runtime entry

Необязательный `business/runtime.ts` экспортирует только публичные детерминированные значения и функции:

```ts
export {
  AUTH_ERROR_CODES,
  isAuthError,
} from './errors/auth-error'

export { normalizeAuthIdentifier } from './lib/normalize-auth-identifier'
```

Здесь допустимы error codes и guards, validators, value constructors, чистые продуктовые функции и immutable-константы. Все public types по-прежнему импортируются из корневого type-only barrel.

`business/runtime` не содержит:

- фабрики и готовые API instances;
- I/O или изменяемое состояние;
- state/query runtime;
- чтение clock, random, environment или platform API;
- сценарии, которым нужны runtime-зависимости.

Если внешним потребителям не нужен детерминированный runtime, файл `runtime.ts` не создаётся. Другие внешние пути внутри `business` являются deep imports.

## Несколько Domain API

```ts
export type AuthSessionApi = {
  getCurrentSession: () => Promise<AuthState>
  getSnapshot: () => AuthState
  requestPhoneOtp: (phone: string) => Promise<void>
  startInvalidationTracking: () => () => Promise<void>
  verifyPhoneOtp: (code: string) => Promise<void>
}

export type AuthAdministrationApi = {
  revokeUserSessions: (userId: string) => Promise<void>
}
```

`AuthSessionApi` может собираться в browser и request contexts, а `AuthAdministrationApi` только в доверенной server assembly. Browser assembly не получает метод-заглушку и не импортирует adapters административного API.

Общий `business/factory` является публичным фасетом, а не гарантией отдельного business chunk для каждой фабрики. Разделение API устраняет обязательное создание лишних adapters и instances. Если самой business-логике нужны независимо поставляемые bundle boundaries, требуется отдельный build/package mechanism за пределами текущего Level 2, а не искусственное разделение предметной области.

Один публичный сценарий принадлежит ровно одному API. Если два API постоянно требуют одинаковых методов, состояния и lifecycle, их граница пересматривается вместо дублирования.

Assembly может вернуть именованный граф нескольких API:

```ts
export type AuthBrowserGraph = Readonly<{
  session: AuthSessionApi
}>

export type AuthRequestGraph = Readonly<{
  administration: AuthAdministrationApi
  session: AuthSessionApi
}>
```

Такой граф является составом готовых контрактов для контекста, а не новым предметным API.

## Предметная власть и состояние

Business API остаются единственной границей, определяющей предметную модель, validation, переходы и семантику результатов. Это не означает, что только `business` физически хранит байты.

Adapter или framework binding может использовать Zustand, TanStack Query, SWR, Apollo либо другой runtime для хранения и доставки значений. Такое хранилище является технической реализацией или проекцией, если:

- значения получены или проверены business API либо `business/runtime`;
- предметные переходы выполняются через business API;
- внешний DTO не становится публичной моделью напрямую;
- optimistic value создаётся или проверяется предметным владельцем;
- библиотечные cache/store types не становятся Domain API.

Подробная граница описана в [Состоянии и кэше](./state-cache.md).

## Потребители фасетов

| Потребитель | `business` | `business/factory` | `business/runtime` |
|---|---|---|---|
| Adapter своего домена | Type-only | Нет | Обычно нет |
| Assembly своего домена | Type-only | Да | При необходимости |
| Framework binding своего домена | Type-only | Нет | Да, если нужен public runtime |
| `composition` или `app` | Type-only | Для одноразовой сборки | Да |
| Код другого домена при связи с Level 2 | Type-only | Нет | Да |
| Тест | Type-only | По границе тестируемого API | По границе тестируемого владельца |

Runtime-импорт `business/runtime` другого домена остаётся архитектурным ребром и участвует в общей проверке циклов.

## Контракт ошибок

Ожидаемая ошибка имеет устойчивую безопасную readonly-форму:

```ts
export type AuthErrorCode =
  | 'AUTH_PHONE_INVALID'
  | 'AUTH_OTP_REQUEST_FAILED'
  | 'AUTH_OTP_CODE_INVALID'

export type AuthError = Readonly<{
  code: AuthErrorCode
}>
```

Если runtime-потребителям нужны constants или guard, они публикуются через `business/runtime`:

```ts
export const AUTH_ERROR_CODES = {
  PHONE_INVALID: 'AUTH_PHONE_INVALID',
  OTP_REQUEST_FAILED: 'AUTH_OTP_REQUEST_FAILED',
  OTP_CODE_INVALID: 'AUTH_OTP_CODE_INVALID',
} as const

export const isAuthError = (value: unknown): value is AuthError => {
  return isSafeCodedError(value, Object.values(AUTH_ERROR_CODES))
}
```

Guard не является обязательной частью каждого домена. При discriminated `Result` типизированному потребителю может быть достаточно error union; при exception, RPC или неизвестной runtime-границе guard часто нужен. Выбор `throw` или `Result` не меняет набор обязательных фасетов.

## Изоляция технических и чужих ошибок

Ошибки SDK, HTTP, database, storage и adapters не пересекают Domain API в форме, доступной приложению. `business` преобразует обрабатываемый технический сбой в собственный код:

```text
SDK error
  → adapter failure
  → business mapping
  → AuthErrorCode
  → приложение
```

Публичная форма не включает исходные `message`, `status`, `payload`, `cause`, SDK class или сам объект ошибки. Диагностические данные остаются во внутреннем observability-механизме.

То же относится к cross-domain вызову. Если User API использует Auth API, сбой, который становится результатом публичного сценария User, представлен собственным `UserError`. При exception-модели зависимый business может импортировать `isAuthError` и error codes из `auth/business/runtime`, после чего преобразовать ожидаемую ошибку в собственный контракт.

Ошибки программирования и нарушенные внутренние инварианты не обязаны маскироваться под ожидаемые доменные ошибки.
