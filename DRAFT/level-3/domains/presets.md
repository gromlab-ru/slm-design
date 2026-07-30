# Типовые сборки и SSR

> Пояснение повторяемой сборки домена.

## Связанные правила

- [`SLM-L3-PRESET-R009`](../../rules/level-3.md#slm-l3-preset-r009)
- [`SLM-L3-ASSEMBLY-R010`](../../rules/level-3.md#slm-l3-assembly-r010)
- [`SLM-L3-ENVIRONMENT-A012`](../../rules/level-3.md#slm-l3-environment-a012)
- [`SLM-L3-FACTORY-R006`](../../rules/level-3.md#slm-l3-factory-r006)

## Роль типовой сборки

Модуль в группе `presets` задаёт именованный повторяемый способ создания API одной фабрики для конкретного контекста выполнения. Он выбирает реализации портов, создаёт `AuthApi` и передаёт вызывающему коду операции жизненного цикла, определённые модулями-владельцами ресурсов.

```text
authFactory
├── presets/application   → AuthApi уровня приложения
├── presets/request       → AuthApi одного запроса
└── presets/server-action → AuthApi серверного действия
```

Среда определяется выбранной сборкой и её адаптерами, а не параметром `mode` внутри фабрики. Тесты создают отдельную сборку напрямую через фабрику и не требуют общего модуля `presets/testing`.

## Структура и публичный API

```text
domains/auth/presets/application/
├── adapters/
├── create-application-auth.ts
├── create-application-auth.test.ts
└── index.ts
```

`application` — только пример имени. Модуль называется по контексту выполнения или устойчивому назначению: `application`, `request`, `server-action`. Временный потребитель не должен давать имя повторно используемой конфигурации.

```ts
export const createApplicationAuth = (): AuthApi => {
  return authFactory({
    phone: createApplicationAuthPhoneAdapter(),
    session: createApplicationAuthSessionAdapter(),
  })
}
```

Типовая сборка не добавляет сценарии, не меняет преобразование ошибок и не скрывает предметные правила. Одноразовый владелец графа может вызвать фабрику напрямую, если сам выбирает все порты и отвечает за жизненный цикл результата.

## Область жизни

Модуль сборки объявляет ожидаемую область жизни экземпляра API. Сборка `application` используется в течение жизни приложения, а `request` создаёт новый экземпляр для каждого запроса. Владелец графа не хранит данные одного запроса в общем экземпляре приложения.

Если сборка создаёт ресурс жизненного цикла, вызывающий код получает явную операцию очистки:

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

Создание API через фабрику или типовую сборку не запускает ввод-вывод и подписки. Если ресурс нужно запустить явно, модуль-владелец предоставляет отдельную операцию. Владелец графа вызывает её после начала своей области жизни и выполняет очистку при завершении.

## Серверная граница

Серверная сборка имеет отдельную точку входа и служебную метку выбранного фреймворка или сборщика:

```ts
import 'server-only'

export { createAuthForRequest } from './create-auth-for-request'
```

Эта точка входа не реэкспортируется через `business`, `react` или клиентскую сборку. Серверный адаптер также может иметь собственную метку, защищающую от ошибочного прямого импорта.

Модуль фреймворка не вызывает сборку и не создаёт фабрику. Он получает готовый `AuthApi` от владельца графа, поэтому жизненный цикл React не смешивается с технической сборкой зависимостей.
