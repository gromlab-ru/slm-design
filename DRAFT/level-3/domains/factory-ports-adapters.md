# Factory, ports и adapters

> Рабочая заметка. Не является нормативным разделом спецификации.

## Терминология

### FAC-N003: Собирается API instance, а не factory

```text
Factory + Deps implementations → business API instance
```

- Factory является функцией создания.
- Ports являются business-owned контрактами capabilities.
- `Deps` группирует ports, нужные factory.
- Adapters реализуют ports в concrete runtime.
- Assembly site вызывает factory и получает API instance.
- Preset является готовой конфигурацией assembly.

Формулировка «собранная фабрика» неточна. Factory конфигурируется зависимостями и создаёт собранный API.

## Business factory

### FAC-N004: Factory является framework-neutral и environment-neutral

Factory не знает, где будет использована:

- в browser;
- во время SSR;
- в server action;
- в background process;
- в unit test;
- в React, Vue или другом framework.

```ts
export type AuthFactory = (deps: AuthDeps) => AuthApi
```

### FAC-N005: Factory имеет стабильную форму результата

Все presets одной factory создают один и тот же business API contract. Среда не выбирается через аргумент `mode`, а форма API не зависит от наличия optional dependency.

Не рекомендуется:

```ts
authFactory({
  mode: 'server',
  serverAdminClient: optionalClient,
})
```

Не рекомендуется возвращать методы, которые существуют в общем API, но намеренно падают в одной из сред.

### FAC-N006: Factory construction не выполняет side effects

Вызов factory не должен:

- выполнять network request;
- читать cookies, storage или env;
- запускать subscription или timer;
- обращаться к browser либо Node API;
- создавать скрытый application singleton;
- выбирать concrete adapter;
- выполнять framework lifecycle.

Factory может синхронно создать детерминированные services и связать их с переданными ports.

## Гигиена import graph

### FAC-N007: Весь достижимый из business import graph должен быть изоморфным

Недостаточно проверить только файл `{domain}.factory.ts`. Ни один production import, достижимый из business public entrypoint, не должен приводить к:

- React, Vue, Next.js и другим frameworks;
- `'use client'`, `client-only` или `server-only` boundary;
- browser API;
- Node-only API;
- concrete SDK/client;
- concrete storage;
- state/query runtime;
- adapters и presets;
- environment configuration.

Tree shaking не используется как доказательство изоляции.

## Ports

### PORT-N001: Port принадлежит business

Port описывает capability на языке business, а не форму concrete implementation.

```ts
export type AuthPhonePort = {
  requestCode: (phone: string) => Promise<unknown>
  verifyCode: (data: VerifyPhoneOtpData) => Promise<unknown>
}
```

Port не должен раскрывать SDK client, generated operation, `Request`, `Window`, React hook, Zustand `StoreApi` и другие environment/framework types.

### PORT-N002: Ports абстрагируют implementation, но не доступность capability

Одна factory возможна, пока каждый preset способен реализовать одинаковые ports.

Server capability может остаться общим port, если browser adapter реализует её через безопасный HTTP/RPC boundary. Если capability принципиально невозможно реализовать в одной из поддерживаемых сред, её нельзя маскировать optional dependency общего API.

### PORT-N003: Reactive port должен быть framework-neutral

Client hook в `Deps` делает контракт client-oriented. Вместо `useToken` базовый port может описывать framework-neutral observation protocol:

```ts
export type AuthSessionPort = {
  getSnapshot: () => AuthState
  subscribe: (listener: () => void) => () => void
  setToken: (token: string | null) => void
}
```

React binding может построить `useAuth` поверх `getSnapshot` и `subscribe`. Vue binding использует тот же port через собственный lifecycle.

Точная форма reactive ports требует отдельной проверки на реальном state manager.

## Adapters

### ADP-N001: Adapter реализует business port

Adapter знает одновременно business contract и concrete runtime:

```text
business port ← adapter → SDK / storage / browser / request
```

Adapter может:

- преобразовать domain arguments в transport arguments;
- вызвать concrete source;
- привести concrete runtime к минимальной форме port;
- управлять техническими деталями конкретной integration.

Adapter не должен:

- определять business error code;
- выбирать domain fallback;
- менять business invariant;
- расширять public business API методами concrete client.

### ADP-N002: Adapter размещается у минимального владельца

SLM не задаёт обязательную структуру `adapters/browser`, `adapters/server` или другую техническую классификацию.

Adapter может быть:

- private файлом или segment конкретного preset module;
- самостоятельным Domain module после появления нескольких assembly consumers;
- частью пользовательской logical group, если она действительно упрощает навигацию.

Default colocation для adapter, принадлежащего одной assembly:

```text
domains/auth/presets/{preset-name}/
├── adapters/
├── create-auth.ts
└── index.ts
```

Возможный promotion переиспользуемого adapter:

```text
domains/auth/adapters/          # optional logical group
└── {adapter-name}/             # adapter module
    └── index.ts
```

Environment-specific code не должен быть достижим из entrypoint, объявленного framework-neutral или environment-neutral. Способ физической изоляции выбирает проект. Группировка по `browser/server` допустима как локальное соглашение, но не является требованием SLM.

## Assembly sites

### ASM-N001: Вызов factory определяет роль assembler

Factory может быть вызвана в preset, provider, route/request composition, test setup или другом месте. Путь сам по себе не запрещает сборку.

Assembly site обязан:

- предоставить полный `Deps`;
- выбрать concrete adapters;
- определить предполагаемый scope API instance;
- вернуть необходимые lifecycle/dispose handles;
- не скрывать создание graph от фактического владельца.

После возврата результата lifecycle принадлежит caller/graph owner, который удерживает API instance. Например, request владеет request-scoped instance, а Provider владеет instance до unmount. Preset описывает создание и передачу ownership, но не становится долгоживущим владельцем только из-за своего расположения.

### ASM-N002: Consumer использует готовый API

Screen, component или service, который только выполняет business-сценарий, получает готовый business API, например `AuthApi`. Если такой consumer вызывает factory, он становится assembler и должен удовлетворять всем требованиям assembly role.

### ASM-N003: Cross-domain dependency получает собранный API

Business одного Domain не создаёт factory другого Domain внутри себя. Он описывает необходимую capability через свой `Deps`, а graph owner передаёт уже собранный API.

Tests вправе напрямую вызывать factory с mocks и fakes. Это один из основных сценариев существования factory.
