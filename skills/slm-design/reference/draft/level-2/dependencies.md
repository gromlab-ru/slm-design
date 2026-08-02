# Зависимости Level 2

> Уточнение статического import-графа и runtime injection graph внутри и между доменными границами.

## Связанные правила

- [`SLM-L2-API-A007`](../rules/level-2.md#slm-l2-api-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-DOMAIN-A026`](../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-API-A019`](../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ADAPTER-R021`](../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-API-A022`](../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-PORT-R027`](../rules/level-2.md#slm-l2-port-r027)
- [`SLM-L2-ASSEMBLY-R030`](../rules/level-2.md#slm-l2-assembly-r030)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

## Статическая матрица внутри пакета

| Исходный модуль | Допустимые зависимости |
|---|---|
| `api` | Собственные файлы, объявленные environment-neutral ресурсы `shared`, API-safe packages, type-only Domain API и `api/runtime` других доменов |
| Adapter module | `api/ports` своего домена, `infra`, concrete provider runtime, `shared` |
| Assembly | `api`, `api/ports`, `api/factory`, при необходимости `api/runtime` своего домена, публичные adapters своего домена, type-only Domain API других доменов, `shared` |
| Framework binding module | `api` и `api/runtime` своего домена, публичные framework modules своего домена, framework/state/query runtime, `ui`, `shared` |
| Graph owner | Assemblies и framework modules входящих в граф доменов, а также разрешённые матрицей `infra`, `ui` и `shared` |

Модуль `api` не достигает adapters, assemblies, framework modules, product SDK, storage, state/query manager, DOM, Node.js API или других environment-specific capabilities. Проверяется весь транзитивный executable и type graph его фасетов.

Adapter импортирует contract только через `api/ports`. Он не импортирует factory и consumer-facing runtime, потому что не создаёт API и не выбирает публичный domain outcome.

Assembly импортирует только adapters собственного домена. Production graph owner не импортирует concrete adapters или `api/factory`: он вызывает готовые assembly builders.

## Публичные фасеты

```text
api
  → import type прикладных contracts

api/ports
  → import type adapters, assemblies и tests

api/factory
  → runtime import assemblies и API tests

api/runtime
  → runtime import реальных consumers
```

Символьная type-проверка ports может быть строже обычного path allowlist. Проект объявляет, какие files и modules считаются adapters, assemblies и test boundaries.

## Междоменные статические импорты

Если связь пересекает границу пакета Level 2, разрешены:

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'

import {
  isAuthError,
} from '@/domains/auth/api/runtime'
```

Для доменного модуля Level 1 используется type-only импорт его обычного публичного API.

Запрещено импортировать из другого домена:

- `api/factory`;
- `api/ports`;
- готовый API singleton;
- assembly;
- adapter;
- framework state, hook, context, Provider или component;
- любой внутренний путь `api`.

Runtime-импорт `api/runtime` остаётся статическим ребром общего DAG. Если он создаёт цикл, границы доменов или владелец pure-функции пересматриваются.

## Runtime-инъекция cross-domain API

Готовый API другого домена передаётся assembly аргументом:

```text
createAuth()
  → AuthSessionApi
  → createUser({ auth })
  → UserProfileApi
```

User assembly передаёт `auth` своей factory. Она не импортирует runtime instance Auth.

Cross-domain API не превращается автоматически в local port. Bridge port нужен только при реальном translation contract. Structural copy чужого API скрывает owner и затрудняет обнаружение runtime-цикла.

## Runtime dependency graph

Статический DAG импортов не показывает все runtime edges, передаваемые аргументами. Architecture mapping объявляет либо review явно восстанавливает:

- assembly inputs;
- создаваемые Domain API;
- public APIs и construction points доменных модулей Level 1;
- передаваемые factories dependencies;
- callbacks и late-bound capabilities, пересекающие Level 2 boundary;
- scope и multiplicity;
- cleanup order.

Graph owner создаёт независимые APIs раньше зависимых и освобождает их в обратном порядке. Цикл `A API → B API → A API` запрещён, даже если одна сторона является модулем Level 1, а callback, lazy holder или local structural type сохраняет статически ацикличный import graph.

Lazy provider или registry не является автоматическим исключением. Для него требуется отдельный readiness, lifecycle и failure contract, а сам runtime edge остаётся частью graph review.

## Совместное применение Level 1 и Level 2

Один SLM root может постоянно содержать обе формы. Между двумя доменными модулями Level 1 продолжают действовать обычные правила Level 1.

Если хотя бы одна сторона является пакетом Level 2, runtime API создаёт внешний graph owner и передаёт assembly зависимого пакета Level 2 либо явной construction point/public callback зависимого модуля Level 1. Если у модуля Level 1 такой точки нет и связь невозможна без global singleton или обратного импорта, модуль рефакторится либо переводится на Level 2.

Переход формы остаётся локальным для предметной ответственности, но change radius включает все входящие imports и composition roots выбранного домена.

## Framework state

Framework binding использует framework API только своего доменного пакета:

```ts
// Допустимо внутри domains/auth/react/queries
import {
  useAuthApi,
} from '@/domains/auth/react/session'
```

```ts
// Недопустимо внутри domains/user/react/profile
import {
  useAuthApi,
} from '@/domains/auth/react/session'
```

Во втором случае composition читает projections обоих доменов и передаёт values или callbacks через публичные props. Если User Domain API зависит от Auth, связь выполняется assemblies на runtime graph level.

## Границы сред и RSC

Каждая declared client, server, edge, worker или shared entry point проверяется под реальными resolver conditions. Название `assemblies/default` не объявляет environment compatibility.

Tree shaking и runtime condition не доказывают изоляцию. Server-only adapter не достигается из client entry, даже если ветка считается неиспользуемой.

Checker различает:

- executable import edge;
- type-only import edge;
- framework reference edge;
- dynamic import с объявленным target capability set.

Server Component выполняется в server scope. Ссылка на Client Component и invocation Server Action анализируются как framework references, а не как обычное совместное выполнение. Для SSR-enabled Client Component отдельно проверяются server prerender graph, browser hydration graph и объявленные framework-deferred browser edges. Необъявленный или неанализируемый dynamic import запрещается либо явно allowlist-ится project policy.
