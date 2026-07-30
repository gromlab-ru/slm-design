# Business module внутри Domain

> Пояснение semantic core Domain.

## Связанные правила

- [`SLM-L3-BUSINESS-R003`](../../rules/level-3.md#slm-l3-business-r003)
- [`SLM-L3-BUSINESS-A004`](../../rules/level-3.md#slm-l3-business-a004)
- [`SLM-L3-PORT-R007`](../../rules/level-3.md#slm-l3-port-r007)
- [`SLM-L1-MODULE-A004`](../../rules/level-1.md#slm-l1-module-a004)

## Роль

`business` -- единственный обязательный module Domain. Он владеет:

- public business scenarios и `DomainApi`;
- factory, `Deps` и ports;
- business-owned types и contracts;
- детерминированными rules, validation и normalization;
- domain error contract;
- семантикой domain state, commands и selectors.

Business не владеет SDK, storage implementation, browser/Node API, framework integration, environment wiring или concrete state manager.

## Public API

Business entrypoint открывает только contract, нужный consumers, presets и adapters:

```ts
export { authFactory } from './auth.factory'
export { AUTH_ERROR_CODES, isAuthError } from './errors/auth-error'
export { normalizeAuthPhone, validateAuthPhone } from './lib/auth-phone'

export type {
  AuthApi,
  AuthDeps,
  AuthError,
  AuthErrorCode,
  AuthFactory,
  AuthPhonePort,
  AuthSessionPort,
  AuthState,
} from './types'
```

Port types экспортируются, потому что preset и promoted adapter реализуют именно эти contracts. `services`, private mappers, error constructor, source mapper, persistence key и concrete state runtime остаются закрытыми.

## Types и pure functions

`types`, `errors`, `lib`, `ports`, `services` и `tests` -- segments business module, а не отдельные Domain APIs. Type размещается у владельца:

| Contract | Владелец |
|---|---|
| `AuthApi`, `AuthDeps`, `AuthState`, ports | `business` |
| SDK DTO и transport error | Adapter или `infra` |
| React provider props | `react` |
| View model screen | Consumer composition |

Pure domain function может быть public, только если она выражает business rule и имеет реального external consumer. Она получает все данные аргументами, детерминирована, не использует `Deps`, state, clock, random, environment или framework runtime.

Consumer может применять `validateAuthPhone` для раннего UX feedback, но public business scenario повторяет validation на своей границе.

## Domain errors

Каждый public runtime scenario выдаёт только domain failure contract. Source error, SDK class, HTTP status, response body и transport code не становятся consumer API.

```ts
export const AUTH_ERROR_CODES = {
  PHONE_OTP_PHONE_INVALID: 'AUTH_PHONE_OTP_PHONE_INVALID',
  PHONE_OTP_REQUEST_FAILED: 'AUTH_PHONE_OTP_REQUEST_FAILED',
  PHONE_OTP_VERIFY_CODE_INVALID: 'AUTH_PHONE_OTP_VERIFY_CODE_INVALID',
  PHONE_OTP_RESEND_TOO_SOON: 'AUTH_PHONE_OTP_RESEND_TOO_SOON',
} as const

export type AuthError = Readonly<{
  code: AuthErrorCode
  retryAfterSeconds: number | null
}>

export const isAuthError = (value: unknown): value is AuthError => {
  // Runtime validation of the public observation shape.
}
```

Если public API использует exceptions, entrypoint экспортирует domain-specific guard, codes и read-only observation shape, но не constructor или source error mapper. Если проект выбирает discriminated `Result`, тот же contract должен быть выражен в result branch. Один business API не смешивает оба способа для одинаковых scenario.

## Domain state

Business определяет форму `AuthState`, начальное состояние, допустимые transitions и public observation contract. Concrete store, persistence, subscription source и framework hook реализуются снаружи business через ports/adapters.

Framework-neutral observation может иметь форму `getSnapshot` и `subscribe`. Это protocol business API, а не React hook или `StoreApi` конкретной библиотеки.
