# Assemblies и production-граф

> Пояснение обязательной штатной сборки, дополнительных контекстов, environment compatibility и lifecycle.

## Связанные правила

- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ASSEMBLY-R011`](../../rules/level-2.md#slm-l2-assembly-r011)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-API-A022`](../../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-ASSEMBLY-R023`](../../rules/level-2.md#slm-l2-assembly-r023)
- [`SLM-L2-ASSEMBLY-R030`](../../rules/level-2.md#slm-l2-assembly-r030)
- [`SLM-L2-ASSEMBLY-R031`](../../rules/level-2.md#slm-l2-assembly-r031)

## Назначение

Assembly является SLM-модулем Group `assemblies`. Она выбирает production adapters своего домена, вызывает фабрики `api` и возвращает готовый именованный граф Domain API для одного объявленного production-контекста.

```text
api/factory + adapters + cross-domain APIs
  → assembly
  → named Domain API graph
```

Assembly не добавляет предметные методы, модели, transitions или ошибки. Она также не владеет framework state: готовый API передаётся framework binding или composition.

Импорт assembly не запускает side effects. Граф появляется только после вызова builder.

## Обязательная default assembly

Каждый пакет содержит модуль `assemblies/default`:

```text
auth/assemblies/
├── default/
│   └── index.ts
└── administration/
    └── index.ts
```

`default` является штатной production-сборкой домена для одного baseline capability set, объявленного проектом. Она может быть browser-only, server-only, worker-compatible или действительно isomorphic. Имя не сообщает environment compatibility.

Пример metadata:

```yaml
assemblies:
  default:
    capabilities: [fetch, web-crypto]
    conditions: [browser, import]
  administration:
    capabilities: [node, server-secrets]
    conditions: [node, import]
```

Формат metadata не нормирован, но checker должен получать capability set и resolver conditions из явного project mapping, а не угадывать их по имени `default`.

## Дополнительные assemblies

Дополнительная assembly появляется, когда отличается реальная production-граница:

- набор Domain API;
- dependencies или providers;
- trust boundary;
- environment capabilities;
- scope или lifecycle;
- способ аутентификации;
- realtime guarantees.

Хорошие имена описывают контекст: `administration`, `realtime-session`, `worker`, `rsc`. Имя `rsc` оправдано только при отличающемся RSC wiring; само наличие Server Component не требует отдельной assembly.

Не создаётся assembly-заглушка с методами, бросающими `NOT_SUPPORTED`. Контекст возвращает только реально доступные API.

## Штатный граф

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'

import {
  createAuthSessionApi,
} from '@/domains/auth/api/factory'

import {
  createAuthRestAdapter,
} from '@/domains/auth/adapters/identity-rest'

export type AuthGraph = Readonly<{
  session: AuthSessionApi
}>

export const createAuth = (): AuthGraph => {
  const session = createAuthSessionApi({
    identity: createAuthRestAdapter(),
  })

  return { session }
}
```

Обычный graph owner импортирует только production builder:

```ts
import {
  createAuth,
} from '@/domains/auth/assemblies/default'

const auth = createAuth()
```

Factory и concrete adapter остаются construction details assembly. Тесты API и adapters импортируют соответствующие границы напрямую.

## React + Vite и Next.js

В React + Vite `default` часто использует browser adapters:

```text
assemblies/default
  → browser REST adapter
  → browser WebSocket adapter
```

В Next.js та же `default` может считаться isomorphic только при совместимом executable graph под всеми заявленными conditions. Runtime branch не делает импорт безопасным:

```ts
// Недостаточное доказательство изоморфности.
if (typeof window === 'undefined') {
  return createServerAdapter()
}

return createBrowserAdapter()
```

Если server и client требуют разных concrete dependencies, используются разные assemblies или framework-specific resolver entries, проверяемые отдельно.

## RSC boundary

RSC не переносит API instance с сервера в браузер:

```text
Server Component
  → request-scoped server assembly
  → server Domain API instance
  → public serializable value
  → Client Component boundary
  → separate client assembly
  → separate client Domain API instance
```

Server Component исполняется в server scope. Его импорт Client Component является framework reference, а не обычным executable edge RSC graph. При включённом SSR или prerender сам Client Component дополнительно исполняется в отдельном server render graph, а затем в browser hydration graph; обе фазы проверяются, а browser-only effects объявляются как framework-deferred edges. Server Action создаёт и очищает собственный request graph на каждый вызов.

Через boundary не передаются functions, API objects, ports, adapters, mutable cache clients или request secrets.

## Cross-domain input

Assembly зависимого домена принимает готовый API аргументом:

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'

export type CreateUserInput = Readonly<{
  auth: Pick<AuthSessionApi, 'getSession'>
}>

export const createUser = ({
  auth,
}: CreateUserInput): UserGraph => {
  const profile = createUserProfileApi({
    auth,
    profile: createUserProfileRestAdapter(),
  })

  return { profile }
}
```

Graph owner выполняет runtime-связь:

```ts
const auth = createAuth()
const user = createUser({
  auth: auth.session,
})
```

User assembly делает только type-only импорт Auth API. Она не импортирует Auth factory, adapter или assembly. Общий runtime dependency graph остаётся ацикличным.

## Dependency-connected graph

Наличие `assemblies/default` у каждого Level 2 package не требует eager-сборки всех доменов:

```text
route A
  → auth/default
  → user/default

route B
  → catalog/default
```

Graph owner вызывает только builders, необходимые текущему scope. Module-level вызов `createAuth()` и global registry готовых APIs нарушают явное владение scope.

## Lifecycle

Factory не запускает запрос, socket, subscription или timer во время создания API. Явная операция, которая позже запускает ресурс, возвращает cleanup:

```ts
const subscription = await chat.subscribe(observer)

try {
  await runScope()
} finally {
  await subscription.close()
}
```

Если assembly создаёт owned resource или получает lifecycle handle adapter-owned resource, результат предоставляет aggregate cleanup:

```ts
export type ChatAssembly = Readonly<{
  apis: ChatGraph
  dispose: () => Promise<void>
}>
```

Cleanup является идемпотентным. После завершившегося cleanup resource не вызывает callbacks.

У каждого resource ровно один owner. Adapter, который сам создаёт connection или source cache, остаётся владельцем и экспортирует lifecycle handle; assembly только включает этот handle в aggregate cleanup. Если connection создаёт assembly, adapter получает borrowed capability и не закрывает её самостоятельно.

## Частичная ошибка сборки

Assembly регистрирует cleanup сразу после создания каждого owned resource и сразу после получения adapter lifecycle handle. Если следующий шаг завершается ошибкой, все зарегистрированные obligations выполняются до передачи ошибки caller-у:

```ts
export const createChat = async (): Promise<ChatAssembly> => {
  const cleanups: Array<() => Promise<void>> = []

  try {
    const connection = await createRealtimeConnection()
    cleanups.push(connection.close)

    const history = createHistoryAdapter(connection)
    const messages = createMessagesApi({ history })

    return {
      apis: { messages },
      dispose: createIdempotentReverseCleanup(cleanups),
    }
  } catch (error) {
    await runReverseCleanup(cleanups)
    throw error
  }
}
```

Реализация helper не нормирована. Нормативны достижимость cleanup на failure path, обратный dependency order и отсутствие callbacks после завершения disposal.

Assembly без cleanup obligations возвращает только API graph и не добавляет пустой `dispose` для симметрии. Наличие adapter-owned resource с переданным handle уже является cleanup obligation, даже если assembly не считается его владельцем.
