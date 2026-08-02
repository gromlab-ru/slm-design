# Переход домена auth с Level 1

> Проверочный пример локального перехода от доменного модуля к пакету с Domain API, ports, adapters и default assembly.

## Связанные правила

- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-API-R005`](../../rules/level-2.md#slm-l2-api-r005)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-API-A022`](../../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-DOMAIN-A026`](../../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-PORT-R027`](../../rules/level-2.md#slm-l2-port-r027)
- [`SLM-L2-STATE-R028`](../../rules/level-2.md#slm-l2-state-r028)

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

Level 1 разрешает external calls, framework hooks, state и Auth scenarios внутри одной module boundary.

## Целевая форма Auth

```text
domains/
├── auth/                         # Доменный пакет Level 2
│   ├── README.md
│   ├── api/                      # Один SLM-модуль
│   │   ├── errors/
│   │   ├── factories/
│   │   ├── models/
│   │   ├── operations/
│   │   ├── ports/
│   │   ├── index.ts              # Consumer-facing types
│   │   ├── ports.ts              # Implementer-facing types
│   │   ├── factory.ts            # Domain API factories
│   │   └── runtime.ts            # Guards и public pure runtime
│   ├── adapters/                 # Group
│   │   ├── identity-rest/        # SLM-модуль
│   │   ├── identity-realtime/    # SLM-модуль
│   │   └── request-session/      # SLM-модуль
│   ├── assemblies/               # Обязательная Group
│   │   ├── default/              # Штатный Auth graph
│   │   └── administration/       # Специальный trusted graph
│   └── react/                    # Framework Group
│       ├── session/              # Provider готового API
│       ├── queries/              # Query/cache projection
│       └── login-form/           # Переиспользуемый domain UI
└── catalog/                      # По-прежнему модуль Level 1
    └── index.ts
```

Корневой `domains/auth/index.ts` удаляется. `catalog` и остальные домены не меняют форму только из-за перехода Auth.

## Перенос ответственности

| Исходная часть | Владелец Level 2 | Публичный путь |
|---|---|---|
| Session operations и public models | `auth/api` | `auth/api` |
| Port contracts и failures | `auth/api` | `auth/api/ports` |
| Runtime factories | `auth/api` | `auth/api/factory` |
| Error guards и public pure-функции | `auth/api` | `auth/api/runtime` |
| REST provider mapping | `auth/adapters/identity-rest` | Adapter API для assembly |
| Realtime protocol и correlation | `auth/adapters/identity-realtime` | Adapter API для assembly |
| Request cookies mapping | `auth/adapters/request-session` | Adapter API для assembly |
| Штатный production graph | `auth/assemblies/default` | `auth/assemblies/default` |
| Trusted administration graph | `auth/assemblies/administration` | `auth/assemblies/administration` |
| Provider и session hooks | `auth/react/session` | `auth/react/session` |
| Query/cache/hydration | `auth/react/queries` | `auth/react/queries` |
| Переиспользуемая форма | `auth/react/login-form` | `auth/react/login-form` |
| Страница, текст и redirect | `compositions` | API конкретной composition |

## Domain API и port

```ts
export type AuthSessionApi = {
  getSession: () => Promise<AuthSession>
  requestPhoneOtp: (
    command: RequestPhoneOtpCommand,
  ) => Promise<RequestPhoneOtpOutcome>
  verifyPhoneOtp: (
    command: VerifyPhoneOtpCommand,
  ) => Promise<AuthSession>
}
```

```ts
export type AuthIdentityPort = {
  requestPhoneOtp: (
    command: AuthIdentityPortCommand,
  ) => Promise<AuthIdentityPortResult>
  verifyPhoneOtp: (
    command: VerifyIdentityPortCommand,
  ) => Promise<VerifyIdentityPortResult>
}
```

REST adapter реализует этот port поверх generated client. API проверяет records и преобразует port failures в `AuthError`.

## Штатная сборка

```ts
import {
  createAuthSessionApi,
} from '@/domains/auth/api/factory'

import {
  createIdentityRestAdapter,
} from '@/domains/auth/adapters/identity-rest'

export const createAuth = (): AuthGraph => ({
  session: createAuthSessionApi({
    identity: createIdentityRestAdapter(),
  }),
})
```

Обычный production consumer использует:

```ts
import {
  createAuth,
} from '@/domains/auth/assemblies/default'
```

Он не импортирует factory или adapter напрямую.

## Framework state

Старый `auth/stores` не переносится в `api`. React query/store projection принадлежит `auth/react/queries`:

```ts
export const useAuthSessionQuery = () => {
  const api = useAuthApi()

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: api.getSession,
  })
}
```

При Vue или другом framework та же модель и errors Domain API материализуются его собственными средствами.

## Realtime

`identity-realtime` скрывает socket protocol, operation IDs, acknowledgements и reconnect. Domain API возвращает обычный command outcome и публикует проверенные Auth events.

Если disconnect произошёл до acknowledgement, API не утверждает ложный отказ и может вернуть `AUTH_OPERATION_OUTCOME_UNKNOWN`. После gap binding получает `RESYNC_REQUIRED` и повторно вызывает `getSession()`.

## RSC

Server Component создаёт request-scoped Auth graph и передаёт Client Component только сериализуемый `AuthSession` или hydration payload. Client Component создаёт отдельный client graph; при SSR его render должен быть совместим с server prerender, а browser-only capabilities остаются в deferred effects.

`assemblies/default` используется в обоих местах только если её executable graph действительно совместим со всеми declared conditions. Иначе появляется отдельная assembly, например `auth/assemblies/rsc`.

## Cross-domain graph

Если User package зависит от Auth, он импортирует только type contract:

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'
```

User assembly принимает готовый API:

```ts
const auth = createAuth()
const user = createUser({
  auth: auth.session,
})
```

User не импортирует Auth factory, port, adapter, assembly или React hooks. Если User остаётся модулем Level 1, его public API должен иметь явную точку передачи нужного Auth behavior.

## Порядок перехода

1. Зафиксировать consumers, external sources, state, errors и lifecycle исходного Auth module.
2. Объявить consumer-facing Domain API и public models.
3. Объявить dependency ports, records и closed failures.
4. Реализовать factory и проверить Domain API через fake ports.
5. Оформить каждую production implementation модулем `adapters/*` и добавить contract tests.
6. Создать `assemblies/default` для штатного production context.
7. Добавить специальные assemblies только для реально отличающихся graphs.
8. Перенести framework state, cache и hydration в modules Group `react`.
9. Перенести страницы, redirects и multi-domain UI в `compositions`.
10. Перевести внешние imports на разрешённые public paths.
11. Обновить dependency-connected graph owners и cross-domain inputs.
12. Удалить старый root `index.ts` Auth и объявить package checker-у.

Завершённость перехода определяется одной формой Auth и отсутствием обходных imports. Наличие других доменных модулей Level 1 не является миграционным долгом.
