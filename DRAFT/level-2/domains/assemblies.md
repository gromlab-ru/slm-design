# Assemblies и среды выполнения

> Пояснение повторяемой сборки именованного графа Domain API.

## Связанные правила

- [`SLM-L2-FACTORY-R008`](../../rules/level-2.md#slm-l2-factory-r008)
- [`SLM-L2-ASSEMBLY-R011`](../../rules/level-2.md#slm-l2-assembly-r011)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L2-ASSEMBLY-R023`](../../rules/level-2.md#slm-l2-assembly-r023)

## Назначение

Assembly является SLM-модулем в Group `assemblies`. Она создаёт явный граф одного или нескольких Domain API пакета для конкретного повторяемого контекста выполнения. Каждый доменный пакет содержит минимум одну assembly.

```text
business/factory
├── assemblies/browser       → { session: AuthSessionApi }
├── assemblies/request       → { session, administration }
└── assemblies/server-action → { administration }
```

Архитектура не требует `base` или изоморфную assembly и не ограничивает их максимальное количество. Обязательная assembly соответствует реальному поддерживаемому контексту, а не существует только для заполнения структуры.

Место сборки графа в `composition` может вызвать фабрики напрямую для одноразовой конфигурации. Такая сборка не отменяет обязательную assembly пакета и при наличии технических зависимостей использует публичные adapter-модули, а не inline implementations.

## Именованный граф API

Browser assembly импортирует только фабрики и adapters нужных ей API:

```ts
import type { AuthSessionApi } from '@/domains/auth/business'
import { authSessionFactory } from '@/domains/auth/business/factory'
import { createPhoneHttpAdapter } from '@/domains/auth/adapters/phone-http'
import { createBrowserSessionAdapter } from '@/domains/auth/adapters/browser-session'

export type AuthBrowserGraph = Readonly<{
  session: AuthSessionApi
}>

export const createBrowserAuth = (): AuthBrowserGraph => {
  const session = authSessionFactory({
    phone: createPhoneHttpAdapter(),
    session: createBrowserSessionAdapter(),
  })

  return { session }
}
```

Request assembly может собрать дополнительный API, которого нет в браузере:

```ts
import type {
  AuthAdministrationApi,
  AuthSessionApi,
} from '@/domains/auth/business'

import {
  authAdministrationFactory,
  authSessionFactory,
} from '@/domains/auth/business/factory'

export type AuthRequestGraph = Readonly<{
  administration: AuthAdministrationApi
  session: AuthSessionApi
}>
```

Assembly не добавляет методы к этим контрактам и не создаёт общий `AuthApi`. Именованный объект только сообщает, какие независимые API доступны в контексте.

## Cross-domain input

Assembly зависимого домена принимает готовый API аргументом. Cross-domain API не является adapter и не размещается в Group `adapters`:

```ts
import type { AuthSessionApi } from '@/domains/auth/business'
import type { UserProfileApi } from '@/domains/user/business'
import { userProfileFactory } from '@/domains/user/business/factory'
import { createUserProfileAdapter } from '@/domains/user/adapters/profile'

export type CreateUserForRequestInput = {
  auth: Pick<AuthSessionApi, 'getSnapshot'>
  request: UserRequestInput
}

export type UserRequestGraph = Readonly<{
  profile: UserProfileApi
}>

export const createUserForRequest = ({
  auth,
  request,
}: CreateUserForRequestInput): UserRequestGraph => {
  const profile = userProfileFactory({
    auth,
    profile: createUserProfileAdapter(request),
  })

  return { profile }
}
```

Assembly делает только type-only импорт `AuthSessionApi`. Runtime-фабрику, assembly или instance Auth она не импортирует.

Место сборки графа выполняет runtime-связь:

```ts
const auth = createAuthForRequest(authInput)
const user = createUserForRequest({
  auth: auth.session,
  request: userInput,
})
```

## Environment entry points

Server assembly имеет отдельный публичный entry point и marker выбранного framework или bundler:

```ts
import 'server-only'

export { createAuthForRequest } from './create-auth-for-request'
```

Server entry point не реэкспортируется через `business`, Framework Group, browser assembly или корень доменного пакета. Аналогично client-only код не достигается из server/shared entry point, если выбранная среда запрещает такую зависимость.

## Lifecycle

Factory не запускает запрос, subscription, timer или другую скрытую долгоживущую работу во время создания API. Assembly может активировать технический ресурс только с явной передачей cleanup своему caller. Операция Domain API, которая запускает ресурс позже, сама возвращает cleanup:

```ts
const stop = auth.session.startInvalidationTracking()

try {
  // Scope использует API.
} finally {
  await stop()
}
```

Если assembly сама создаёт ресурс, принадлежащий всему возвращённому графу, результат дополнительно предоставляет cleanup handle:

```ts
export type AuthRequestAssembly = Readonly<{
  apis: AuthRequestGraph
  dispose: () => Promise<void>
}>
```

```ts
const auth = createAuthForRequest(input)

try {
  return await handleRequest(auth.apis)
} finally {
  await auth.dispose()
}
```

Assembly без собственного ресурса не обязана возвращать пустой `dispose`. Graph owner вызывает каждый реально предоставленный cleanup не позже завершения application, route, request или test scope.

Одноразовое место сборки, которое вызывает фабрики напрямую, подчиняется той же границе: оно не запускает скрытый ресурс в constructor и сохраняет cleanup любого созданного adapter-ресурса до завершения своего scope.

Рекомендуется делать `dispose` идемпотентным, освобождать частично созданные ресурсы при ошибке assembly и закрывать зависимые ресурсы раньше их зависимостей. Детальная политика rollback и поведения API после cleanup остаётся открытым вопросом.
