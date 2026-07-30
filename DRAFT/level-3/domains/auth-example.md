# Auth как пример миграции

> Проверочный пример Level 3. Он показывает направление декомпозиции, а не обязательный scaffold.

## Исходная проблема

В более ранней форме SLM business contract Auth и concrete assembly могли находиться отдельно:

```text
business/auth/
├── auth.factory.ts
├── errors/
├── hooks/
├── services/
├── types/
└── index.ts

compositions/business/auth/
├── adapters/
├── create-auth-business.ts
└── index.ts
```

Такая форма отделяет pure business от concrete runtime, но разносит одну предметную область по разным архитектурным местам. Level 3 колоцирует их внутри Domain, не смешивая роли.

## Целевая форма

```text
domains/auth/
├── business/
│   ├── auth.factory.ts
│   ├── errors/
│   ├── lib/
│   ├── ports/
│   ├── services/
│   ├── types/
│   └── index.ts
├── presets/
│   ├── application/
│   │   ├── adapters/
│   │   └── index.ts
│   └── request/
│       └── index.ts
└── react/
    ├── hooks/
    ├── providers/
    └── index.ts
```

## Разделение обязанностей

| Исходная часть | Назначение в Level 3 |
|---|---|
| `auth.factory.ts`, scenarios, validators, domain errors | `domains/auth/business` |
| SDK, storage и state manager integration | Private adapters выбранного preset |
| Повторяемый browser builder | `domains/auth/presets/application` |
| Request-specific cookies, headers и client | `domains/auth/presets/request` |
| React hooks, provider и domain UI | `domains/auth/react` |
| Page text, redirect и screen outcome | Consumer composition |

## Проверка границ

`authFactory` не импортирует `useAuth`, `'use client'`, SDK или storage. React hook строится поверх готового `AuthApi`, например через framework-neutral `getSnapshot` и `subscribe`.

Нормализация номера телефона может быть public pure business function:

```ts
import {
  normalizeAuthPhone,
  validateAuthPhone,
} from '@/domains/auth/business'
```

UI использует её для feedback, но `requestPhoneOtp` повторно валидирует значение внутри business scenario.

## Error contract

`AuthBusinessError` остаётся private implementation. Consumer получает только stable contract:

```ts
import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business'
```

Так React composition может выбрать сообщение или retry behavior по `code`, не зная SDK error, HTTP status или constructor private ошибки.

## Migration order

1. Выделить `business` entrypoint и убедиться, что его transitive graph isomorphic.
2. Перенести concrete runtime в adapters выбранного preset.
3. Оформить повторяемую assembly как `presets/application`.
4. Перенести hooks и Provider в `react`, передавая им готовый API.
5. Сохранить page-specific UI и graph ownership в `compositions`.
6. Добавить factory, adapter, preset и React boundary tests до удаления старого пути.
