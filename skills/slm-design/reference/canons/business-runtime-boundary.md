---
title: Runtime-граница business
description: Строгая изоляция business-фабрики от источников данных, state/query runtime, infra, browser API и внешних ошибок
---

# Runtime-граница business

## Главный инвариант

Business-модуль выполняет доменную композицию только над:

- собственными типами и детерминированной логикой;
- capabilities, переданными фабрике через `{Domain}Deps`.

Business не вызывает runtime-возможность, если она не была передана фабрике. Это относится не только к данным и `infra`, но и к hooks, stores, subscriptions, browser API и другим concrete runtime-механизмам.

Фабрика отвечает на вопрос «какой стабильный доменный API нужен приложению», а не «какими библиотеками и источниками он реализован».

## Что разрешено внутри business

Business может напрямую использовать:

- собственные domain types;
- собственные services, mappers, normalizers, validators и type guards;
- собственные domain errors;
- детерминированные вычисления без I/O, runtime-state и скрытого окружения;
- чистые библиотеки вроде schema validators, decimal/date utilities, если результат определяется только явными аргументами и типы библиотеки не становятся public contract;
- type-only контракты других business API для cross-domain dependencies.

## Что передаётся через deps

Через `{Domain}Deps` передавай любую runtime-capability:

| Capability | Примеры concrete implementation |
|---|---|
| Product source | REST SDK, GraphQL client, CMS, storage |
| Source/query hook | SWR, TanStack Query, Apollo hook |
| Domain state runtime | Zustand, Redux, MobX, RxJS store |
| Technical service | logger, telemetry, notifications, i18n engine |
| Platform API | `window`, navigation, clipboard, geolocation |
| Lifecycle event | unauthorized event, socket event, subscription |
| Environment | env/config provider, feature runtime configuration |
| Nondeterminism | clock, timer, random, ID generator |
| Cross-domain behavior | ограниченный API другой business-фабрики |

Не импортируй concrete implementation в business даже в том случае, если библиотека используется только в одном внутреннем файле.

## Запрещённые imports

Production-код `business/**` не импортирует напрямую ни runtime values, ни types из concrete runtimes:

- `infra`, `compositions`, `app`;
- SDK, generated operations и HTTP clients;
- storage implementation;
- React state/effect APIs;
- SWR, TanStack Query, Apollo и другие query runtimes;
- Zustand, Redux, MobX, RxJS stores;
- browser и framework runtime APIs;
- event bus implementation;
- env и process-specific configuration.

Запрет нельзя обойти через `import type`, alias, barrel, type cast или helper в `shared`. Type-only разрешены собственные contracts, детерминированный `shared`, чистые libraries и суженные public API других business-доменов.

## Доменный шлюз данных

Business API является единственной продуктовой границей для потребительского кода.

```text
page / layout / screen / widget
  → {Domain}Api
  → business scenario
  → {Domain}Deps
  → private dependency adapter
  → infra client / SDK / storage / external source
```

Внешний сервис остаётся физическим источником данных. Business является единственным источником доменной истины: он определяет модель, сценарий, нормализацию, fallback и ошибки.

Обычный consumer composition не создаёт параллельный продуктовый контракт поверх DTO или client. Единственная зона concrete product integration внутри `compositions` — `compositions/business/{domain}`.

## Business-owned deps

`{Domain}Deps` принадлежит business-модулю и описывает необходимые возможности доменным языком.

Требования:

- группируй методы по capability, а не по имени SDK/client;
- принимай доменные аргументы;
- принимай внешние результаты как `unknown`, если нужна runtime-проверка;
- описывай собственную минимальную форму dependency hook/result;
- описывай собственный state port, а не `StoreApi` конкретной библиотеки;
- возвращай cleanup из subscription capability;
- не передавай mapper, normalizer или domain error через deps;
- не используй generated DTO как доменную модель;
- не передавай целый client, если домену нужны два конкретных действия.

Плохо:

```ts
import type { StoreApi } from 'zustand'
import type { AdminApiClient } from '@vendor/admin-sdk'

export type AuthDeps = {
  api: AdminApiClient
  store: StoreApi<AuthState>
}
```

Хорошо:

```ts
import type { AuthState } from './auth-state.type'
import type { VerifyPhoneCodeData } from './verify-phone-code-data.type'

export type SourceHookResult = {
  data: unknown
  error: unknown
  isLoading: boolean
  refresh: () => Promise<void>
}

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

## Dependency adapters

Adapter находится снаружи business и реализует конкретную часть `{Domain}Deps`.

```text
compositions/business/auth/
├── create-auth-business.ts
├── adapters/
│   ├── admin-auth-session.adapter.ts
│   ├── browser-auth-navigation.adapter.ts
│   ├── zustand-auth-state.adapter.ts
│   └── admin-auth-session-events.adapter.ts
└── index.ts
```

Правила adapter:

- импортирует type-only business contract;
- импортирует concrete infra/runtime implementation;
- преобразует доменные аргументы в transport arguments;
- возвращает raw/unknown runtime result, если business должен его проверить;
- пробрасывает source error без создания domain error;
- не реализует бизнес-правило;
- не выбирает доменный fallback;
- не экспортируется через public API integration module;
- тестируется на wiring, payload и соответствие dependency contract.

Каждая runtime-capability получает явный adapter. Не скрывай несколько разных integrations как inline-функции внутри builder.

## Dependency hooks

Если business должен предоставить hook, concrete hook передаётся через deps.

```text
SWR/TanStack hook
  → dependency adapter
  → business-owned source hook contract
  → business wrapper hook
  → domain result / domain error
```

Business wrapper может:

- вызвать переданный dependency hook;
- нормализовать `data` в доменную модель;
- заменить source error доменной ошибкой;
- вычислить domain state и selectors;
- вернуть собственный стабильный result type.

Dependency hook обязан быть non-throwing и non-Suspense: technical failure возвращается в `error: unknown`, а не выбрасывается во время вызова hook. Business wrapper обязан заменить этот `error` собственной domain error. Публичные callbacks dependency result, например `refresh`, также оборачиваются business и не могут выдать source error наружу.

Business wrapper не импортирует query library. В public contract не протекают `SWRConfiguration`, `UseQueryResult`, query keys, cache implementation или library-specific mutate API без отдельного domain contract.

## Domain state

Business владеет:

- моделью доменного state;
- допустимыми переходами;
- commands и selectors;
- реакцией на dependency results и events.

Business не владеет concrete state manager. Business выбирает initial domain state и передаёт его в `deps.state.create(initialState)`; adapter только создаёт concrete store с переданным значением.

Zustand/Redux/MobX adapter реализует business-owned state adapter factory и создаётся в `compositions/business/{domain}`. Business-фабрика получает adapter factory через `deps`, передаёт initial domain state и получает concrete port.

Локальный UI-state является другим случаем. Состояние раскрытия sidebar, выбранной вкладки или шага локального UI-flow может использовать concrete state manager непосредственно внутри владеющего composition module, если оно не подменяет доменное состояние и product data boundary.

## Доменные ошибки

Из любого публичного метода, command, query или hook business-модуля выходят только собственные доменные ошибки.

Business обязан преобразовать:

- rejected promise dependency;
- synchronous throw dependency;
- source hook error;
- ошибку store/storage/browser API;
- невалидный успешный ответ;
- неизвестную runtime-ошибку.

Domain error содержит стабильный `code`. Исходная ошибка может сохраняться только в `cause` для диагностики.

Потребитель не ориентируется на:

- `message` внешней ошибки;
- HTTP status;
- `response`;
- SDK error class;
- stack или transport code.

Adapter не импортирует и не создаёт domain error. Error mapping всегда выполняет business.

Rejected promise, synchronous throw, source error и malformed response всегда превращаются в domain error. Fallback допустим только для валидного доменного исхода, явно представленного dependency contract, например корректного отсутствия данных. Fallback не используется для поглощения technical failure или contract drift.

## Чистый builder

`compositions/business/{domain}/create-{domain}-business.ts` только:

1. явно создаёт или получает runtime instances нужного lifecycle без I/O;
2. создаёт adapters поверх этих instances;
3. передаёт adapters и API других доменов в factory;
4. возвращает готовый `{Domain}Api`.

Builder не содержит:

- inline SDK calls;
- `window`/storage operations;
- domain mapping;
- domain errors;
- Zustand/SWR setup вперемешку с другими dependencies;
- product request при создании API;
- скрытую subscription без cleanup contract.

Если capability имеет lifecycle, business API предоставляет domain-level `start`/`subscribe` operation, которая использует dependency и возвращает cleanup wrapper. Business преобразует ошибки регистрации, callback и cleanup в собственные domain errors. Builder остаётся без side effects, а владелец scope запускает operation после mount/commit и вызывает cleanup при завершении lifecycle.

Browser/application builder без cross-domain dependencies вызывается без аргументов. Для request scope integration module определяет отдельный `requestScopeInput` только с framework/request data, например headers, cookies, request ID и abort signal. Concrete client factory импортируется и вызывается внутри integration module. Request input используется только для создания adapters, не передаётся в business как raw client и не экспортируется consumer compositions.

## Graph и lifecycle

Per-domain builder не является владельцем полного graph.

Владелец graph:

- выбирает application-lifetime composition/route/page/request/test scope;
- собирает домены в ацикличном порядке;
- создаёт ровно необходимый набор API;
- использует точный graph type;
- управляет cleanup subscriptions/resources;
- не повторяет adapter wiring;
- не импортирует raw infra для «досборки» домена.

Не используй generic `Partial<Business>` с последующим `as Business`. Если scope содержит только Auth, его contract должен обещать только Auth.

## Cross-domain dependencies

Один business-домен не импортирует runtime другого домена. Он объявляет нужную capability в своих `Deps` через type-only API другого домена, по возможности суженный `Pick`.

Готовый API передаётся builder-у при сборке graph:

```text
createAuthBusiness()
  → createUserBusiness({ authApi })
  → createOrdersBusiness({ userApi })
```

Runtime-цикл означает ошибочную границу доменов. Не скрывай цикл service locator, lazy import или глобальным event bus.

Подробный контракт фабрики находится в [Business-фабрике](./business-factory.md). Практическая сборка показана в [Business composition](../examples/business-composition.md).
