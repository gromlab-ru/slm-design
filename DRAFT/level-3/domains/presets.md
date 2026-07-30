# Presets и SSR

> Рабочая заметка. Не является нормативным разделом спецификации.

## Определение

### PRE-N003: Preset является готовым вариантом assembly

Preset выбирает implementations ports и создаёт API одной business factory для конкретного execution context.

```ts
export const createKnvAuthBusiness = (): AuthApi => {
  return authFactory({
    authPhone: knvAuthPhoneAdapter,
    session: appAuthSessionAdapter,
  })
}
```

`createKnvAuthBusiness` является preset builder, а не второй factory и не единственно допустимое место сборки.

## Несколько presets одной factory

```text
authFactory
├── createBrowserAuth
├── createAuthForRequest
├── createAuthForServerAction
└── другие production presets

tests и custom graph owners могут вызывать authFactory напрямую
```

### PRE-N004: Presets могут отличаться adapters и lifecycle

Browser preset может использовать browser storage и query runtime. Request preset может использовать cookies, headers и request-scoped client. Tests вместо общего preset создают локальную per-test assembly с memory ports, mocks или fakes.

Business rules и форма создаваемого `AuthApi` при этом не меняются.

### PRE-N005: Preset может предоставлять суженный API view

Preset может не раскрывать consumer все методы созданного API:

```ts
export type AuthSsrApi = Pick<AuthApi, 'resolveSession'>

export const createAuthForRequest = (
  input: AuthRequestInput,
): AuthSsrApi => {
  const authApi = authFactory(createRequestAuthDeps(input))

  return {
    resolveSession: authApi.resolveSession,
  }
}
```

Это ограничивает contract конкретного scope, но не создаёт новую business factory.

## SSR

### PRE-N006: Request владеет instance, созданным request preset

Если API зависит от cookies, headers, tenant, locale, request ID или abort signal, preset создаёт новый instance для каждого request и передаёт ownership вызывающему request scope.

Application singleton для request data недопустим, потому что может смешать состояния независимых запросов. Если preset создаёт disposable resource, результат должен позволить request owner выполнить cleanup.

Предварительная форма:

```ts
import 'server-only'

export const createAuthForRequest = (
  input: AuthRequestInput,
): AuthApi => {
  return authFactory({
    authPhone: createServerAuthPhoneAdapter(input),
    session: createRequestSessionAdapter(input),
  })
}
```

### PRE-N007: SSR использует тот же business contract

Преимущества одной factory:

- одинаковые business rules в browser и на server;
- одинаковые domain types и errors;
- request adapters не протекают в business;
- factory тестируется без Next.js;
- backend, cookies и headers заменяются независимо;
- server rendering не требует второй реализации business.

## Server-only boundary

### PRE-N008: Environment-specific preset может иметь отдельный public entrypoint

Если preset должен быть недостижим из client graph, проект может выделить для него отдельный entrypoint и использовать framework/build marker. Имя и физическая группировка preset не задаются SLM.

```ts
// Один из возможных server-only preset entrypoints.
import 'server-only'

export { createAuthForRequest } from './create-auth-for-request'
```

Этот entrypoint не реэкспортируется через:

- `domains/auth/business`;
- browser preset;
- React client binding;
- общий Domain barrel.

Server adapters также могут иметь собственный `server-only` marker для защиты от ошибочного прямого импорта.

### PRE-N009: Isomorphic factory не импортирует server-only marker

`server-only` относится к preset/framework boundary, а не к business factory. Это позволяет вызывать factory в unit tests, другом server framework или browser preset.

## Browser boundary

### PRE-N010: Client-compatible preset не достигает server-only graph

Client-compatible preset импортирует только isomorphic business и совместимые с ним adapters. Secrets, privileged SDK и Node-only modules не должны входить в его transitive import graph.

Framework marker `'use client'` размещается в framework binding или client entrypoint, а не в business.

## Preset не является обязательным посредником

### PRE-N011: Custom assembly остаётся допустимой

Graph owner может напрямую вызвать factory:

```ts
const authApi = authFactory({
  authPhone: customAuthPhoneAdapter,
  session: memorySessionAdapter,
})
```

Preset нужен для повторяемой готовой конфигурации. Он не ограничивает DI-возможности factory.
