# Миграция домена auth с Level 1

> Проверочный пример перехода от доменного модуля к доменному пакету.

## Связанное правило

- [`SLM-L2-MIGRATION-A017`](../../rules/level-2.md#slm-l2-migration-a017)

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
│   └── index.ts
├── presets/                  # Group
│   ├── browser/              # SLM-модуль
│   │   ├── adapters/
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

| Исходная часть | Владелец Level 2 |
|---|---|
| Сценарии, предметные типы, единый API | `auth/business` |
| Коды, тип и guard ошибок | `auth/business` |
| Browser storage и HTTP adapters | `auth/presets/browser` |
| Cookies, request data и server adapters | `auth/presets/request` |
| Provider и session hooks | `auth/react/session` |
| Переиспользуемая форма | `auth/react/login-form` |
| Страница, текст и redirect | `compositions` |

## Новые импорты

```ts
import { authFactory, isAuthError } from '@/domains/auth/business'
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
2. Выделить `business` и одну фабрику без environment-specific import-графа.
3. Зафиксировать `DomainApi`, error codes, error type и runtime guard.
4. Перенести browser/server wiring в нужные presets и adapters.
5. Разделить React-ответственности на модули внутри Group `react`.
6. Перенести страницы, redirects и multi-domain UI в `compositions`.
7. Перевести внешние импорты на module-specific paths.
8. Удалить старый root `index.ts` и проверить import-граф.

Простые доменные модули могут оставаться в SLM root только как временное миграционное состояние. Они не создают прямые runtime- или type-only зависимости с уже переведёнными пакетами.
