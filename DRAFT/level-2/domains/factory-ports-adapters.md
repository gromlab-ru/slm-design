# Фабрики, зависимости и adapters

> Пояснение границы между `business` и технической средой.

## Связанные правила

- [`SLM-L2-BUSINESS-A007`](../../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-BUSINESS-R018`](../../rules/level-2.md#slm-l2-business-r018)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L2-BUSINESS-R024`](../../rules/level-2.md#slm-l2-business-r024)

## Одна фабрика на API

```text
явные зависимости + business factory → один Domain API
```

Модуль `business` предоставляет одну именованную фабрику для каждого объявленного API. Фабрики экспортируются через общий runtime-фасет `business/factory`:

```ts
import type {
  AuthAdministrationApi,
  AuthAdministrationDeps,
  AuthSessionApi,
  AuthSessionDeps,
} from '@/domains/auth/business'

export type AuthSessionFactory = (
  deps: AuthSessionDeps,
) => AuthSessionApi

export type AuthAdministrationFactory = (
  deps: AuthAdministrationDeps,
) => AuthAdministrationApi
```

```ts
import {
  authAdministrationFactory,
  authSessionFactory,
} from '@/domains/auth/business/factory'
```

Фабрика не выбирает environment, assembly или конкретную production-реализацию зависимости. Разные API могут иметь разные наборы deps и собираться независимо.

## Технические зависимости

Зависимости фабрики описывают возможности, необходимые business-сценариям. Они не раскрывают конкретный SDK, framework hook, generated operation или объект платформы.

```ts
export type AuthPhoneDependency = {
  requestCode: (phone: string) => Promise<unknown>
  verifyCode: (code: string) => Promise<unknown>
}
```

`unknown` допустим на границе непроверенного внешнего результата. `business` проверяет его до превращения в предметные данные или состояние.

Техническими зависимостями также являются:

- concrete state/query runtime;
- subscription и event source;
- browser, Node.js и framework capabilities;
- request data и abort signal;
- текущее время и timer;
- random и ID generator;
- environment и runtime configuration provider.

```ts
export type VerificationDeps = {
  clock: { now: () => number }
  ids: { create: () => string }
  timer: { delay: (ms: number) => Promise<void> }
}
```

`Date.now()`, `new Date()` без аргумента, `Math.random()`, `crypto.randomUUID()`, скрытый env и глобальный timer не читаются напрямую business-кодом, если влияют на поведение сценария. Детерминированная арифметика над переданным timestamp остаётся business-safe.

Cancellation также описывается business-owned контрактом. Concrete `AbortSignal` или другой platform type остаётся внутри adapter, пока не принят отдельный общий публичный контракт.

Термин и обязательная поведенческая форма технического порта пока не закреплены. В частности, позднее нужно определить cancellation, timeout, retry, concurrency и subscription semantics.

## Cross-domain API dependency

Готовый API другого домена не считается техническим adapter-портом. Это отдельная cross-domain API dependency, выраженная type-only контрактом:

```ts
import type { AuthSessionApi } from '@/domains/auth/business'

export type UserDeps = {
  auth: Pick<AuthSessionApi, 'getSnapshot'>
}
```

Runtime-значение место сборки графа передаёт через assembly либо напрямую зависимой business-фабрике. `user/business` не импортирует executable factory, assembly или instance Auth.

Если exception-модели нужен runtime guard чужой ожидаемой ошибки, зависимый business может импортировать его из детерминированного `auth/business/runtime`. Этот импорт остаётся обычным ребром DAG.

## Adapter module

Adapter module соединяет явную техническую зависимость фабрики с конкретной системой:

```text
business dependency ← adapter → SDK / query runtime / platform / request data
```

Adapter преобразует аргументы и технический результат к контракту зависимости. Он не определяет публичный метод Domain API, предметный fallback или код доменной ошибки.

Ожидаемый исходный сбой возвращается `business`, который выбирает собственный error code. Поэтому приложение не строит поведение по HTTP status, SDK error class или storage exception.

Adapter может использовать TanStack Query, Apollo, Zustand или другой state/query runtime, если реализует business-owned dependency. Library types, query keys и mutable clients не протекают в public types `business`.

## Размещение adapters

Каждая связная production-реализация является отдельным SLM-модулем в Group `adapters`:

```text
auth/adapters/
├── phone-http/
│   └── index.ts
├── browser-session/
│   └── index.ts
└── browser-runtime/
    └── index.ts
```

Один adapter-модуль может реализовать несколько тесно связанных зависимостей одного technical provider. Например, `browser-runtime` может предоставить clock, timer и ID generator. Правило не требует отдельного модуля для каждого метода deps.

Adapter module имеет собственные ответственность, публичный API, environment label и тестовую границу. Group `adapters` не имеет `index.ts` и не реэкспортирует дочерние модули.

Production adapter запрещено определять:

- закрытым сегментом assembly;
- inline-функцией в `composition` или `app`;
- частью framework binding module;
- скрытой реализацией внутри `business`.

Assembly и одноразовое место сборки импортируют конкретные adapter-модули через их публичные API:

```ts
import { authSessionFactory } from '@/domains/auth/business/factory'
import { createPhoneHttpAdapter } from '@/domains/auth/adapters/phone-http'
import { createBrowserRuntimeAdapter } from '@/domains/auth/adapters/browser-runtime'

const session = authSessionFactory({
  phone: createPhoneHttpAdapter(),
  runtime: createBrowserRuntimeAdapter(),
})
```

Если ни одна фабрика не имеет технических зависимостей, Group `adapters` не обязательна. Cross-domain API dependency не считается adapter и передаётся отдельно.

Локальные fake implementations в business-тестах не являются production adapters и не требуют SLM-модулей. Они существуют только внутри тестовой границы и не экспортируются в рабочий код.
