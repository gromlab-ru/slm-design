# Модуль business

> Пояснение единственного runtime-источника доменных данных и результатов.

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

## Роль

`business` является обязательным SLM-модулем доменного пакета. Он владеет:

- публичными предметными сценариями;
- единым контрактом `DomainApi`;
- одной публичной фабрикой;
- типом явных зависимостей фабрики;
- предметными типами и детерминированными правилами;
- кодами, типом и runtime guard доменных ошибок;
- публичным представлением доменных данных и состояния.

Приложение получает runtime-данные, состояние и результаты домена только через экземпляр `DomainApi`. Adapter, preset или framework binding module не открывает параллельный источник доменных данных.

## Публичный API модуля

Один логический API `business` разделён на три фиксированных фасета.

### Type-only barrel

Корневой `business/index.ts` экспортирует только типы:

```ts
export type {
  AuthApi,
  AuthDeps,
  AuthError,
  AuthErrorCode,
  AuthFactory,
  AuthState,
} from './types'
```

Потребитель использует этот путь только через `import type`:

```ts
import type {
  AuthApi,
  AuthError,
  AuthErrorCode,
} from '@/domains/auth/business'
```

### Factory entry

`business/factory.ts` экспортирует только runtime-фабрику:

```ts
export { authFactory } from './auth.factory'
```

```ts
import { authFactory } from '@/domains/auth/business/factory'
```

### Error entry

`business/error.ts` экспортирует только runtime-коды и guards:

```ts
export { AUTH_ERROR_CODES, isAuthError } from './errors/auth-error'
```

```ts
import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/error'
```

`AuthError` и `AuthErrorCode` не реэкспортируются из `business/error`: все public types имеют один канонический путь через type-only barrel. Предметные validators, normalizers, constructors ошибок, source-error mappers, mutable store и технические DTO остаются закрытыми.

Другие внешние пути внутри `business` являются deep imports. Файлы `factory.ts` и `error.ts` являются фасетами одного SLM-модуля, а не сегментами или вложенными модулями.

## Потребители фасетов

| Потребитель | `business` | `business/factory` | `business/error` |
|---|---|---|---|
| Adapter module своего домена | Type-only | Нет | Нет |
| Preset своего домена | Type-only | Да | Нет |
| Framework binding module своего домена | Type-only | Нет | Да |
| `composition` или `app` | Type-only | Да | Да |
| Модуль другого доменного пакета | Type-only | Нет | Нет |
| Тест | Type-only | По границе тестируемого владельца | По границе тестируемого владельца |

## Один DomainApi

```ts
export type AuthApi = {
  getSnapshot: () => AuthState
  requestPhoneOtp: (phone: string) => Promise<void>
  verifyPhoneOtp: (code: string) => Promise<void>
}

export type AuthFactory = (deps: AuthDeps) => AuthApi
```

Все presets вызывают одну `authFactory` и создают `AuthApi` этого контракта. Preset может использовать другую техническую реализацию, но не добавляет метод и не меняет семантику сценария. Одноразовое место сборки в `composition` также может вызвать `business/factory`, используя публичные adapter-модули пакета, если фабрика имеет технические зависимости.

Точная модель хранения, initial state, подписки и SSR snapshot пока остаётся открытым вопросом. Нормативной уже является публичная граница: приложение наблюдает доменное состояние через `DomainApi`, а не напрямую через adapter или framework store.

## Обязательный контракт ошибок

Каждый `business` объявляет устойчивые коды, безопасную readonly-форму и runtime guard. Типы публикуются через `business`, а runtime symbols через `business/error`:

```ts
export const AUTH_ERROR_CODES = {
  PHONE_INVALID: 'AUTH_PHONE_INVALID',
  OTP_REQUEST_FAILED: 'AUTH_OTP_REQUEST_FAILED',
  OTP_CODE_INVALID: 'AUTH_OTP_CODE_INVALID',
} as const

export type AuthErrorCode =
  typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES]

export type AuthError = Readonly<{
  code: AuthErrorCode
}>

const authErrorCodes = new Set<string>(Object.values(AUTH_ERROR_CODES))

export const isAuthError = (value: unknown): value is AuthError => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  const keys = Reflect.ownKeys(value)

  if (
    (prototype !== Object.prototype && prototype !== null)
    || keys.length !== 1
    || keys[0] !== 'code'
    || !('code' in value)
  ) {
    return false
  }

  return typeof value.code === 'string' && authErrorCodes.has(value.code)
}
```

Способ передачи ошибки, exception или discriminated `Result`, пока не закреплён. В обоих вариантах публичный сценарий сообщает ожидаемый сбой только через собственный `AuthError`.

## Изоляция технических ошибок

Ошибки SDK, HTTP, database, storage и adapters не пересекают `DomainApi` в форме, доступной приложению. `business` преобразует обрабатываемый технический сбой в собственный код:

```text
SDK error
  → adapter failure
  → business mapping
  → AuthErrorCode
  → приложение
```

Публичная форма не включает исходные `message`, `status`, `payload`, `cause`, SDK class или сам объект ошибки. Диагностические данные могут сохраняться только во внутреннем механизме observability, контракт которого будет определён отдельно.

То же относится к cross-domain вызову. Если `UserApi` использует `AuthApi`, сбой, который становится результатом публичного сценария User, представлен собственным `UserError`, а не `AuthError`.

Ошибки программирования и нарушенные внутренние инварианты не обязаны маскироваться под ожидаемые доменные ошибки. Способ отличить их от ожидаемых cross-domain ошибок при exception-модели и их диагностическая политика остаются открытыми вопросами; исходная ошибка при этом не добавляется в публичную форму DomainError.
