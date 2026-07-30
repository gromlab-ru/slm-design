# Auth как проверочный пример

> Рабочая заметка на основе реального модуля `/home/gromov/projects/biocad/newbiocadru/apps/web/src/business/auth`. Код проекта не изменялся.

Цель примера: проверить гипотезы Domain на существующем SLM business-модуле, а не предложить немедленную миграцию.

## Текущее устройство

```text
business/auth/
├── auth.factory.ts
├── errors/
├── hooks/
├── mappers/
├── services/
├── tests/
├── types/
└── index.ts
```

Runtime-сборка находится отдельно:

```text
compositions/business/knv/auth/
├── adapters/
├── create-knv-auth-business.ts
└── index.ts
```

Новая сущность Domain может колоцировать обе ответственности без смешивания ролей:

```text
domains/auth/
├── business/
├── presets/
│   └── {preset-name}/
│       └── adapters/
└── {framework-binding}/
```

## Factory и client boundary

### AUTH-N001: Текущий AuthApi содержит client-oriented hook

`auth.factory.ts` импортирует `createAuthHook`, а `hooks/use-auth.hook.ts` содержит `'use client'`. Кроме того, `AuthDeps.session` описывает `useToken`.

Текущий transitive graph:

```text
authFactory
  → createAuthHook
  → 'use client'
```

Это практический пример того, почему neutral factory должна проверяться по всему transitive import graph, а framework hooks должны находиться в отдельном framework module Domain. Точный путь этого module пока не выбран.

Возможное направление:

```text
business AuthApi
  → framework-neutral state observation

React binding
  → useAuth над готовым AuthApi
```

Финальный state contract пока не выбран.

## Pure phone logic

### AUTH-N002: Нормализация телефона уже дублируется

Business содержит private `normalizePhoneOtpPhone`, а auth-widget содержит отдельный `getPhoneDigits` и собственный `PHONE_DIGITS_LENGTH`.

Это кандидат на public pure business function:

```ts
import {
  normalizeAuthPhone,
  validateAuthPhone,
} from '@/domains/auth/business'
```

Business service и UI могут использовать одну семантику. Business service всё равно повторно валидирует вход независимо от UI-проверки.

Существующий `business/user` показывает другой workaround: pure validators возвращаются через собранный `userFactory` API. Прямой pure export позволит не требовать assembly для детерминированной функции.

## Error contract

### AUTH-N003: Error contract фактически публичен, но описан не полностью

Business создаёт `AuthBusinessError` с `code` и `retryAfterSeconds`, но public `index.ts` экспортирует только type `AuthErrorCode`.

Consumer auth-widget поэтому:

- повторяет строковые error codes в message map;
- создаёт локальный `AuthErrorData`;
- вручную проверяет `code` и `retryAfterSeconds` в `unknown`;
- самостоятельно нормализует форму caught error.

Предварительное исправление границы:

```ts
// Public business API.
export { AUTH_ERROR_CODES, isAuthError }
export type { AuthError, AuthErrorCode }

// Business-private implementation.
class AuthBusinessError extends Error {}
const createAuthBusinessError = (...) => {}
```

Consumer получает безопасный observation contract, но не получает constructor и source mapping.

## Presets

### AUTH-N004: Текущий createKnvAuthBusiness является preset

`createKnvAuthBusiness()` выбирает `knvAuthPhoneAdapter` и `appAuthSessionAdapter`, затем вызывает `authFactory`.

В новой терминологии это application preset, внутри которого могут оставаться KNV-specific adapters:

```text
domains/auth/presets/application/create-application-auth.ts
```

Он не является единственно допустимым assembly site. Tests, SSR request composition и другой product preset могут напрямую вызвать ту же `authFactory`.

## SSR-вариант

Одна factory позволяет получить request-scoped API без второй реализации business:

```ts
import 'server-only'

export const createAuthForRequest = (input: AuthRequestInput) => {
  return authFactory({
    authPhone: createKnvServerAuthPhoneAdapter(input),
    session: createRequestAuthSessionAdapter(input),
  })
}
```

Browser preset использует другую реализацию тех же ports. Factory, business types, pure functions и error contract остаются общими.

## Предварительная целевая структура

```text
domains/auth/
├── business/
│   ├── auth.factory.ts
│   ├── errors/
│   ├── lib/
│   ├── mappers/
│   ├── services/
│   ├── tests/
│   ├── types/
│   └── index.ts
├── presets/
│   └── application/
│       ├── adapters/
│       ├── create-application-auth.ts
│       ├── create-application-auth.test.ts
│       └── index.ts
└── {framework-binding}/
    └── index.ts
```

Это только проверочная структура. Она не фиксирует обязательность всех папок и не должна использоваться как scaffold checklist.

Server-only/request preset может быть добавлен отдельным module при реальной потребности. Он не образует обязательную `server`-ветку Domain.

Tests не используют общий testing preset. Business tests выполняют per-test assembly напрямую через `authFactory`, а production presets тестируются рядом с собственной реализацией только на wiring, scope и lifecycle.
