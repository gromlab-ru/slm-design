---
name: slm-design
description: "Используй при определении архитектурной роли изменения и работе по SLM Design: выборе владельца кода, слоя, модуля, scope, public API, направления зависимостей и пути продуктовых данных. Триггеры: SLM, Scoped Layered Module Design, где разместить или перенести код, business factory, DomainApi, DomainDeps, compositions/business, dependency adapter, inline adapter в builder, прямой вызов API из page/screen/hook, Zustand/SWR/SDK внутри business, domain error, deep import, module vs component, ui vs parts, page-level provider/store, business graph, Partial<Business>, event bus, subscription cleanup, lifecycle, factory-level и assembly tests, архитектура template/scaffold, перенос между apps/*/src и packages/*. НЕ используй для форматирования уже размещённого React/TypeScript/CSS-кода, реализации REST/OpenAPI-клиента, Next.js routing/rendering или механики генерации шаблона без архитектурного выбора. В смешанной задаче сначала зафиксируй SLM-границу, затем применяй профильный skill."
---

<!-- Generated from src-skills/slm-design/SKILL.md. Do not edit manually. -->

# SLM Design

## Процесс архитектурного решения

Не изменяй файлы, пока не принято архитектурное решение. Название папки, существующий похожий код и удобный импорт не доказывают правильность размещения.

### Карточка решения

Перед реализацией определи:

| Вопрос | Что зафиксировать |
|---|---|
| Роль изменения | Framework wiring, продуктовый сценарий, интеграция, композиция интерфейса, технический сервис, UI или чистый фундамент |
| Владелец | Домен, route/page scope, composition module, infra-модуль, UI-модуль или локальный consumer |
| Данные | Продуктовые данные, техническое состояние, framework input, локальное UI-state или отсутствуют |
| Runtime-возможности | Источники данных, hooks, stores, SDK, browser API, events, clock, random, env и другие внешние capabilities |
| Место | Приложение или package, слой, модуль, вложенный модуль и сегмент |
| Публичная граница | Что действительно нужно экспортировать и кто будет consumer |
| Путь данных | От consumer до business API, dependency adapter и конкретного источника |
| Lifecycle | Кто создаёт instance, сколько instances допустимо и кто выполняет cleanup |
| Стратегия | Локальная правка, новый модуль, новый business-контракт, adapter, перенос или исправление public API |
| Проверки | Typecheck, тесты, import graph, public API, lifecycle и архитектурные инварианты |

Карточку не обязательно выводить пользователю, если решение очевидно. Но агент обязан уметь обосновать каждый пункт до изменения файлов.

### Сбор контекста

Перед выбором места:

1. Прочитай локальные инструкции приложения или package.
2. Найди фактическую границу SLM: `src/`, `apps/{app}/src` или другой локальный root.
3. Проверь существующие слои, группы и соседние модули. Не создавай новую параллельную структуру без необходимости.
4. Проверь aliases, package exports и реальную разрешимость импортов.
5. Найди текущих consumers, public API и runtime import graph изменяемой ответственности.
6. Проверь существующие templates или generators после архитектурного выбора. Шаблон не принимает решение за SLM.
7. Отдельно найди product I/O, hooks, stores, subscriptions, browser API и другие runtime-возможности.
8. Проверь, нет ли уже business-домена, которому принадлежит сценарий.

Не считай неиспользуемый provider, пустой context, тип будущего graph или ссылку на несуществующий домен готовой архитектурой. Решение должно быть достижимо из runtime entry point и иметь реальных consumers.

### Выбор роли

Классифицируй ответственность в следующем порядке.

#### Framework wiring

Если код существует только из-за фреймворка, размести его в `app`:

- route-файл;
- bootstrap;
- framework error entry;
- подключение глобальных ресурсов;
- тонкое подключение готового composition module.

`app` не реализует продуктовую композицию, business graph, store, provider или экран.

#### Продуктовый сценарий

Если код определяет пользовательский сценарий, доменную модель, продуктовый state, бизнес-правило, нормализацию внешних данных, error mapping или доменный переход после ошибки, владелец находится в `business/{domain}`.

Визуальная реакция на готовый domain error принадлежит consumer composition: сообщение, error screen, redirect, retry control и UI fallback выбираются по стабильному доменному `code`.

Любой новый внешний источник продуктовых данных требует business-контракта. Колокация внешних вызовов в page/screen/widget services не является допустимым упрощением.

#### Интеграция business-домена

Если код реализует `{Domain}Deps` через SDK, HTTP, storage, browser API, state/query runtime, event bus или другой concrete runtime, размести его в `compositions/business/{domain}`.

Это интеграционный composition module, а не business-домен и не обычная page/screen/widget composition.

#### Продуктовая композиция

Если код собирает route/page/layout/screen/widget, управляет UI-state, provider scope или lifecycle готового business graph, размести его в соответствующем composition module.

Потребительский composition module получает продуктовые данные только через `{Domain}Api`. Он не импортирует product SDK, generated operations, product storage adapter или конкретный источник.

#### Технический сервис

Если код предоставляет техническую возможность без продуктовой модели и сценариев, размести его в `infra`:

- HTTP client;
- SDK wrapper;
- logger;
- theme engine;
- i18n engine;
- telemetry transport;
- технический realtime client.

Composition может использовать технический infra-сервис напрямую, если сервис не становится обходным путём к продуктовым данным. Если capability нужна business, она всё равно передаётся через business-owned `deps` и adapter.

#### Универсальный UI

Если сущность отображает интерфейс, не знает продуктовый сценарий и применима независимо от конкретной composition, размести её в `ui`.

#### Чистый фундамент

Если код детерминирован, не имеет runtime-state, не знает продукт и переиспользуется несколькими владельцами, рассмотри `shared`. По умолчанию оставляй код рядом с первым владельцем.

### Выбор scope

Выбирай минимальный scope, который полностью владеет ответственностью:

1. Нужен одному component/module и не имеет самостоятельной ответственности: оставь внутри владельца.
2. Нужен как самостоятельная часть одного module: создай nested module в `parts/`.
3. Нужен нескольким частям одной page/route ветки: подними в общий composition scope этой ветки.
4. Нужен нескольким composition modules и остаётся продуктовой композицией: создай отдельный composition module.
5. Является доменным сценарием или product data boundary: создай или расширь `business/{domain}`.
6. Является техническим сервисом: создай или расширь `infra/{service}`.
7. Является универсальным UI: создай или расширь `ui/{module}`.
8. Выноси в package только `ui`, `infra` или `shared` код с реальным вторым consumer либо явно зафиксированным межприложенческим ownership/reuse-контрактом.

Не поднимай код выше ради короткого импорта. Не создавай `shared`, общий provider, generic business context или package «на будущее».

### Component, module и group

Применяй решение последовательно:

1. Только отображает готовые props и не владеет зависимостями: component в `ui/` родительского module.
2. Владеет сценарием, данными, state, dependency, lifecycle или внутренней декомпозицией: самостоятельный module.
3. Самостоятельный module, локальный для владельца: nested module в `parts/`.
4. Папка только классифицирует конечные modules: group без `index.ts`, state и runtime logic.
5. `ui/`, `parts/`, `hooks/`, `types/`, `services/` и другие служебные папки внутри module: segments, а не modules.

Если component начинает получать данные, выбирать источник, вызывать сценарный hook или управлять процессом, не добавляй логику в component. Измени архитектурную форму сущности.

### Выбор стратегии

#### Новый продуктовый сценарий

1. Найди домен-владелец.
2. Спроектируй `{Domain}Api`, доменные типы и доменные ошибки.
3. Опиши минимальные runtime-capabilities в `{Domain}Deps`.
4. Реализуй детерминированную доменную логику.
5. Создай отдельные adapters в `compositions/business/{domain}`.
6. Собери фабрику чистым builder.
7. Подключи API во владельце lifecycle graph.
8. Используй API из потребительских compositions.
9. Добавь factory-level и assembly tests.

#### Прямой product I/O вне business boundary

Не расширяй существующее нарушение.

1. Определи сценарий и домен.
2. Перенеси контракт данных в business-owned `Deps`.
3. Перенеси нормализацию, fallback и error mapping в business.
4. Оставь concrete source call в dependency adapter.
5. Замени прямой вызов на `{Domain}Api`.
6. Закрой adapter и source details из public API.

#### Новый store или dependency hook

Сначала определи, является state локальным UI-state или доменным state.

- State является локальным UI-state, если сбрасывается вместе с UI scope, управляет только представлением и не хранит продуктовый факт или product data cache. Такой state может принадлежать composition module и использовать выбранный state manager внутри владельца.
- State является доменным, если выражает продуктовый факт, инвариант, доступен через business API или участвует в бизнес-сценарии.
- Доменный state принадлежит business-контракту. Фабрика получает state adapter factory через `deps`, выбирает initial domain state и создаёт concrete port через adapter.
- Source/query hook реализуется adapter-ом; business вызывает только dependency hook и возвращает собственный доменный hook/result.

#### Сборка graph

1. Собери каждый домен отдельным `compositions/business/{domain}` builder.
2. Определи DAG cross-domain зависимостей.
3. Выбери один явный lifecycle scope: application-lifetime composition, route, page, request или test. Слой `app` только подключает application composition.
4. Создавай graph у владельца scope, а не в случайном screen/widget или на module scope без обоснования.
5. Передавай consumers точный graph type. Не используй `Partial<Graph>` с приведением к полному типу.
6. Для subscriptions, timers и resources зафиксируй cleanup/dispose.

#### Архитектурное ревью

Проверяй не только пути файлов, но и семантику:

- business-shaped код вне `business`;
- product graph в `infra`;
- type-only imports, которые фактически переносят ownership;
- provider, который не создаёт и не получает instance от явного владельца;
- orphan modules и providers, недостижимые из entry point;
- public API, раскрывающий raw store, context, adapter или generated types;
- отсутствующие tests обязательного business-контракта.

### Условия остановки

Останови реализацию и сначала исправь решение, если:

- владелец ответственности не определён;
- один state или source имеет несколько конкурирующих владельцев;
- business требует прямого runtime или type-only import concrete runtime;
- graph создаёт runtime-цикл;
- lifecycle instance или cleanup не определён;
- public API нужен только для обхода границы;
- шаблон генерирует архитектуру, противоречащую принятому решению;
- изменение требует незапрошенной миграции нескольких независимых областей.

### Локальные материалы

Основной процесс достаточен для типового решения. Открывай только материал, который нужен текущей ветке задачи.

| Ситуация | Материал |
|---|---|
| Нужна полная карта допустимых файлов, root entries, segments и tests | [Атлас файлов SLM](./reference/canons/file-atlas.md) |
| Задача затрагивает product I/O, source hook, domain store, event, lifecycle или external errors | [Runtime-граница business](#runtime-граница-business) |
| Выполняется архитектурное ревью или финальная проверка реализации | [Архитектурная проверка](#архитектурная-проверка) |
| Неясен layer, направление import или роль `app/compositions/business/infra/ui/shared` | [Слои](./reference/canons/layers.md) |
| Нужно отличить module, component, group, nested module или спроектировать public API | [Модули](./reference/canons/modules.md) |
| Проектируется factory, Api, Deps, domain error или сборка домена | [Business-фабрика](./reference/canons/business-factory.md) |
| Неясно размещение hook/store/service/mapper/provider/type/style | [Сегменты](./reference/canons/segments.md) |
| Решается вынос из `apps/*/src` в `packages/*` | [Монорепозитории](./reference/canons/monorepo.md) |
| Нужен полный пример adapters, builder, state runtime и graph lifecycle | [Business composition](./reference/examples/business-composition.md) |
| Нужна матрица factory-level, assembly и colocated tests | [Тестирование business-модулей](./reference/examples/business-testing.md) |
| Нужен page/route provider, локальный UI store и доступ к готовому graph | [Композиция через Provider](./reference/examples/react/composition-provider.md) |
| Команда выбирает организацию groups внутри `compositions` | [Структуры compositions](./reference/examples/react/composition-structures.md) |

Не используй карту как scaffold checklist. Наличие возможной папки не означает, что её нужно создать.

## Runtime-граница business

### Главный инвариант

Business-модуль выполняет доменную композицию только над:

- собственными типами и детерминированной логикой;
- capabilities, переданными фабрике через `{Domain}Deps`.

Business не вызывает runtime-возможность, если она не была передана фабрике. Это относится не только к данным и `infra`, но и к hooks, stores, subscriptions, browser API и другим concrete runtime-механизмам.

Фабрика отвечает на вопрос «какой стабильный доменный API нужен приложению», а не «какими библиотеками и источниками он реализован».

### Что разрешено внутри business

Business может напрямую использовать:

- собственные domain types;
- собственные services, mappers, normalizers, validators и type guards;
- собственные domain errors;
- детерминированные вычисления без I/O, runtime-state и скрытого окружения;
- чистые библиотеки вроде schema validators, decimal/date utilities, если результат определяется только явными аргументами и типы библиотеки не становятся public contract;
- type-only контракты других business API для cross-domain dependencies.

### Что передаётся через deps

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

### Запрещённые imports

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

### Доменный шлюз данных

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

### Business-owned deps

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

### Dependency adapters

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

### Dependency hooks

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

### Domain state

Business владеет:

- моделью доменного state;
- допустимыми переходами;
- commands и selectors;
- реакцией на dependency results и events.

Business не владеет concrete state manager. Business выбирает initial domain state и передаёт его в `deps.state.create(initialState)`; adapter только создаёт concrete store с переданным значением.

Zustand/Redux/MobX adapter реализует business-owned state adapter factory и создаётся в `compositions/business/{domain}`. Business-фабрика получает adapter factory через `deps`, передаёт initial domain state и получает concrete port.

Локальный UI-state является другим случаем. Состояние раскрытия sidebar, выбранной вкладки или шага локального UI-flow может использовать concrete state manager непосредственно внутри владеющего composition module, если оно не подменяет доменное состояние и product data boundary.

### Доменные ошибки

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

### Чистый builder

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

### Graph и lifecycle

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

### Cross-domain dependencies

Один business-домен не импортирует runtime другого домена. Он объявляет нужную capability в своих `Deps` через type-only API другого домена, по возможности суженный `Pick`.

Готовый API передаётся builder-у при сборке graph:

```text
createAuthBusiness()
  → createUserBusiness({ authApi })
  → createOrdersBusiness({ userApi })
```

Runtime-цикл означает ошибочную границу доменов. Не скрывай цикл service locator, lazy import или глобальным event bus.

Подробный контракт фабрики находится в [Business-фабрике](./reference/canons/business-factory.md). Практическая сборка показана в [Business composition](./reference/examples/business-composition.md).

## Архитектурная проверка

Не считай задачу завершённой только потому, что код компилируется или UI отображается. Проверь архитектурное решение, runtime-цепочку и обязательные тестовые границы.

### Проверка владельца

- У каждой ответственности один явный владелец.
- Product state и сценарии принадлежат business-домену.
- Page/route UI-state принадлежит соответствующему composition module.
- Concrete technical service принадлежит infra-модулю.
- Concrete business dependency adapter принадлежит `compositions/business/{domain}`.
- Provider находится у владельца scope, а не в generic infra-модуле.
- Код не поднят в общий слой или package без реального consumer.

### Проверка runtime-цепочки

Для каждого `{Domain}Api` проследи цепочку сборки:

```text
graph owner
  → per-domain builder
  → dependency adapters + business factory
  → {Domain}Api
  → provider/entry
```

И отдельно цепочку вызова:

```text
consumer
  → {Domain}Api
  → business scenario
  → {Domain}Deps
  → dependency adapter
  → source/runtime
```

Если отсутствует хотя бы одно необходимое звено, домен не подключён. Тип будущего API, пустой provider или неиспользуемый builder не заменяет runtime-сборку.

Для каждого route/page entry проверь, что он достигает готового composition module. `app` не должен реализовывать screen/layout/product wiring самостоятельно.

### Проверка business imports

В production-коде `business/**` не должно быть прямых runtime или type-only imports из concrete runtimes:

- `infra`, `compositions`, `app`;
- SDK/generated clients;
- SWR/TanStack Query/Apollo;
- Zustand/Redux/MobX/RxJS store runtime;
- React state/effect runtime;
- storage/browser API;
- env/event bus/clock/random implementations.

Разрешены собственные файлы, type-only business contracts, `shared` без runtime-capabilities и чистые детерминированные библиотеки.

Проверь не только import paths, но и re-export/barrel/helper, который может скрывать запрещённую зависимость.

### Проверка deps

- Каждая runtime-capability присутствует в `{Domain}Deps`.
- Контракт принадлежит business и назван доменным языком.
- В `Deps` нет client/SDK/generated operation/StoreApi/query-library types.
- Dependency hook возвращает business-owned source result.
- State dependency использует business-owned state port.
- External result имеет `unknown`, если требует runtime validation.
- Subscription возвращает cleanup.
- Cross-domain API сужен до реально используемых методов.

### Проверка adapters

- Для каждой runtime-capability есть явный adapter.
- Adapter находится в `compositions/business/{domain}`.
- Builder не содержит inline integration logic.
- Adapter не формирует domain error.
- Adapter не выполняет domain normalization.
- Adapter не выбирает business fallback.
- Private adapters отсутствуют в public `index.ts`.
- Concrete transport imports не протекают в обычные consumer compositions.

### Проверка product data

- Page/layout/screen/widget получает product data через `{Domain}Api`.
- Нет прямого вызова SDK/client/generated operation из потребительской composition.
- Нет product storage access в UI/component/composition service.
- DTO не используется как domain/view contract без business normalization.
- Один источник не имеет параллельного прямого и business-пути.

### Проверка ошибок

Для каждого public runtime operation проверь:

- rejected dependency;
- synchronous throw dependency;
- `undefined`/`null`/empty body;
- объект неправильной формы;
- source hook error;
- invalid state/storage value;
- неизвестную runtime-ошибку.

Во всех случаях наружу выходит только domain error со стабильным `code`. Source error сохраняется в `cause`, но не становится consumer contract. Technical failure и malformed response нельзя превращать в fallback; fallback разрешён только для валидного доменного исхода.

Не оставляй формулировку «domain error, если контракт это обещает». Business public contract всегда обещает только domain errors.

### Проверка state и hooks

- Business владеет domain state model, но не concrete state manager.
- Zustand/Redux/MobX store создаётся adapter-ом, не factory.
- SWR/Query hook создаётся adapter-ом, не business-модулем.
- Dependency hook является non-throwing/non-Suspense и передаёт technical error через business-owned result.
- Business wrapper вызывает dependency hook и возвращает собственный result type.
- Business wrapper преобразует error result и ошибки callbacks в domain errors.
- Store/query library types отсутствуют в public API и `Deps`.
- Определены creator, scope, количество instances и cleanup.
- Module singleton используется только при явно доказанном application/process lifetime.
- Provider не создаёт ложное впечатление владения instance, созданным на module scope.

### Проверка graph

- Per-domain builders собирают только свои фабрики.
- Graph owner назван и соответствует lifecycle.
- Домены создаются в топологическом порядке.
- Runtime-циклы отсутствуют.
- Один и тот же graph не копируется по нескольким providers без обоснования scope.
- Screen/widget не собирает graph самостоятельно.
- Provider value имеет точный тип.
- Нет `Partial<Graph>` с unchecked cast к полному graph.
- Subscription, timer, socket и другие resources имеют cleanup/dispose.
- Pending operation не может записать stale state после invalidation/unmount без явно принятой политики.

### Проверка public API

- Межмодульные импорты идут через реальный public entrypoint.
- Import alias/package export существует физически.
- Group не имеет `index.ts`.
- Business `index.ts` экспортирует runtime только factory, остальное через `export type`.
- Integration module экспортирует builder и необходимые type-only integration input contracts.
- Raw context, raw store, mutable singleton, adapter, generated operation и persistence key закрыты.
- Каждый export имеет реального внешнего consumer.
- Deep imports отсутствуют, включая tests уровня public contract.

### Проверка тестов

Business-модуль не завершён без factory-level tests.

Обязательный минимум:

1. Форма public API фабрики.
2. Happy path каждого runtime method/hook.
3. Invalid dependency response.
4. Rejected dependency.
5. Synchronous throw каждого обычного method/callback/state/lifecycle dependency. Dependency hooks проверяются отдельным non-throwing contract.
6. Domain error `code` и `cause`.
7. Порядок side effects и остановка после ошибки.
8. State transitions и concurrent calls.

`compositions/business/{domain}` не завершён без assembly tests:

1. Factory получает правильные adapters.
2. Каждый adapter вызывает нужный runtime source с правильным payload.
3. Builder не делает I/O при создании API.
4. Cross-domain API передан в правильном виде.
5. Private adapters не раскрыты public API.
6. Adapter пробрасывает source error без создания domain error.
7. Dependency hook не бросает и не использует Suspense/throw-on-error mode.
8. Lifecycle cleanup проверен, если есть subscriptions/resources.

Colocated tests обязательны для mappers, normalizers, type guards, domain errors и другой внутренней runtime-safe логики. Они дополняют, но не заменяют factory-level tests. Подробная матрица находится в [Тестировании business-модулей](./reference/examples/business-testing.md).

Проверь наличие исполняемого test script и test runner именно в изменяемом workspace. Root task без локального script не является выполненной тестовой инфраструктурой.

### Проверка целостности репозитория

- Все imports разрешаются.
- Все упомянутые modules и public entrypoints существуют.
- Direct runtime packages объявлены в package текущего workspace.
- Старый provider/store/source path удалён после миграции, если больше не используется.
- Нет speculative scaffold с пустым graph, несуществующими доменами или placeholder contracts.
- Template исправлен, если именно он системно создаёт нарушение.
- Выполнены доступные typecheck, tests, lint/build и `git diff --check`.

### Формат архитектурного ревью

Для каждого нарушения укажи:

1. Путь и строку.
2. Нарушенный invariant.
3. Runtime или maintenance риск.
4. Минимальную корректную границу.
5. Необходимые tests.

Отделяй обязательное нарушение от необязательного улучшения. Не предлагай большую миграцию, если нарушение можно устранить локально без создания второй архитектуры.

### Финальный gate

Перед завершением ответь «да» на все вопросы:

- Архитектурная роль изменения определена?
- Владелец ответственности и state определён?
- Все runtime-capabilities проходят через правильную границу?
- Product data проходит через business API?
- Business вызывает только переданные deps и собственную детерминированную логику?
- Наружу выходят только domain errors?
- Adapters существуют и закрыты?
- Graph и lifecycle определены?
- Public API минимален и разрешим?
- Обязательные tests созданы и запущены?
- Изменение не оставило старый параллельный путь?

Если хотя бы один ответ «нет», задача не завершена.
