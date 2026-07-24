---
title: Business-фабрика
description: Контракт business-модуля, runtime-зависимости, logic API, доменные ошибки и место сборки фабрик
---

# Business-фабрика

Раздел фиксирует архитектурный контракт business-модуля: фабрика описывает доменный logic API приложения и не знает о конкретном backend, SDK, storage, state/query runtime, browser API или React tree.

## Главный принцип

Business-модуль описывает домен приложения, а не форму backend API, SDK, storage, external hook, state manager или внешнего сервиса.

Фабрика должна отвечать на вопрос: какой API нужен приложению для работы с доменом. Она не должна отвечать на вопрос: какие методы есть у конкретного REST-клиента, SDK или browser API.

## Когда создавать business-модуль

Полный контракт business-модуля — фабрика, `deps`, доменные типы, доменные ошибки, adapters, сборка в `compositions/business/{domain}`, обязательные factory/assembly tests и colocated tests для внутренней runtime-safe логики. Он применяется к любому модулю, созданному в `business`.

Создавай business-модуль, когда выполняется хотя бы одно условие:

- сценарии нужны нескольким страницам, composition modules или другим доменам;
- у логики есть собственная доменная модель и доменные ошибки, которые нельзя выразить типами внешнего API;
- доменный сценарий зависит от внешних runtime-capabilities (backend, SDK, product storage, source hook, domain store, event, browser API), которые нужно изолировать за `deps`;
- домен нужно тестировать независимо от UI и конкретного backend.

Не создавай business-модуль заранее, если логика нужна одной странице, не имеет доменной модели, product I/O и domain state. Presentation-only store или browser interaction, принадлежащие UI scope, сами по себе не создают business-домен. Такая page-local orchestration живёт в соответствующем composition module.

Наличие product I/O отменяет page-local исключение. Даже если источник нужен одной странице, consumer composition не обращается к нему напрямую: объяви business-контракт, dependency adapter и domain errors.

«Облегчённого» business-модуля не существует: если модуль создан в `business/`, контракт применяется целиком. Подъём вызревшей логики из composition module в business-модуль — обычный рефакторинг: объяви доменные типы и `deps`, перенеси сценарии в services и hooks, собери фабрику и покрой её factory-level тестами.

## Обязательные правила

- Фабрика лежит в корне business-модуля: `business/{domain}/{domain}.factory.ts`.
- Фабрика принимает runtime-зависимости только через `deps`.
- Фабрика возвращает только logic API домена: hooks, selectors, command/query methods, scenario services.
- Фабрика не возвращает React-компоненты, layouts, guards, boundaries, providers или page-level wrappers.
- Business-модуль не содержит React-компоненты. UI-решения домена размещаются в `compositions`; полностью универсальные UI-контролы размещаются в `ui`.
- Business-модуль не импортирует реальные SDK, generated operations, HTTP-клиенты, storage, env, browser API или composition-сборку.
- Business-модуль не импортирует React state/effect runtime, SWR/query runtime, Zustand/Redux/MobX store runtime или event bus implementation.
- Source/query hooks, domain state stores, subscriptions, clock, random и technical services передаются через business-owned `deps`.
- Public contract business-модуля использует собственные доменные типы, а не DTO внешнего API.
- `index.ts` business-модуля экспортирует только фабрику и type-only экспорты. Исключений нет.
- Runtime-сборка business-фабрики выполняется вне `business`, обычно в `compositions/business/{domain}`.
- Для каждой runtime-capability создаётся явный dependency adapter. Adapter не пишется inline внутри builder.
- Из public API business выходят только собственные domain errors со стабильным `code`.
- Factory-level и assembly tests обязательны и входят в критерий завершения модуля.

## Проектирование фабрики

Проектирование начинается со сценариев домена, а не с API-клиента.

Порядок работы:

1. Опиши публичные сценарии, которые нужны приложению.
2. Опиши доменные типы, которыми должен оперировать UI и другие business-модули.
3. Проведи inventory всех runtime-capabilities: data sources, hooks, stores, events, browser APIs, env, clock и cross-domain APIs.
4. Опиши минимальные внешние возможности в `{Domain}Deps`.
5. Назови внешние возможности бизнес-языком, а не языком backend endpoint'ов и библиотек.
6. Опиши domain error codes для каждого публичного сценария.
7. Собери фабрику из внутренних services, hook wrappers, mappers и helpers поверх переданных deps.
8. Верни наружу только `{Domain}Api`.
9. Реализуй каждую dependency отдельным adapter в `compositions/business/{domain}`.

Правильные вопросы:

- Не `какой endpoint дернуть?`, а `какой бизнес-сценарий выполняем?`.
- Не `какой DTO пришёл?`, а `какую доменную модель отдаём наружу?`.
- Не `как называется метод SDK?`, а `какая внешняя возможность нужна домену?`.
- Не `как устроен backend сейчас?`, а `какой стабильный контракт нужен приложению?`.

## Контракт зависимостей

`{Domain}Deps` описывает не технические инструменты, а возможности, которые нужны домену.

Правила:

- имя зависимости отражает бизнес-возможность: `phoneAuth`, `session`, `profile`, `agreements`, `notifications`;
- методы внутри зависимости называют сценарное действие без повторения endpoint names: `phoneAuth.requestCode`, `phoneAuth.verifyCode`, `profile.getCurrentUser`, `agreements.saveUserAgreements`;
- параметры используют доменные типы business-модуля;
- результат внешней границы принимается как `unknown`, если данные требуют runtime-нормализации;
- пустой успешный ответ описывается как `Promise<void>`, если body не нужен;
- dependency не должна возвращать generated DTO как доменный тип;
- mapper, normalizer или domain error не передаётся через `deps`, если это часть доменной логики.
- source/query hook описывается business-owned result type, без `SWRConfiguration`, `UseQueryResult` и других library types;
- domain state описывается business-owned port, без `StoreApi` и concrete state manager types;
- subscription возвращает cleanup function;
- недетерминированные clock/random/id capabilities передаются явно;

Плохо:

```ts
import type { ApiRequestClient, BoundApi } from '@vendor/api-sdk'
import type { v1PatientProfileList } from '@vendor/api-sdk/operations'

type UserApiTree = {
  patient: {
    profile: typeof v1PatientProfileList
  }
}

export type UserDeps = {
  api: BoundApi<UserApiTree, ApiRequestClient>
}
```

Проблема: business-модуль знает про SDK, generated operation и форму внешнего клиента.

Хорошо:

```ts
import type { AuthState } from './auth-state.type'
import type { VerifyPhoneCodeData } from './verify-phone-code-data.type'

export type AuthDeps = {
  phoneAuth: {
    requestCode: (phone: string) => Promise<unknown>
    resendCode: (challengeId: string) => Promise<unknown>
    verifyCode: (data: VerifyPhoneCodeData) => Promise<unknown>
  }
  session: {
    setToken: (token?: string | null) => void
    useToken: () => string | null | undefined
  }
  sessionEvents: {
    onInvalidated: (listener: () => void) => () => void
  }
  state: {
    create: (initialState: AuthState) => {
      get: () => AuthState
      set: (state: AuthState) => void
      useState: () => AuthState
    }
  }
}
```

Конкретный SDK, storage, source hook, store или mock подключается в `compositions/business/auth` через адаптер. Business-модуль знает только о своём `AuthDeps`.

## Публичный API фабрики

`{Domain}Api` описывает logic API домена, который фабрика возвращает наружу в runtime.

Правила:

- API говорит на языке домена;
- API не повторяет endpoint names;
- API не отдаёт DTO внешнего сервиса;
- API не раскрывает внутренние `create*` services;
- API остаётся стабильным при замене backend, SDK или storage;
- API может возвращать hooks и selectors, созданные поверх переданных dependency hooks/state ports; business не импортирует concrete hook/store runtime;
- API не возвращает React-компоненты, UI-компоненты, layouts, guards, boundaries или page-level wrappers.

Плохо:

```ts
export type AuthApi = {
  AuthGuard: ComponentType<AuthGuardProps>
  LoginButton: ComponentType<LoginButtonProps>
  useAuth: ReturnType<typeof createAuthHook>
}
```

Проблема: factory output смешивает доменную логику с UI и начинает собирать React tree.

Хорошо:

```ts
export type AuthApi = {
  requestPhoneCode: ReturnType<typeof createRequestPhoneCode>
  resendPhoneCode: ReturnType<typeof createResendPhoneCode>
  verifyPhoneCode: ReturnType<typeof createVerifyPhoneCode>
  useAuth: ReturnType<typeof createAuthHook>
  useIsAuthenticated: ReturnType<typeof createIsAuthenticatedHook>
  startSessionInvalidationTracking: () => () => void
}
```

Такой API сообщает composition-слою доменное состояние и действия, но не навязывает UI-решение.

## Реализация фабрики

Фабрика связывает внутренние части business-модуля с переданными зависимостями.

```ts
import { createCurrentUserHook } from './hooks/use-current-user.hook'
import { createStoredUserAgreementsGetter } from './services/get-stored-user-agreements.service'
import { createUpdateCurrentUserProfile } from './services/update-current-user-profile.service'
import type { UserFactory } from './types/user-factory.type'

export const userFactory: UserFactory = (deps) => {
  const { authApi, profile, storage } = deps

  return {
    getStoredUserAgreements: createStoredUserAgreementsGetter(storage),
    updateCurrentUserProfile: createUpdateCurrentUserProfile(profile),
    useCurrentUser: createCurrentUserHook({ authApi, profile }),
  }
}
```

Фабрика не должна:

- создавать API-клиент;
- выбирать backend endpoint;
- читать env;
- обращаться к browser storage напрямую;
- делать запросы при создании API;
- импортировать composition-сборку;
- подстраивать свой API под конкретный внешний сервис;
- создавать или возвращать React-компоненты;
- импортировать React state/effect APIs;
- импортировать SWR, query library или state manager runtime;
- создавать concrete store, query client или event bus;
- подписываться на external event без dependency contract и явного cleanup.

## Runtime-границы и ошибки

Любая dependency фабрики считается ненадёжной runtime-границей.

Business-модуль защищает публичный контракт от таких случаев:

- dependency вернула `null`, `undefined`, пустой body или объект неправильной формы;
- dependency вернула rejected promise;
- dependency синхронно выбросила исключение;
- storage содержит устаревшие или битые данные;
- внешний сервис поменял форму ответа без изменения TypeScript-типов.

Защита выполняется внутри business-модуля через mappers, normalizers, type guards и domain errors. Fallback допустим только для валидного доменного исхода, явно представленного dependency contract, а не для technical failure или malformed response.

Наружу не должны протекать ошибки SDK, HTTP-клиента, storage, query hook, store, generated API или browser API. Потребитель business API всегда получает только собственную domain error со стабильным `code`, а не `message`, `status`, `response`, `stack` или форму внешней ошибки.

```ts
if (isDomainError<AuthErrorCode>(error) && error.code === 'AUTH_PHONE_CODE_VERIFY_FAILED') {
  showInvalidCodeMessage()
}
```

Business всегда преобразует rejected promise, synchronous throw, source hook error и невалидную успешную структуру в собственную domain error.

## Сборка business-фабрики

Реальные runtime-зависимости подключаются в composition module `compositions/business/{domain}`.

```text
src/
├── business/
│   └── auth/
│       ├── auth.factory.ts
│       ├── types/
│       └── index.ts
└── compositions/
    └── business/
        └── auth/
            ├── create-auth-business.ts
            ├── adapters/
            ├── types/
            └── index.ts
```

Если business-домены сгруппированы, сборка повторяет тот же относительный путь: `business/app/auth` соответствует `compositions/business/app/auth`, `business/cms/content` соответствует `compositions/business/cms/content`. Группировка не является default-структурой.

Правила:

- `business/{domain}` объявляет фабрику и контракт `deps`.
- `compositions/business/{domain}` отдельными adapters адаптирует SDK, storage, infra-клиенты, source hooks, stores, events и другие runtime-capabilities к этому контракту.
- Builder явно создаёт или получает scoped runtime instances без I/O, создаёт adapters поверх них, передаёт adapters фабрике и возвращает API; integration logic не пишется inline.
- `create{Domain}Business()` возвращает готовый `{Domain}Api`.
- Browser/application `create{Domain}Business()` принимает аргументы только для API других уже собранных business-фабрик.
- SDK, storage, env, HTTP-клиенты и browser API не передаются в `create{Domain}Business()` как deps.
- Если домен не зависит от других business API, `create{Domain}Business()` вызывается без аргументов.
- Request-scoped builder отделяет cross-domain API от `requestScopeInput`. В input находятся только framework/request data; concrete client factory импортируется внутри integration module. Request input используется только для создания adapters и не передаётся factory как raw dependency.
- Конечный граф API собирается в месте, которое владеет lifecycle: page composition, route composition, provider, request scope или test setup.
- `infra` не собирает business-фабрики, потому что не должен импортировать `business`.
- `app` не реализует business-сборку, а только подключает готовые composition modules к фреймворку.

```ts
import { createAuthBusiness } from '@/compositions/business/auth'
import { createUserBusiness } from '@/compositions/business/user'

const authApi = createAuthBusiness()
const userApi = createUserBusiness({ authApi })
```

Подробный пример см. в [Business composition](../examples/business-composition.md).

## Public API файла index.ts

Жёсткое правило без исключений: `business/{domain}/index.ts` экспортирует только фабрику и type-only экспорты.

```ts
export { userFactory } from './user.factory'

export type { User } from './types/user.type'
export type { UserApi } from './types/user-api.type'
export type { UserDeps } from './types/user-deps.type'
export type { UserFactory } from './types/user-factory.type'
export type { UserErrorCode } from './types/user-error-code.type'
```

## Тестирование

Business-модуль тестируется через public API фабрики. Factory-level тесты обязательны, импортируют модуль только через `business/{domain}` и не используют deep imports во внутренние `services`, `hooks`, `mappers` или `lib`.

Сборка в `compositions/business/{domain}` обязательно тестируется отдельно: эти тесты проверяют adapters, корректность передачи deps, отсутствие I/O при создании API и lifecycle cleanup, но не заменяют сценарные тесты business-модуля.

Colocated unit tests обязательны там, где есть mappers, normalizers, type guards, domain errors или другая внутренняя runtime-safe логика. Они являются дополнительным уровнем, а не заменой factory-level и assembly tests.

Подробный пример см. в [Business testing](../examples/business-testing.md).

## Чеклист

- Фабрика лежит в корне business-модуля.
- Фабрика принимает все runtime-зависимости через `deps`.
- В `deps` нет SDK, generated operations, HTTP-клиентов, backend DTO, StoreApi и query-library types.
- Контракты зависимостей названы бизнес-языком.
- Source/query hooks, stores, events и platform APIs переданы через `deps`.
- Business не импортирует React/SWR/query/store runtime.
- Все public types принадлежат business-модулю.
- Внешние ответы нормализуются перед попаданием в public API.
- Все source errors без исключений заменяются собственными domain errors.
- Public API фабрики не повторяет внешний API.
- Public API фабрики не возвращает React-компоненты.
- Business-модуль не содержит React-компоненты.
- `index.ts` экспортирует только фабрику и type-only экспорты, без исключений.
- Runtime-сборка живёт в `compositions/business/{domain}`.
- Для каждой runtime-capability существует private adapter.
- Builder не содержит inline integration logic.
- Business-модуль можно подключить к другому backend через адаптер без изменения фабрики.
- Factory-level и assembly tests созданы и выполняются.
