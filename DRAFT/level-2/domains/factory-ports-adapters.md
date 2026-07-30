# Фабрика, зависимости и adapters

> Пояснение границы между `business` и технической средой.

## Связанные правила

- [`SLM-L2-BUSINESS-A007`](../../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

## Одна фабрика

```text
явные зависимости + business factory → DomainApi
```

Модуль `business` предоставляет одну публичную фабрику. Она получает все runtime-возможности явными аргументами и создаёт API одного контракта независимо от выбранного preset.

```ts
import type { AuthApi, AuthDeps } from '@/domains/auth/business'

export type AuthFactory = (deps: AuthDeps) => AuthApi
```

Runtime-фабрика импортируется только через отдельный entry point:

```ts
import { authFactory } from '@/domains/auth/business/factory'
```

Рекомендуется сохранять сам вызов фабрики чистым: он создаёт объекты и closures, но не читает скрытое окружение и не выбирает конкретную техническую реализацию. Детальный lifecycle ресурсов будет нормирован позже.

## Технические зависимости

Зависимости фабрики описывают возможности, необходимые business-сценариям. Они не раскрывают конкретный SDK, framework hook, generated operation или объект платформы.

```ts
export type AuthPhoneDependency = {
  requestCode: (phone: string) => Promise<unknown>
  verifyCode: (code: string) => Promise<unknown>
}
```

`unknown` допустим на границе непроверенного внешнего результата. `business` проверяет его до превращения в предметные данные или состояние.

Термин и обязательная поведенческая форма технического порта пока не закреплены. В частности, позднее нужно определить cancellation, timeout, retry, concurrency и subscription semantics.

## Cross-domain API dependency

Готовый API другого домена не считается техническим adapter-портом. Это отдельная cross-domain API dependency, выраженная type-only контрактом:

```ts
import type { AuthApi } from '@/domains/auth/business'

export type UserDeps = {
  auth: Pick<AuthApi, 'getSession'>
}
```

Runtime-значение место сборки графа передаёт через preset либо напрямую зависимой business-фабрике. `user/business` не импортирует executable API, factory или preset Auth.

## Adapter module

Adapter module соединяет явную техническую зависимость фабрики с конкретной системой:

```text
business dependency ← adapter → SDK / storage / platform / request data
```

Adapter преобразует аргументы и технический результат к контракту зависимости. Он не определяет публичный метод `DomainApi`, предметный fallback или код доменной ошибки.

Ожидаемый исходный сбой возвращается `business`, который выбирает собственный error code. Поэтому приложение никогда не строит поведение по HTTP status, SDK error class или storage exception.

## Размещение adapters

Каждая production-реализация является отдельным SLM-модулем в Group `adapters`, даже если пока используется одним preset:

```text
auth/adapters/
├── phone-http/
│   └── index.ts
└── browser-session/
    └── index.ts
```

Adapter module имеет собственные ответственность, публичный API, environment label и тестовую границу. Group `adapters` не имеет `index.ts` и не реэкспортирует дочерние модули.

Production adapter запрещено определять:

- закрытым сегментом preset;
- inline-функцией в `composition` или `app`;
- частью framework binding module;
- скрытой реализацией внутри `business`.

Preset и одноразовое место сборки импортируют конкретные adapter-модули через их публичные API:

```ts
import { authFactory } from '@/domains/auth/business/factory'
import { createPhoneHttpAdapter } from '@/domains/auth/adapters/phone-http'
import { createBrowserSessionAdapter } from '@/domains/auth/adapters/browser-session'

const authApi = authFactory({
  phone: createPhoneHttpAdapter(),
  session: createBrowserSessionAdapter(),
})
```

Если фабрика не имеет технических зависимостей, Group `adapters` не обязательна. Cross-domain API dependency не считается adapter и передаётся отдельно.

Локальные fake implementations в business-тестах не являются production adapters и не требуют SLM-модулей. Они существуют только внутри тестовой границы и не экспортируются в рабочий код.
