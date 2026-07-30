# Presets и среды выполнения

> Пояснение повторяемых сборок одного `DomainApi`.

## Связанные правила

- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-PRESET-R011`](../../rules/level-2.md#slm-l2-preset-r011)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-PRESET-A020`](../../rules/level-2.md#slm-l2-preset-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

## Назначение

Preset является SLM-модулем в Group `presets`. Он создаёт API одной business-фабрики для конкретного повторяемого контекста выполнения. Каждый доменный пакет содержит минимум один preset-модуль.

```text
authFactory
├── presets/browser       → AuthApi в браузере
├── presets/request       → AuthApi одного server request
└── presets/server-action → AuthApi server action
```

Архитектура не требует `base` или изоморфный preset и не ограничивает максимальное количество presets. Обязательный preset должен соответствовать реальному поддерживаемому контексту, а не существовать только для заполнения структуры.

Место сборки графа в `composition` может вызвать фабрику напрямую для одноразовой конфигурации. Такая сборка не отменяет обязательный preset пакета и при наличии технических зависимостей использует публичные adapter-модули, а не inline implementations.

## Один контракт API

Каждый preset вызывает одну и ту же фабрику и возвращает один контракт `DomainApi`. При наличии технических зависимостей preset выбирает их публичные adapter-модули:

```ts
import type { AuthApi } from '@/domains/auth/business'
import { authFactory } from '@/domains/auth/business/factory'
import { createPhoneHttpAdapter } from '@/domains/auth/adapters/phone-http'
import { createBrowserSessionAdapter } from '@/domains/auth/adapters/browser-session'

export const createBrowserAuth = (): AuthApi => {
  return authFactory({
    phone: createPhoneHttpAdapter(),
    session: createBrowserSessionAdapter(),
  })
}
```

```ts
import type { AuthApi } from '@/domains/auth/business'
import { authFactory } from '@/domains/auth/business/factory'
import { createRequestPhoneAdapter } from '@/domains/auth/adapters/request-phone'
import { createRequestSessionAdapter } from '@/domains/auth/adapters/request-session'

export const createAuthForRequest = (
  input: AuthRequestInput,
): AuthApi => {
  return authFactory({
    phone: createRequestPhoneAdapter(input),
    session: createRequestSessionAdapter(input),
  })
}
```

Server preset может обращаться к database напрямую через adapter, а browser preset реализует тот же сценарий через HTTP или RPC. Preset не добавляет server-only метод к `AuthApi` и не меняет доменные ошибки.

Если полный `DomainApi` невозможно корректно создать в некоторой среде, пакет просто не предоставляет preset для этой среды. Метод, намеренно падающий только потому, что среда не поддерживается, не считается реализацией контракта.

## Cross-domain input

Preset зависимого домена принимает готовый API аргументом. Cross-domain API не является adapter и не размещается в Group `adapters`:

```ts
import type { AuthApi } from '@/domains/auth/business'
import type { UserApi } from '@/domains/user/business'
import { userFactory } from '@/domains/user/business/factory'
import { createUserProfileAdapter } from '@/domains/user/adapters/profile'

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
