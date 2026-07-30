# Presets и SSR

> Пояснение повторяемой assembly Domain.

## Связанные правила

- [`SLM-L3-PRESET-R009`](../../rules/level-3.md#slm-l3-preset-r009)
- [`SLM-L3-ASSEMBLY-R010`](../../rules/level-3.md#slm-l3-assembly-r010)
- [`SLM-L3-ENVIRONMENT-A012`](../../rules/level-3.md#slm-l3-environment-a012)
- [`SLM-L3-FACTORY-R006`](../../rules/level-3.md#slm-l3-factory-r006)

## Роль preset

Preset -- именованная повторяемая assembly одной business factory для конкретного execution context. Он выбирает concrete implementations ports, создаёт `AuthApi` и передаёт caller lifecycle operations, определённые module-владельцами resources.

```text
authFactory
├── presets/application -> browser-compatible AuthApi
├── presets/request     -> request-scoped AuthApi
└── presets/server-action -> server action AuthApi
```

Среда определяется preset и adapters, а не `mode` внутри factory. Tests создают per-test assembly напрямую через factory и не требуют общего `presets/testing`.

## Структура и public API

```text
domains/auth/presets/application/
├── adapters/
├── create-application-auth.ts
├── create-application-auth.test.ts
└── index.ts
```

`application` -- пример имени. Preset называется по execution scope или устойчивому назначению: `application`, `request`, `server-action`. Он не называется по temporary consumer, если configuration не предназначена для повторного использования.

```ts
export const createApplicationAuth = (): AuthApi => {
  return authFactory({
    phone: createApplicationAuthPhoneAdapter(),
    session: createApplicationAuthSessionAdapter(),
  })
}
```

Preset не добавляет scenario, не меняет error mapping и не скрывает business rule. Он также не становится монополией на factory: явный composition graph owner может собрать одноразовый graph, если он принимает на себя все обязанности assembly.

## Scope и lifecycle

Preset объявляет ожидаемый scope API instance. Application preset используется в application scope; request preset создаёт новый instance для каждого request. Graph owner удерживает instance только в этом scope и не хранит request data в application singleton.

Если assembly создаёт lifecycle resource, caller получает явный cleanup handle:

```ts
export type AuthRequestAssembly = {
  api: AuthApi
  dispose: () => void | Promise<void>
}

export const createAuthForRequest = (
  input: AuthRequestInput,
): AuthRequestAssembly => {
  const session = createRequestSessionAdapter(input)

  return {
    api: authFactory({
      phone: createRequestAuthPhoneAdapter(input),
      session,
    }),
    dispose: session.dispose,
  }
}
```

Factory и preset construction не запускают I/O или subscriptions. Если domain lifecycle должен начать resource, module-владелец выражает это отдельной API operation; graph owner вызывает её после начала scope и выполняет предоставленный cleanup при его завершении.

## Server-only boundary

Server preset имеет отдельный entrypoint и marker выбранного framework/build system:

```ts
import 'server-only'

export { createAuthForRequest } from './create-auth-for-request'
```

Этот entrypoint не реэкспортируется через `business`, `react` или client-compatible preset. Server adapter может иметь собственный marker для защиты от ошибочного прямого import.

Framework module не вызывает preset и не создаёт factory. Он получает готовый `AuthApi` от graph owner, поэтому React lifecycle не смешивается с concrete assembly.
