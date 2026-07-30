# Presets и среды выполнения

> Пояснение повторяемых сборок одного `DomainApi`.

## Связанные правила

- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-PRESET-R011`](../../rules/level-2.md#slm-l2-preset-r011)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../../rules/level-2.md#slm-l2-environment-a013)

## Назначение

Preset является SLM-модулем в Group `presets`. Он создаёт API одной business-фабрики для конкретного повторяемого контекста выполнения.

```text
authFactory
├── presets/browser       → AuthApi в браузере
├── presets/request       → AuthApi одного server request
└── presets/server-action → AuthApi server action
```

Архитектура не требует обязательный `base` или изоморфный preset и не ограничивает количество presets. Проект создаёт только те сборки, которые нужны его реальным средам и областям использования.

Если фабрика используется в одном месте и отдельная повторяемая конфигурация не возникает, место сборки графа может вызвать её напрямую.

## Один контракт API

Каждый preset выбирает технические реализации, но вызывает одну и ту же фабрику и возвращает один контракт `DomainApi`:

```ts
export const createBrowserAuth = (): AuthApi => {
  return authFactory({
    phone: createHttpPhoneAdapter(),
    session: createBrowserSessionAdapter(),
  })
}
```

```ts
export const createAuthForRequest = (
  input: AuthRequestInput,
): AuthApi => {
  return authFactory({
    phone: createServerPhoneAdapter(input),
    session: createRequestSessionAdapter(input),
  })
}
```

Server preset может обращаться к database напрямую через adapter, а browser preset реализует тот же сценарий через HTTP или RPC. Preset не добавляет server-only метод к `AuthApi` и не меняет доменные ошибки.

Если полный `DomainApi` невозможно корректно создать в некоторой среде, пакет просто не предоставляет preset для этой среды. Метод, намеренно падающий только потому, что среда не поддерживается, не считается реализацией контракта.

## Cross-domain input

Preset зависимого домена принимает готовый API аргументом:

```ts
import type { AuthApi } from '@/domains/auth/business'

export type CreateUserForRequestInput = {
  authApi: Pick<AuthApi, 'getSession'>
  request: UserRequestInput
}

export const createUserForRequest = ({
  authApi,
  request,
}: CreateUserForRequestInput): UserApi => {
  return userFactory({
    auth: authApi,
    profile: createUserProfileAdapter(request),
  })
}
```

Preset делает только type-only импорт `AuthApi`. Runtime-фабрику, preset или instance Auth он не импортирует.

Место сборки графа выполняет сборку:

```ts
const authApi = createAuthForRequest(authInput)
const userApi = createUserForRequest({ authApi, request: userInput })
```

## Environment entry points

Server preset имеет отдельный публичный entry point и marker выбранного framework или bundler:

```ts
import 'server-only'

export { createAuthForRequest } from './create-auth-for-request'
```

Server entry point не реэкспортируется через `business`, Framework Group, browser preset или корень доменного пакета. Аналогично client-only код не достигается из server/shared entry point, если выбранная среда запрещает такую зависимость.

## Lifecycle

Preset может создавать ресурсы, которым потребуется запуск или cleanup, но точная форма `start`, `dispose`, rollback и request abort пока не нормирована. До принятия решения действует общее правило владения lifecycle Level 1.
