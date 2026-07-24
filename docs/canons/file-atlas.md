---
title: Атлас файлов SLM
description: Карта слоёв, типов modules, root files, segments, public API, tests и запрещённых файловых сочетаний
---

# Атлас файлов SLM

Используй атлас после того, как определены роль изменения и владелец ответственности. Не выбирай архитектуру по желаемому имени файла.

Атлас исчерпывает стандартные архитектурные роли SLM, но не является закрытым списком framework-файлов. Команда может добавить локальный segment или suffix, если его ответственность не дублирует существующую, не нарушает направление зависимостей и закреплена в локальных инструкциях.

## Единицы структуры

| Единица | Что означает | Имеет public API | Владеет runtime |
|---|---|---|---|
| Layer | Верхнеуровневая область ответственности внутри SLM root | Нет общего требования | Зависит от layer |
| Group | Навигационная папка для modules или других groups | Нет, `index.ts` запрещён | Нет |
| Module | Самостоятельный владелец одной ответственности | Да | Может |
| Segment | Папка внутри module по назначению файлов | Нет отдельного внешнего API | Только как часть владельца |
| Component | Презентационная часть родительского module в `ui/` | Локальный `index.ts` допустим | Нет архитектурного runtime |
| Root file | Главный entry/contract конкретного module | Экспортируется module `index.ts` | Зависит от типа module |

Сначала определи module, затем root file, затем необходимые segments. Не создавай все папки из атласа заранее.

## Карта SLM root

```text
src/
├── app/             # framework wiring
├── compositions/    # product tree, graph owners и business integrations
├── business/        # доменные контракты и сценарии
├── infra/           # технические runtime-сервисы
├── ui/              # универсальные UI modules
└── shared/          # детерминированный фундамент
```

В monorepo вместо `src/` границей приложения обычно является `apps/{app}/src/`. Packages находятся выше SLM root и не являются дополнительными слоями.

## Root files modules

| Pattern | Роль | Где допустим |
|---|---|---|
| `{name}.page.tsx` | Готовая page composition | `compositions` |
| `{name}.layout.tsx` | Product layout composition | `compositions` |
| `{name}.screen.tsx` | Уникальный screen leaf/branch | `compositions` |
| `{name}.widget.tsx` | Самостоятельный composition block | `compositions` |
| `{name}.route.tsx` | Route composition и route lifecycle | `compositions` |
| `{name}.entry.tsx` | Готовая точка подключения product tree | `compositions` |
| `{scope}-business-composition.ts` | Non-visual сборка business graph/scope | `compositions` |
| `{name}.ts` | Другой non-visual root, названный по ответственности | `compositions`, nested modules |
| `{name}.tsx` | Root UI/module component без специальной роли | `compositions`, `ui`, nested modules |
| `{domainName}.factory.ts` | Единственный runtime entry business-домена | `business/{domainPath}` |
| `create-{domainName}-business.ts` | Builder одной business-фабрики | `compositions/business/{domainPath}` |
| `{name}.client.ts` | Технический client | `infra/{service}` |
| `{name}.service.ts` | Технический root service, если service и есть module entry | `infra/{service}` |
| `index.ts` | Public API конечного module | В module; запрещён у group |

Root suffix не определяет owner автоматически. Например, `profile.store.ts` остаётся domain store или page UI store в зависимости от смысла state.

## Layer App

`app` содержит только файлы, требуемые framework/runtime entry.

Возможные файлы:

| Файл или pattern | Назначение |
|---|---|
| `main.tsx`, `bootstrap.tsx` | Запуск приложения |
| `app.tsx` | Тонкое подключение application entry/providers |
| `app-router.tsx`, `router.tsx` | Framework route registry |
| `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `not-found.tsx` | Framework-convention files |
| `middleware.ts` | Framework middleware boundary |
| framework metadata/config files | Только framework contract |

Правила:

- framework file импортирует готовый entry/route/page composition через public API;
- product tree собирается в `compositions`, не в `app`;
- business graph, domain store, screen, widget и product provider в `app` запрещены;
- у `app` нет SLM modules и общего `index.ts`;
- framework-specific server/client правила определяет профильный framework skill.

Минимальный пример:

```text
src/app/
├── app-router.tsx
├── app.tsx
└── main.tsx

src/compositions/entries/profile/
├── profile.entry.tsx
└── index.ts
```

## Consumer composition module

Consumer composition собирает product UI и использует готовые `{Domain}Api`.

```text
compositions/{group}/{name}/
├── {name}.{page|layout|screen|widget|route|entry}.tsx  # visual entry, если нужен
├── {name}-business-composition.ts                      # business graph, если module владеет им
├── {name}.ts                                           # другой non-visual entry, если нужен
├── ui/                                                 # presentation components
├── parts/                                              # nested modules
├── providers/                                          # provider владельца scope
├── guards/                                             # route/UI guards над готовым DomainApi
├── hooks/                                              # access/orchestration hooks
├── stores/                                             # только локальный UI-state
├── services/                                           # orchestration готовых API
├── mappers/                                            # domain result -> ViewModel
├── types/                                              # module-owned types
├── errors/                                             # только composition/UI errors, не domain errors
├── lib/                                                # локальные deterministic helpers
├── config/                                             # module configuration
├── styles/                                             # styles module
├── tests/                                              # scope/integration tests при необходимости
└── index.ts                                            # public API
```

Не все segments обязательны. Создавай только используемые.

Composition module не обязан иметь `.tsx`: request/application business graph использует `{scope}-business-composition.ts`, а другая non-visual orchestration может иметь root `.ts`, названный по ответственности, и public `index.ts`.

Guard принадлежит composition scope, использует готовый `{Domain}Api` и выбирает route/UI outcome. Guard не получает product data напрямую, не создаёт business graph и не импортирует source runtime.

Consumer composition не содержит:

- product SDK/client/generated operation;
- product storage adapter;
- source/query adapter домена;
- domain store implementation;
- domain mapper/error;
- business factory implementation.

Product data поступает только через `{Domain}Api`. `stores/` хранит presentation-only state: sidebar, tab, local step, transient form UI. Product entities и domain state туда не копируются.

### Page/route graph owner

Если composition владеет business graph и lifecycle, возможна структура:

```text
compositions/routes/profile/
├── profile.route.tsx
├── profile-business-composition.ts
├── providers/
│   ├── profile-business.provider.tsx
│   └── profile-business.context.ts
├── hooks/
│   └── use-profile-business.hook.ts
├── types/
│   └── profile-business.type.ts
├── tests/
│   └── profile-business-lifecycle.test.tsx
└── index.ts
```

Правила graph owner:

- graph type перечисляет только реально доступные API;
- `Partial<Business>` с cast к полному graph запрещён;
- graph создаётся в lifecycle владельца;
- domain lifecycle operation запускается после commit и возвращает cleanup;
- raw SDK/client/event bus не импортируется для досборки домена;
- screen/widget не создаёт тот же graph повторно.

## Integration module business

`compositions/business/{domainPath}` является единственным module, который знает одновременно business dependency contract и concrete runtime.

`{domainPath}` означает полный относительный путь конечного business module, а `{domainName}` — имя его последней папки. При groups integration path зеркалирует business path:

```text
business/app/auth/
compositions/business/app/auth/

business/cms/content/
compositions/business/cms/content/
```

```text
compositions/business/{domainPath}/
├── create-{domainName}-business.ts         # обязательный builder
├── create-{domainName}-business.test.ts    # обязательный assembly test
├── adapters/                               # обязательны при runtime dependencies
│   ├── {source}.adapter.ts
│   ├── {storage}.adapter.ts
│   ├── {query}-hook.adapter.ts
│   ├── {state-manager}-state.adapter.ts
│   ├── {event-source}-events.adapter.ts
│   └── {platform}-navigation.adapter.ts
├── types/                                  # builder/cross-domain/request input types
│   ├── create-{domainName}-business-deps.type.ts
│   └── create-{domainName}-business-request-input.type.ts
├── testing/                                # assembly fixtures, не public API
└── index.ts                                # builder и type-only integration inputs
```

Builder:

1. Явно создаёт или получает runtime instances нужного lifecycle без I/O.
2. Создаёт adapters поверх runtime instances.
3. Передаёт adapters и cross-domain API фабрике.
4. Возвращает готовый `{Domain}Api`.

Browser/application builder без cross-domain dependencies вызывается без аргументов. Request-scoped builder отдельно принимает `requestScopeInput` с request data; concrete client factory импортируется integration module.

Integration module не содержит:

- domain mapper/normalizer;
- domain error;
- business scenario;
- React provider/layout/screen/widget;
- full application graph;
- exported private adapter.

## Business module

Каждый `business/{domainPath}` имеет полный factory contract.

```text
business/{domainPath}/
├── {domainName}.factory.ts                 # обязательно
├── index.ts                                # обязательно
├── types/                                  # обязательно для contracts
│   ├── {domainName}-api.type.ts
│   ├── {domainName}-deps.type.ts
│   ├── {domainName}-factory.type.ts
│   ├── {domainName}-error.type.ts
│   ├── {domainName}-error-code.type.ts
│   ├── {entity}.type.ts
│   ├── {source}-hook-result.type.ts
│   └── {domainName}-state.type.ts
├── errors/
│   └── {domainName}-business.error.ts
├── services/
│   └── {scenario}.service.ts
├── hooks/
│   └── use-{scenario}.hook.ts              # wrapper над dependency hook
├── mappers/
│   └── map-{entity}.ts                     # unknown -> domain
├── lib/
│   └── {domain-helper}.ts
├── config/
│   └── {domainName}.config.ts              # deterministic domain constants
└── tests/
    └── {domainName}-factory/
        ├── public-api.test.ts
        ├── {scenario}.test.ts
        └── testing/
            └── create-{domainName}-deps.mock.ts
```

Обязательный минимум:

- `{domainName}.factory.ts`;
- `{Domain}Api`, `{Domain}Deps`, `{Domain}Factory`;
- domain error codes и собственная domain error для runtime failure;
- `index.ts` с одним runtime export фабрики и type-only exports;
- factory-level tests каждого public runtime operation;
- integration builder и assembly test для каждого business-модуля, включая dependency-free factory.

Условные файлы:

- `services/` только при выделенном сценарии;
- `hooks/` только для wrapper над dependency hook;
- `mappers/`/`normalizers/`/type guards при внешнем `unknown`;
- `errors/` при runtime operations;
- colocated tests обязательны для каждого mapper, normalizer, type guard и domain error;
- colocated tests services/hooks обязательны при самостоятельной branching, race или другой runtime-safe логике.

В business запрещены:

- `ui/`, React components, providers, layouts и guards;
- concrete `stores/` Zustand/Redux/MobX;
- `adapters/` concrete runtime;
- SDK/client/generated DTO;
- SWR/TanStack Query/Apollo runtime или types;
- React state/effect runtime или types;
- storage/browser/event/env implementation;
- raw external error в public API.

## Infra module

Infra module владеет техническим сервисом без продуктовой модели.

```text
infra/{service}/
├── {service}.client.ts                     # если module является client
├── {service}.service.ts                    # если module является service
├── client.ts                               # допустимый technical entry
├── config/
├── clients/
├── services/
├── transports/
├── hooks/                                  # technical hooks
├── providers/                              # provider technical service
├── ui/                                     # только technical UI, например theme tooling
├── errors/                                 # transport/technical errors
├── types/                                  # technical contracts/DTO
├── lib/
├── tests/
└── index.ts
```

Различай два вида adapter:

| Вид | Где живёт | Что знает |
|---|---|---|
| Transport adapter/client | `infra` | Протокол, SDK, HTTP, transport types |
| Domain dependency adapter | `compositions/business/{domainPath}` | Business `Deps` и конкретный infra runtime |

Infra не содержит business graph, domain state, product provider или domain error. Type-only imports business API не дают infra права агрегировать product graph.

## UI module

UI module предоставляет универсальный UI без business logic и product I/O.

```text
ui/{name}/
├── {name}.tsx                              # обязательный root component
├── ui/                                     # внутренние presentation components
├── parts/                                  # nested UI modules при самостоятельной роли
├── hooks/                                  # presentation behavior
├── stores/                                 # только локальный UI-state
├── providers/                              # UI scope provider
├── types/                                  # props и UI contracts
├── styles/
├── lib/                                    # presentation helpers
├── tests/
└── index.ts
```

UI module может строиться на других UI modules и `shared`. Он не импортирует business, infra или compositions, не получает product data самостоятельно и не выбирает источник.

## Shared

`shared` содержит только детерминированный фундамент без знания о продукте и runtime-state.

```text
shared/
├── lib/
│   └── {utility}/
│       ├── {utility}.ts
│       ├── {utility}.test.ts
│       └── index.ts
├── types/
├── styles/
├── config/                                 # только product-agnostic constants
├── assets/                                 # product-agnostic assets при локальном соглашении
└── sprites/                                # специализированная группа assets, если используется
```

Shared не содержит:

- product/domain types;
- stores и mutable singletons;
- SDK/client wrappers;
- React providers;
- environment-dependent services;
- imports из других SLM layers.

## Components внутри ui segment

Presentation component родительского module имеет плоскую структуру:

```text
{module}/ui/{component}/
├── {component}.tsx
├── types/
│   └── {component}-props.type.ts
├── styles/
│   └── {component}.module.css
└── index.ts
```

В папке component запрещены:

- `hooks/`, `stores/`, `services/`, `providers/`, `parts/`;
- source calls и scenario hooks;
- imports project code вне parent module, кроме разрешённых UI modules;
- nested components как отдельные architectural folders.

Если это требуется, сущность становится module и перемещается в `parts/` либо на общий composition/UI уровень.

## Nested modules в parts

Каждый элемент `parts/` является полноценным module:

```text
{parent}/parts/{part}/
├── {part}.tsx                              # visual root, если нужен
├── {part}.ts                               # non-visual root, если нужен
├── ui/
├── parts/
├── hooks/
├── stores/                                 # только state ответственности part
├── types/
├── styles/
├── tests/
└── index.ts
```

Одиночные `.tsx`, `.ts` или style files непосредственно в `parts/` запрещены. Если nested module нужен за пределами parent, подними его в минимальный общий scope.

## Segment matrix

| Segment | Consumer composition | Business integration | Business | Infra | UI | Shared |
|---|---|---|---|---|---|---|
| `ui/` | Да | Нет | Нет | Условно, technical UI | Да | Нет |
| `parts/` | Да | Нет | Нет | Условно | Да | Нет |
| `providers/` | Да | Нет | Нет | Да | Условно | Нет |
| `guards/` | Да, над готовым DomainApi | Нет | Нет | Нет | Нет | Нет |
| `hooks/` | Да | Нет | Только wrappers над deps | Technical hooks | Presentation hooks | Нет |
| `stores/` | Только UI-state | Нет, используй `adapters/` | Нет concrete stores | Technical state | Только UI-state | Нет |
| `services/` | Orchestration готовых API | Нет, используй `adapters/` | Domain scenarios над deps | Technical services | Presentation-only | Нет |
| `adapters/` | Нет product adapters | Да | Нет | Только transport adapters по локальному соглашению | Нет | Нет |
| `mappers/` | Domain -> ViewModel | Нет, transport adaptation остаётся в adapter | `unknown` -> domain | Transport mapping | View mapping | Чистые generic transforms |
| `errors/` | UI/composition errors | Нет domain errors | Domain errors | Technical/transport errors | UI errors | Только generic errors |
| `types/` | Module contracts | Integration input types | Domain contracts | Technical contracts/DTO | Props/UI contracts | Product-agnostic types |
| `styles/` | Да | Нет | Нет | Условно | Да | Global/foundation styles |
| `lib/` | Local helpers | Assembly helpers | Domain deterministic helpers | Technical helpers | Presentation helpers | Generic deterministic helpers |
| `config/` | Composition constants | Runtime assembly config | Domain constants | Technical config/env | UI constants | Product-agnostic constants |
| `tests/` | Scope/integration tests | Обязательные assembly tests | Обязательные factory tests | Technical tests | UI tests | Unit tests |

## Имена обычных файлов

| Pattern | Назначение |
|---|---|
| `{name}.type.ts` | Module-owned type |
| `{name}-props.type.ts` | Component props |
| `{name}.hook.ts`, `use-{name}.hook.ts` | Hook владельца |
| `{name}.store.ts` | Concrete store только допустимого owner/scope |
| `{name}.service.ts` | Scenario или technical service по layer |
| `{name}.adapter.ts` | Adapter с явно определённым видом |
| `map-{name}.ts`, `normalize-{name}.ts` | Mapper/normalizer владельца |
| `{name}.provider.tsx` | Provider владельца scope |
| `{name}.guard.tsx` | Route/UI guard consumer composition |
| `{name}.context.ts`, `{name}.context.tsx` | Private context implementation |
| `{name}.error.ts` | Error соответствующего layer |
| `{name}.config.ts` | Configuration владельца |
| `{name}.constant.ts` | Константа владельца |
| `{name}.module.css` | Styles конкретного module/component |
| `{name}.test.ts`, `{name}.test.tsx` | Colocated test |

Suffix описывает техническую форму, но не переносит ownership. `user.type.ts` не становится shared только потому, что это type; `auth.store.ts` не становится infra только потому, что использует Zustand.

## Public API по типам modules

| Module | Runtime exports | Type exports | Не экспортировать |
|---|---|---|---|
| Consumer composition | Entry/provider/access hooks | Props, state/view types | Raw context/store factory/internal parts |
| Business integration | `create{Domain}Business` | Cross-domain/request input types | Adapters, clients, mocks |
| Business | Только `{domainName}Factory` | Api, Deps, Factory, domain/error types | Services, hooks, mappers, error class |
| Infra | Минимальный technical API | Technical contracts | Mutable internals и generated tree без необходимости |
| UI | Root component и доказанные UI helpers | Props/UI types | Internal components/store/context |
| Nested module | Root entry | Props/module types | Parent internals |

Если дочерние layout/screen/widget импортируют access hooks владельца scope, не экспортируй из того же public API готовый entry, который импортирует эти дочерние modules. Раздели scope API и ready entry на отдельные composition modules, чтобы не создать runtime-цикл.

## Tests map

| Проверяемая граница | Размещение | Обязательность |
|---|---|---|
| Business public contract | `business/{domainPath}/tests/{domainName}-factory/` | Обязательно |
| Business mapper/normalizer/type guard/domain error | Рядом с файлом | Обязательно для каждого такого файла |
| Business service/hook wrapper | Рядом с файлом | При самостоятельной branching/race/runtime-safe логике |
| Adapter и builder wiring | `compositions/business/{domainPath}/*.test.ts` | Обязательно для каждого business-модуля |
| Graph lifecycle/provider | Tests graph owner module | При state/subscriptions/resources |
| Consumer composition | Рядом или `tests/` module | По поведению scope |
| Infra transport/service | Внутри infra module | По technical contract |
| UI module/component | Внутри UI module | По интерактивному поведению |

## Запрещённые структуры

```text
business/auth/ui/                          # React UI внутри business
business/auth/stores/auth.store.ts         # concrete Zustand/Redux store
business/auth/adapters/backend.adapter.ts  # concrete runtime adapter
business/auth/types/sdk-response.type.ts   # generated/external DTO contract

compositions/pages/profile/services/api.ts # прямой product source
compositions/screens/profile/store.ts      # product/domain cache в screen

infra/business/                            # product graph/provider в infra
shared/user.type.ts                        # product domain type в shared

business/app/index.ts                      # group с public API
compositions/pages/index.ts                # group с public API

{module}/parts/hero.tsx                    # файл вместо nested module
{module}/ui/card/hooks/                    # component с собственной логикой
```

## Новый тип файла или segment

Если нужной роли нет в атласе:

1. Назови ответственность файла без технического suffix.
2. Определи module-владельца и допустимые зависимости.
3. Проверь, не является ли файл существующим `service`, `adapter`, `mapper`, `provider` или nested module.
4. Создай новый segment только для нескольких файлов с одной устойчивой ролью.
5. Не создавай global segment на уровне `src/`.
6. Зафиксируй локальное соглашение, если pattern будет повторяться.
7. Обнови template, если новый pattern стал обязательной повторяемой структурой.

Не подгоняй ответственность под красивое дерево. Минимальный корректный module лучше полного scaffold без реального поведения.
