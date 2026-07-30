# Фабрика, зависимости и adapters

> Пояснение границы между `business` и технической средой.

## Связанные правила

- [`SLM-L2-BUSINESS-A007`](../../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)

## Одна фабрика

```text
явные зависимости + business factory → DomainApi
```

Модуль `business` предоставляет одну публичную фабрику. Она получает все runtime-возможности явными аргументами и создаёт API одного контракта независимо от выбранного preset.

```ts
export type AuthFactory = (deps: AuthDeps) => AuthApi
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

Runtime-значение передаёт место сборки графа через preset. `user/business` не импортирует executable API, factory или preset Auth.

## Adapter

Adapter соединяет явную зависимость фабрики с технической системой:

```text
business dependency ← adapter → SDK / storage / platform / request data
```

Adapter преобразует аргументы и технический результат к контракту зависимости. Он не определяет публичный метод `DomainApi`, предметный fallback или код доменной ошибки.

Ожидаемый исходный сбой возвращается `business`, который выбирает собственный error code. Поэтому приложение никогда не строит поведение по HTTP status, SDK error class или storage exception.

## Размещение adapter

Одноразовый adapter остаётся закрытым сегментом preset-модуля:

```text
auth/presets/browser/
├── adapters/
│   └── phone.adapter.ts
└── index.ts
```

Adapter становится самостоятельным SLM-модулем, когда нужен нескольким presets или имеет отдельную integration responsibility:

```text
auth/adapters/
└── identity-provider/
    └── index.ts
```

Самостоятельный adapter сохраняет минимальный публичный API и не становится альтернативным источником доменных данных для приложения.
