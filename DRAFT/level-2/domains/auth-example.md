# Миграция домена auth с Level 1

> Проверочный пример перехода от доменного модуля к доменному пакету.

## Связанное правило

- [`SLM-L2-MIGRATION-A017`](../../rules/level-2.md#slm-l2-migration-a017)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-PRESET-A020`](../../rules/level-2.md#slm-l2-preset-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

## Исходная форма Level 1

```text
domains/auth/                  # Доменный модуль
├── hooks/
├── services/
├── stores/
├── ui/
└── index.ts                  # Общий API модуля
```

Level 1 разрешает business-сценариям, framework hooks, state adapter и локальной сборке находиться внутри одного модуля.

## Целевая форма Level 2

```text
domains/auth/                  # Доменный пакет
├── README.md
├── business/                 # SLM-модуль
│   ├── errors/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── index.ts              # Только public types
│   ├── factory.ts            # Public factory entry
│   └── error.ts              # Public error runtime entry
├── adapters/                 # Group
│   ├── phone-http/           # SLM-модуль
│   │   └── index.ts
│   ├── browser-session/      # SLM-модуль
│   │   └── index.ts
│   └── request-session/      # SLM-модуль
│       └── index.ts
├── presets/                  # Обязательная Group
│   ├── browser/              # SLM-модуль
│   │   └── index.ts
│   └── request/              # SLM-модуль
│       └── index.ts
└── react/                    # Framework Group
    ├── session/              # SLM-модуль
    │   └── index.ts
    └── login-form/           # SLM-модуль
        └── index.ts
```

Корневой `domains/auth/index.ts` удаляется. Потребители переходят на публичные API конкретных модулей.

## Перенос ответственности

| Исходная часть | Владелец Level 2 | Публичный путь |
|---|---|---|
| Сценарии и public types | `auth/business` | `auth/business` |
| Runtime-фабрика | `auth/business` | `auth/business/factory` |
| Коды и guards ошибок | `auth/business` | `auth/business/error` |
| Browser storage и HTTP adapters | Соответствующий adapter-модуль | `auth/adapters/*` |
| Cookies, request data и server adapters | Соответствующий adapter-модуль | `auth/adapters/*` |
| Выбор browser implementations | `auth/presets/browser` | `auth/presets/browser` |
| Выбор request implementations | `auth/presets/request` | `auth/presets/request` |
| Provider и session hooks | `auth/react/session` | `auth/react/session` |
| Переиспользуемая форма | `auth/react/login-form` | `auth/react/login-form` |
| Страница, текст и redirect | `compositions` | API конкретной composition |

## Новые импорты

```ts
import type {
  AuthApi,
  AuthError,
  AuthErrorCode,
} from '@/domains/auth/business'

import { authFactory } from '@/domains/auth/business/factory'
import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/error'

import { createPhoneHttpAdapter } from '@/domains/auth/adapters/phone-http'
import { createBrowserAuth } from '@/domains/auth/presets/browser'
import { AuthSessionProvider } from '@/domains/auth/react/session'
import { LoginForm } from '@/domains/auth/react/login-form'
```

## Cross-domain граф

Если User зависит от Auth, оба связанных домена сначала переводятся в пакеты. Затем User получает только type-only контракт:

```ts
import type { AuthApi } from '@/domains/auth/business'

export type UserDeps = {
  auth: Pick<AuthApi, 'getSession'>
}
```

Место сборки графа создаёт экземпляры:

```ts
const authApi = createBrowserAuth()
const userApi = createBrowserUser({ authApi })
```

User не импортирует runtime-код Auth, а его React-модули не импортируют `useAuthSession` или Auth components.

## Порядок перехода

1. Определить dependency-connected набор доменов, который нужно мигрировать вместе.
2. Выделить `business` и три публичных фасета: type-only barrel, `factory` и `error`.
3. Зафиксировать `DomainApi`, error codes, error type и runtime guard.
4. Оформить каждую production implementation отдельным модулем `adapters/*`.
5. Создать минимум один preset и перенести туда повторяемый выбор adapter-модулей.
6. Разделить React-ответственности на модули внутри Group `react`.
7. Перенести страницы, redirects и multi-domain UI в `compositions`.
8. Перевести внешние импорты на разрешённые public paths.
9. Удалить старый root `index.ts` и проверить import-граф.

Простые доменные модули могут оставаться в SLM root только как временное миграционное состояние. Они не создают прямые runtime- или type-only зависимости с уже переведёнными пакетами.
