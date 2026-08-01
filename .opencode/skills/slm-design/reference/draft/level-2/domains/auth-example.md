# Переход домена auth с Level 1

> Проверочный пример локального перехода от доменного модуля к доменному пакету.

## Связанные правила

- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-DOMAIN-A026`](../../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

## Исходная форма Level 1

```text
domains/
├── auth/                         # Доменный модуль
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── ui/
│   └── index.ts                 # Общий API модуля
└── catalog/                     # Независимый доменный модуль
    └── index.ts
```

Level 1 разрешает business-сценариям, framework hooks, state adapter и локальной сборке Auth находиться внутри одного модуля.

## Целевая форма Auth

```text
domains/
├── auth/                         # Доменный пакет Level 2
│   ├── README.md
│   ├── business/                 # Один SLM-модуль
│   │   ├── errors/
│   │   ├── factories/
│   │   ├── services/
│   │   ├── types/
│   │   ├── index.ts              # Только public types нескольких API
│   │   ├── factory.ts            # Public factories entry
│   │   └── runtime.ts            # Error codes, guards, public pure runtime
│   ├── adapters/                 # Group
│   │   ├── phone-http/           # SLM-модуль
│   │   ├── browser-session/      # SLM-модуль
│   │   └── request-session/      # SLM-модуль
│   ├── assemblies/               # Обязательная Group
│   │   ├── browser/              # Только AuthSessionApi
│   │   └── request/              # Session + Administration API
│   └── react/                    # Framework Group
│       ├── session/              # SLM-модуль
│       └── login-form/           # SLM-модуль
└── catalog/                      # По-прежнему модуль Level 1
    └── index.ts
```

Корневой `domains/auth/index.ts` удаляется. Потребители переходят на публичные API конкретных модулей. `catalog` и остальные домены не меняют форму только из-за перехода Auth.

## Перенос ответственности

| Исходная часть | Владелец Level 2 | Публичный путь |
|---|---|---|
| Session-сценарии и public types | `auth/business` | `auth/business` |
| Administration-сценарии и public types | `auth/business` | `auth/business` |
| Runtime-фабрики API | `auth/business` | `auth/business/factory` |
| Коды, guards и public pure-функции | `auth/business` | `auth/business/runtime` |
| Browser storage и HTTP adapters | Соответствующий adapter-модуль | `auth/adapters/*` |
| Cookies, request data и server adapters | Соответствующий adapter-модуль | `auth/adapters/*` |
| Browser graph | `auth/assemblies/browser` | `auth/assemblies/browser` |
| Request graph | `auth/assemblies/request` | `auth/assemblies/request` |
| Provider и session hooks | `auth/react/session` | `auth/react/session` |
| Переиспользуемая форма | `auth/react/login-form` | `auth/react/login-form` |
| Страница, текст и redirect | `compositions` | API конкретной composition |

## Новые импорты

```ts
import type {
  AuthAdministrationApi,
  AuthError,
  AuthErrorCode,
  AuthSessionApi,
} from '@/domains/auth/business'

import {
  authAdministrationFactory,
  authSessionFactory,
} from '@/domains/auth/business/factory'

import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/runtime'

import { createPhoneHttpAdapter } from '@/domains/auth/adapters/phone-http'
import { createBrowserAuth } from '@/domains/auth/assemblies/browser'
import { AuthSessionProvider } from '@/domains/auth/react/session'
import { LoginForm } from '@/domains/auth/react/login-form'
```

## Cross-domain граф

Если User package зависит от Auth, он получает только type-only API contract и при необходимости deterministic runtime:

```ts
import type { AuthSessionApi } from '@/domains/auth/business'
import { isAuthError } from '@/domains/auth/business/runtime'

export type UserDeps = {
  auth: Pick<AuthSessionApi, 'getSnapshot'>
}
```

Место сборки создаёт instances:

```ts
const auth = createBrowserAuth()
const user = createBrowserUser({ auth: auth.session })
```

User не импортирует Auth factory или assembly, а его React-модули не импортируют `useAuthSession` или Auth components.

Если User остаётся модулем Level 1, runtime-связь также выполняется снаружи доменных границ. Для этого его собственный API должен иметь явную точку передачи нужного Auth behavior; иначе именно User требуется рефакторинг или переход, но несвязанные домены не затрагиваются.

## Порядок перехода

1. Выбрать один доменный модуль и зафиксировать его внешние consumers.
2. Объявить `business` с type-only и factory entry points.
3. Разделить сценарии на независимо собираемые Domain API без дублирования методов.
4. Добавить `business/runtime`, только если внешним consumers нужны codes, guards или pure-функции.
5. Оформить каждую связную production implementation модулем `adapters/*`.
6. Создать минимум одну assembly и перенести туда повторяемый выбор API и adapters.
7. Разделить React-ответственности на модули внутри Group `react`.
8. Перенести страницы, redirects и multi-domain UI в `compositions`.
9. Перевести внешние импорты на разрешённые public paths.
10. Удалить старый root `index.ts` Auth и объявить пакетную форму checker-у.

Завершённость перехода определяется только границей Auth. Наличие других доменных модулей Level 1 не является миграционным долгом.
