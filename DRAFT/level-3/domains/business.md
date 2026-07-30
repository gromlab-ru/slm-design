# Business module внутри Domain

> Рабочая заметка. Не является нормативным разделом спецификации.

## Роль

### BUS-N001: Business является семантическим ядром Domain

Business-модуль владеет:

- публичными бизнес-сценариями;
- business-owned types и contracts;
- business API;
- factory и ports;
- детерминированными доменными правилами;
- доменным error contract;
- преобразованием внешних результатов в доменные результаты.

Business не владеет concrete runtime, environment wiring и framework integration.

## Public API business-модуля

### BUS-N002: Business может экспортировать четыре категории сущностей

| Категория | Примеры |
|---|---|
| Factory | `authFactory` |
| Types и contracts | `AuthApi`, `AuthDeps`, `AuthState`, `AuthErrorCode` |
| Pure domain functions | `normalizeAuthPhone`, `validateAuthPhone` |
| Error observation contract | `AUTH_ERROR_CODES`, `AuthError`, `isAuthError` |

Это заменяет старую гипотезу, что business `index.ts` может экспортировать в runtime только factory.

Предварительный public API:

```ts
export { authFactory } from './auth.factory'

export {
  AUTH_ERROR_CODES,
  isAuthError,
} from './errors/auth-error'

export {
  normalizeAuthPhone,
  validateAuthPhone,
} from './lib/auth-phone'

export type {
  AuthApi,
  AuthDeps,
  AuthError,
  AuthErrorCode,
  AuthFactory,
  AuthState,
}
```

## Types

### BUS-N003: Business contracts остаются внутри business

Отдельный `model` submodule пока не требуется. Типы размещаются по ownership:

| Тип | Место |
|---|---|
| `AuthApi`, `AuthDeps`, `AuthState` | `domains/auth/business/types` |
| `AuthError`, `AuthErrorCode` | `domains/auth/business/types` или `errors` |
| SDK DTO | Adapter или infra runtime |
| React provider props | Выбранный React binding module Domain |
| View model конкретного screen | Consumer composition |

`types/` является segment business-модуля, а не самостоятельным общим хранилищем Domain.

## Pure domain functions

### BUS-N004: Детерминированная доменная функция может экспортироваться напрямую

Pure domain function:

- получает все данные через аргументы;
- возвращает результат только на основе аргументов;
- не использует `Deps`;
- не выполняет I/O;
- не читает mutable runtime state;
- не зависит от clock, random, env или platform API;
- не импортирует React, Vue, Next.js или state manager;
- использует business language и реализует доменное правило.

Примеры:

```ts
normalizeAuthPhone(value)
validateAuthPhone(value)
calculateOrderTotal(order)
hasRequiredUserAgreements(user)
```

Consumer может использовать такую функцию для раннего UX feedback. Business scenario всё равно обязан повторно проверить вход на своей границе.

### BUS-N005: Не каждая pure function становится public

Функция остаётся private, если она нужна только одному service или является технической деталью реализации. Public export оправдан доменной семантикой и реальным внешним либо межмодульным consumer.

Папки `domain/shared` и `domain/public` не создаются только ради видимости. Public contract определяется entrypoint business-модуля.

## Domain errors

### BUS-N006: Создание и наблюдение ошибки являются разными контрактами

Business создаёт domain error. Consumer только распознаёт ошибку и читает поля, от которых зависит его поведение.

Public observation contract:

```ts
export const AUTH_ERROR_CODES = {
  PHONE_OTP_PHONE_INVALID: 'AUTH_PHONE_OTP_PHONE_INVALID',
  PHONE_OTP_VERIFY_CODE_INVALID: 'AUTH_PHONE_OTP_VERIFY_CODE_INVALID',
  PHONE_OTP_RESEND_TOO_SOON: 'AUTH_PHONE_OTP_RESEND_TOO_SOON',
} as const

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]

export type AuthError = Readonly<{
  code: AuthErrorCode
  retryAfterSeconds: number | null
}>

export const isAuthError = (value: unknown): value is AuthError => {
  // Structural runtime validation.
}
```

Private creation contract:

```ts
class AuthBusinessError extends Error implements AuthError {
  // Constructor, cause и source diagnostics.
}

const createAuthBusinessError = (...) => {
  // Source error mapping.
}
```

### BUS-N007: Error constructor не является consumer API

Consumer не должен создавать `AuthBusinessError`, выбирать source mapping или подделывать business failure. Поэтому наружу предполагается экспортировать:

- stable error code values;
- error code type;
- read-only observable error shape;
- runtime guard или parser.

Наружу не предполагается экспортировать:

- error constructor;
- error factory;
- source error mapper;
- transport-specific error data;
- internal fallback selection.

### BUS-N008: Одних типов недостаточно при throw-based API

TypeScript не описывает checked exceptions. Для сигнатуры

```ts
(data: VerifyPhoneOtpData) => Promise<void>
```

значение в `catch` всё равно имеет тип `unknown`. Если consumer различает ошибки по `code`, business должен предоставить runtime discriminator либо перейти на typed `Result`.

Выбор между throw + guard и typed `Result` пока не закрыт окончательно. Текущий минимальный путь совместимости: throw + public observation contract.
