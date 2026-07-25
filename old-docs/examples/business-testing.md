---
title: Тестирование business-модулей
description: Factory-level и colocated unit-тесты для business-фабрик SLM
---

# Тестирование business-модулей

Business-модуль тестируется как доменный контракт приложения. Главный контракт business-модуля — фабрика и API, который она возвращает.

Factory-level тесты обязательны для каждого business-модуля. Assembly tests обязательны для `compositions/business/{domain}`. Внутренние colocated unit-тесты добавляются для runtime-safe логики и не заменяют проверку public API фабрики.

## Уровни тестов

Полное изменение домена проверяется на трёх границах:

1. Factory-level тесты.
2. Assembly tests dependency adapters и builder.
3. Colocated unit-тесты внутренней runtime-safe логики.

Factory-level тесты отвечают на вопрос: работает ли домен снаружи через публичный API фабрики.

Assembly tests отвечают на вопрос: правильно ли concrete runtime реализует `Deps` и передан фабрике.

Colocated unit-тесты отвечают на вопрос: надёжна ли внутренняя runtime-safe механика, на которой держится публичный контракт.

## Factory-level тесты

Размещение:

```text
business/{domain}/tests/{domain}-factory/
```

Пример:

```text
business/user/tests/user-factory/
├── public-api.test.tsx
├── use-current-user.test.tsx
├── update-current-user-profile.test.ts
├── get-stored-user-agreements.test.ts
└── testing/
    └── create-user-deps.mock.ts
```

Factory-level тесты импортируют модуль только через public API.

```ts
import { userFactory } from '@/business/user'
```

Factory-level тесты не импортируют:

- `services/*`;
- `hooks/*`;
- `mappers/*`;
- `lib/*`;
- `errors/*`;
- любые deep imports business-модуля.

## Что покрывать на factory-level

Каждый runtime-метод, который возвращает фабрика, должен иметь factory-level тесты.

Обязательно проверяются:

- полный публичный runtime API фабрики;
- happy path каждого метода;
- edge cases публичного контракта;
- корректные ответы DI-зависимостей;
- пустые ответы DI-зависимостей;
- невалидные ответы DI-зависимостей;
- rejected promise от dependency;
- синхронное исключение dependency;
- преобразование внешних ошибок в доменные ошибки;
- преобразование ошибок source hooks, stores и subscriptions в доменные ошибки;
- стабильный доменный `code` для каждой ошибки public contract;
- сохранение исходной ошибки в `cause`;
- отсутствие зависимости public contract от `status`, `message`, `response` и других внешних полей ошибки;
- порядок side effects;
- отсутствие следующих side effects после ошибки;
- hooks, если фабрика возвращает hooks.

Пример:

```ts
const deps = createUserDepsMock({
  profile: {
    useCurrent: createCurrentUserSourceHookMock({ data: sourceUser }),
  },
})
const userApi = userFactory(deps)

await userApi.updateCurrentUserProfile(data)

const result = renderHook(() => userApi.useCurrentUser())
```

Тест проверяет поведение `userApi`, а не внутреннее устройство `createUpdateCurrentUserProfile`.

## Public API тест

У каждого business-модуля должен быть тест, который фиксирует публичный runtime API фабрики.

```ts
it('returns stable user business API', () => {
  const userApi = userFactory(createUserDepsMock())

  expect(Object.keys(userApi).sort()).toEqual([
    'getStoredUserAgreements',
    'updateCurrentUserProfile',
    'useCurrentUser',
  ])
})
```

Такой тест не заменяет сценарные тесты методов. Он только фиксирует форму API и защищает от случайного удаления или переименования методов.

## DI-границы

Любая dependency фабрики считается ненадёжной runtime-границей.

Для каждой dependency нужно проверить минимум:

- корректный успешный ответ;
- `undefined`;
- `null`;
- пустой объект;
- объект неправильной формы;
- rejected promise;
- синхронный throw обычного method/callback/state/lifecycle dependency;
- повторные вызовы;
- смену результата dependency hook или domain state.

Если dependency является callback'ом, проверяется порядок вызовов и payload.

Если dependency работает с storage, проверяются битые, устаревшие и отсутствующие данные.

## Hooks через фабрику

Hooks, которые возвращает фабрика, тестируются через factory API.

Проверяй:

- hook не делает запрос без готовых входных данных;
- dependency hook получает ожидаемые доменные аргументы;
- hook корректно обрабатывает смену dependency result;
- `data` имеет доменную модель;
- `error` имеет доменный контракт;
- loading/refresh state соответствует собственному API модуля;
- невалидный dependency response не попадает наружу как валидная доменная модель.

```ts
const useCurrent = createCurrentUserSourceHookMock({ data: sourceUser })
const deps = createUserDepsMock({ profile: { useCurrent } })
const userApi = userFactory(deps)

const { result } = renderHook(() => userApi.useCurrentUser())
```

Не тестируй hook business-модуля как отдельную публичную сущность, если он не является public API фабрики.

SWR/Query cache keys, provider wrapper и library-specific revalidation тестируются в assembly tests dependency adapter, а не в business factory tests.

## Command-сценарии

Для command-методов вроде `save`, `update`, `change`, `request`, `verify` проверяются:

- payload передаётся во внешнюю dependency в ожидаемой форме;
- входной payload не мутируется;
- пустой успешный ответ считается успехом, если body не нужен;
- ошибка dependency превращается в доменную ошибку;
- потребитель может принять решение по доменному `code`;
- side effects выполняются в правильном порядке;
- при ошибке одного шага следующие side effects не выполняются;
- повторный вызов не использует устаревшее состояние, если это важно для сценария.

Если сценарий использует несколько зависимостей, тест должен явно фиксировать порядок.

## Colocated unit-тесты

Colocated unit-тесты размещаются рядом с файлом, который владеет runtime-логикой.

```text
business/{domain}/
├── errors/
│   ├── {domain}-business.error.ts
│   └── {domain}-business.error.test.ts
├── lib/
│   ├── normalize-{entity}.ts
│   └── normalize-{entity}.test.ts
├── mappers/
│   ├── map-{entity}.ts
│   └── map-{entity}.test.ts
├── services/
│   ├── update-{entity}.service.ts
│   └── update-{entity}.service.test.ts
└── hooks/
    ├── use-{scenario}.hook.ts
    └── use-{scenario}.hook.test.tsx
```

Colocated unit-тесты нужны для:

- mappers;
- normalizers;
- type guards;
- runtime-safe helpers;
- domain errors;
- сложных services;
- hook wrappers со сложной нормализацией domain result/error;
- storage parsers;
- fallback-логики.

Colocated unit-тесты не нужны для:

- type-only файлов;
- `index.ts` без runtime-логики;
- простых re-export файлов;
- статических config-файлов без branching;
- типов, которые проверяются typecheck'ом.

## Почему colocated тесты не заменяют factory-level

Colocated тест может доказать, что mapper работает правильно, но он не доказывает, что фабрика использует этот mapper в публичном сценарии.

Colocated тест может доказать, что service обрабатывает ошибку, но он не доказывает, что service реально попал в public API фабрики.

Factory-level тест проверяет интеграцию внутренних частей business-модуля как чёрный ящик.

Правило:

- сначала покрывай public API фабрики;
- затем усиливай покрытие colocated тестами там, где есть runtime-safe логика.

## Маппинг и runtime safety

Если business-модуль получает данные с любой dependency boundary, тестируй не только happy path. Boundary включает методы, source hooks, stores, events и browser capabilities.

Проверяй:

- отсутствующие обязательные поля;
- nullable-поля;
- поля неправильного runtime-типа;
- пустые строки;
- пробельные строки;
- странные идентификаторы;
- пустые массивы;
- не-массив вместо массива;
- частично валидные объекты;
- дефолтные значения;
- domain error для malformed response, если модель не может быть безопасно построена.

Fallback допустим только для валидного доменного исхода, например корректно представленного отсутствия данных. Rejection, synchronous throw, source error и malformed response всегда дают domain error.

## Доменные ошибки

Business-модуль никогда не отдаёт наружу сырые ошибки SDK, HTTP-клиента, source hook, store, storage или browser API. Public contract всегда содержит только собственные domain errors.

Factory-level тесты должны доказывать, что потребитель может работать только с доменным `code` и не знает форму внешней ошибки.

Проверяй:

- `error.name`;
- стабильный `error.code`;
- сохранение `cause`;
- отсутствие утечки DTO/HTTP-specific деталей в public contract;
- rejected promise от разных dependencies маппится в ожидаемый доменный код;
- синхронный throw dependency маппится в ожидаемый доменный код;
- невалидный успешный ответ превращается в доменный код ошибки;
- разные технические ошибки дают один код, если для потребителя это один бизнес-сценарий;
- разные пользовательские сценарии дают разные коды, если UI должен реагировать по-разному;
- safe fallback только для валидного доменного исхода, явно представленного dependency contract.

UI и i18n должны ориентироваться на `code`, а не на `message` внешней ошибки.

Пример factory-level проверки:

```ts
it('throws domain error code when phone code verification fails', async () => {
  const externalError = new Error('Request failed with status code 500')
  const authApi = authFactory({
    phoneAuth: {
      requestCode: vi.fn(),
      resendCode: vi.fn(),
      verifyCode: vi.fn().mockRejectedValue(externalError),
    },
    session,
    sessionEvents: createAuthSessionEventsMock(),
    state: createAuthStateAdapterMock(),
  })

  await expect(authApi.verifyPhoneCode(data)).rejects.toMatchObject({
    name: 'AuthBusinessError',
    code: 'AUTH_PHONE_CODE_VERIFY_FAILED',
    cause: externalError,
  })
})
```

Не проверяй в потребительских сценариях `externalError.message`, HTTP status или тип ошибки SDK как ожидаемое поведение business API.

## Тестирование compositions/business

Тесты `compositions/business/{domain}` проверяют сборку, а не бизнес-поведение.

Проверяй:

- builder вызывает нужную business-фабрику;
- adapter вызывает SDK operation с ожидаемым payload;
- storage/browser adapter соответствует dependency contract;
- API другого домена передаётся в нужном виде;
- builder deps содержат только API других собранных business-фабрик;
- builder/client/adapter constructors не выполняют I/O, storage/env reads или subscriptions во время создания API;
- state/query runtime находится в adapter и не импортируется business-модулем;
- dependency hook работает без Suspense/throw-on-error и возвращает technical error через result;
- adapter пробрасывает source error без создания domain error;
- lifecycle subscription возвращает и вызывает cleanup;
- public API composition-модуля не экспортирует внутренние adapters.

Не проверяй здесь domain errors, fallback'и и маппинг доменной модели. Это ответственность factory-level и colocated тестов в `business/{domain}`.

## Что не тестировать unit-тестами business-модуля

Unit-тесты business-модуля не проверяют:

- реальные REST-запросы;
- generated-клиенты;
- настоящий backend;
- Next.js routing;
- визуальную вёрстку;
- интеграцию с production storage;
- реальные внешние сервисы;
- e2e-поток целого приложения.

Эти проверки относятся к `infra`, `compositions`, integration или e2e уровням.

## Архитектурные импорты

Проверяй production import graph business-модуля. В `business/**` не должно быть runtime или type-only imports из concrete runtimes:

- SDK/client/infra;
- SWR/TanStack Query/Apollo;
- Zustand/Redux/MobX;
- React state/effect APIs;
- storage/browser/event implementations.

Factory-level test обязан импортировать фабрику через public API business-модуля. Deep import `../../{domain}.factory` не доказывает корректность public boundary.

## Чеклист

- Каждый runtime-метод фабрики имеет factory-level тесты.
- Factory-level тесты импортируют модуль только через public API.
- Public API фабрики зафиксирован отдельным тестом.
- DI-зависимости проверены на корректные, пустые, невалидные и ошибочные ответы.
- Hooks тестируются через API, который вернула фабрика.
- Command-сценарии проверяют порядок side effects.
- После ошибки не выполняются лишние side effects.
- Runtime-safe mappers, normalizers и guards покрыты colocated unit-тестами.
- Type-only файлы не покрываются бессмысленными unit-тестами.
- Доменные ошибки имеют стабильный `code`, сохраняют `cause` и не раскрывают внешнюю ошибку как public contract.
- Тесты `compositions/business/{domain}` проверяют сборку, а не бизнес-логику.
- Business production imports не содержат concrete state/query/source runtime.
- Тесты не требуют backend, network, env и долгоживущих процессов.
