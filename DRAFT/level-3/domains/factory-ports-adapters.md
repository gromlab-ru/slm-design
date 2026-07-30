# Factory, ports и adapters

> Пояснение runtime boundary business module.

## Связанные правила

- [`SLM-L3-FACTORY-R005`](../../rules/level-3.md#slm-l3-factory-r005)
- [`SLM-L3-FACTORY-R006`](../../rules/level-3.md#slm-l3-factory-r006)
- [`SLM-L3-PORT-R007`](../../rules/level-3.md#slm-l3-port-r007)
- [`SLM-L3-ADAPTER-R008`](../../rules/level-3.md#slm-l3-adapter-r008)
- [`SLM-L3-BUSINESS-A004`](../../rules/level-3.md#slm-l3-business-a004)

## Factory и API instance

```text
Factory + implementations ports -> business API instance
```

Factory принадлежит `business`, получает полный `AuthDeps` и возвращает `AuthApi`:

```ts
export type AuthFactory = (deps: AuthDeps) => AuthApi
```

Все presets одной factory предоставляют полный набор ports и получают одинаковый business API. Browser, request и server action не создают разные factory только из-за среды. Preset может открыть consumer суженный view API, но не меняет contract самой factory.

Factory construction создаёт только deterministic services и closures. Она не делает request, не читает cookies/storage/env, не запускает subscription/timer, не обращается к platform API, не выбирает adapter и не запускает framework lifecycle.

## Isomorphic import graph

Проверяется весь production graph, достижимый из `business` entrypoint, а не только файл factory. Он не должен достигать:

- React, Vue, Next.js и framework markers;
- browser-only, Node-only, `client-only` или `server-only` boundary;
- SDK, generated client, storage implementation или concrete state/query runtime;
- adapters, presets, framework modules и environment configuration.

Tree shaking не является доказательством изоляции. Type-only import concrete runtime создаёт ту же архитектурную зависимость и также запрещён.

## Ports

Port принадлежит business и описывает capability на business language:

```ts
export type AuthPhonePort = {
  requestCode: (phone: string) => Promise<unknown>
  verifyCode: (data: VerifyPhoneOtpData) => Promise<unknown>
}

export type AuthSessionPort = {
  getSnapshot: () => AuthState
  subscribe: (listener: () => void) => () => void
  setToken: (token: string | null) => void
}
```

Port не принимает SDK client, generated operation, `Request`, `Window`, React hook, `StoreApi` или environment-specific type. Он абстрагирует implementation, а не доступность capability: optional port и method, который намеренно падает в одной среде, нарушают factory contract.

`unknown` допустим только на границе непроверенного external result. Business обязан валидировать его до превращения в domain result, state или error. Если adapter уже может представить устойчивый business-owned result, port описывает именно этот result, а не concrete DTO.

## Adapters

Adapter соединяет business port и concrete runtime:

```text
business port <- adapter -> SDK / storage / platform / request input
```

Adapter может преобразовать domain argument в transport argument, вызвать concrete source, нормализовать техническую форму к port contract и вернуть source failure. Он не определяет domain error code, business fallback, invariant или public method `AuthApi`.

Default location -- private segment минимального preset owner:

```text
domains/auth/presets/application/
├── adapters/
│   └── auth-phone.adapter.ts
└── index.ts
```

Если один adapter имеет несколько assembly consumers или самостоятельную integration responsibility, он становится promoted module:

```text
domains/auth/adapters/
└── identity-provider/
    └── index.ts
```

Promoted adapter сохраняет минимальный public API. Его появление не делает concrete SDK частью public business contract.
