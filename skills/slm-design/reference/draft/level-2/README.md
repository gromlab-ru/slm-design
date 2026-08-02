# SLM Level 2

> Статус: рабочий черновик. Документы в этой папке не являются спецификацией.

Level 2 предназначен для отдельных предметных областей, которым нужен устойчивый Domain API поверх нескольких внешних источников, сред выполнения или самостоятельных framework-модулей. Он сохраняет структурную базу Level 1, но заменяет выбранный доменный модуль доменным пакетом с обязательными `api`, production adapters и штатной сборкой `assemblies/default`.

## Наследование Level 1

Доменный пакет Level 2 соблюдает определения и правила Level 1, кроме явно заменённых положений:

| Положение Level 1 | Статус в Level 2 |
|---|---|
| Матрица `app → compositions → domains → { infra, ui } → shared` | Сохраняется |
| Модуль, Group, сегмент, компонент, публичный API и статический граф зависимостей | Сохраняют смысл |
| Доменный модуль и [`SLM-L1-DOMAIN-R015`](../rules/level-1.md#slm-l1-domain-r015) | Заменяются только для предметной области в пакетной форме |
| Единый публичный API модуля `api` | Представлен обязательными consumer type и factory-фасетами, implementer-фасетом ports при необходимости и необязательным runtime-фасетом |
| Навигационная Group слоя `domains` | Может одновременно содержать доменные модули и пакеты |
| Group внутри доменного пакета | Содержит обычные SLM-модули и Groups |

Канонический набор требований образуют [правила Level 1](../rules/level-1.md) и [правила Level 2](../rules/level-2.md).

## Основная идея

Для прикладного consumer предметная область существует как Domain API:

```text
framework / composition
        │
        ▼
    Domain API
        │
        ▼
dependency ports
        ▲
        │
production adapters
        │
        ▼
SDK / backend / storage / realtime
```

Модуль `api` владеет публичными моделями, validation, операциями, outcomes и стабильными ошибками. Он объявляет consumer-owned ports и получает их реализации через фабрику. Adapter знает конкретный provider, assembly выбирает adapters, а framework binding получает готовый API и организует state, cache, reactivity и hydration средствами своего framework.

Приложение не обращается к предметному внешнему источнику в обход Domain API. Это не запрещает самостоятельные технические сервисы `infra`, universal UI или framework-only SDK для получения opaque input; запрет относится к данным и операциям конкретного домена.

## Когда выбирать Level 2

Level 2 оправдан, когда предметной области нужны:

- собственная модель, отличающаяся от backend DTO;
- стабильные ошибки независимо от SDK и транспорта;
- несколько production sources или providers;
- HTTP, storage, realtime или platform integrations за одной предметной границей;
- разные baseline и специальные assemblies;
- строгие client/server/RSC/worker boundaries;
- самостоятельные domain-specific framework bindings;
- изолированные tests Domain API через fake ports и contract tests adapters.

Level 2 выбирается для конкретной предметной области. Один SLM root может корректно содержать простые доменные модули Level 1 и доменные пакеты Level 2. Размер каталога, один endpoint или один hook сами по себе не требуют перехода.

## Цена Level 2

Пакетная форма намеренно дороже простого доменного модуля. Она добавляет фасеты `api`, dependency ports, production adapters, обязательную штатную assembly, mapping внешних records и failures, а также отдельные test boundaries.

Эта цена окупается, когда Domain API действительно изолирует приложение от внешней модели, ошибок, provider и runtime. Если фабрика только переименовывает один метод SDK и возвращает тот же DTO и error, домену обычно достаточно Level 1.

Импорт assembly не создаёт граф и не запускает side effects. Composition root вызывает только assemblies dependency-connected доменов, нужных текущему route, request, worker или application scope; глобальная eager-сборка всех `default` не является требованием Level 2.

## Базовая форма

```text
src/domains/
├── catalog/                       # Доменный модуль Level 1
└── auth/                          # Доменный пакет Level 2
    ├── README.md                  # Необязательная metadata
    ├── api/                       # Обязательный SLM-модуль
    │   ├── index.ts               # Только consumer-facing public types
    │   ├── factory.ts             # Public factories
    │   ├── ports.ts               # При наличии dependency ports
    │   └── runtime.ts             # Необязательный deterministic runtime
    ├── adapters/                  # При наличии dependency ports
    │   ├── identity-rest/         # SLM-модуль
    │   └── identity-realtime/     # SLM-модуль
    ├── assemblies/                # Обязательная Group
    │   ├── default/               # Обязательная штатная assembly
    │   └── administration/        # Дополнительная assembly
    └── react/                     # Необязательная Framework Group
        ├── session/               # SLM-модуль
        └── queries/               # SLM-модуль
```

Корень пакета не является модулем и не имеет `index.ts`. Groups также не имеют агрегирующих API. Каждый исполняемый владелец внутри пакета остаётся обычным SLM-модулем со своей публичной границей.

## Публичные границы

```ts
import type {
  AuthError,
  AuthSession,
  AuthSessionApi,
} from '@/domains/auth/api'

import type {
  AuthIdentityPort,
  AuthIdentityPortFailure,
} from '@/domains/auth/api/ports'

import { createAuthSessionApi } from '@/domains/auth/api/factory'
import { isAuthError } from '@/domains/auth/api/runtime'

import { createAuth } from '@/domains/auth/assemblies/default'
import { AuthSessionProvider } from '@/domains/auth/react/session'
```

Обычный прикладной consumer импортирует типы `api`, при необходимости deterministic `api/runtime`, готовую production-сборку и framework bindings. Фасет `api/ports` предназначен для adapters, assemblies и tests. Фасет `api/factory` в production импортируют только assemblies своего домена.

Общие импорты `@/domains/auth`, `@/domains/auth/adapters`, `@/domains/auth/assemblies` и `@/domains/auth/react` запрещены: пакет и Groups не имеют публичного API.

## Штатная assembly

Каждый пакет содержит `assemblies/default`. Она создаёт канонический production-граф одного baseline capability context, объявленного проектом.

`default` может быть browser-only в React + Vite или действительно изоморфной в Next.js. Имя не является доказательством совместимости: проверяется executable import-граф для заявленных resolver conditions. Если RSC, administration, worker или realtime session требуют другого набора API, dependencies, trust или lifecycle, появляется дополнительная именованная assembly.

## State и framework

Domain API не является framework store. TanStack Query, SWR, Zustand, Redux, Pinia, Signals и аналогичные runtimes находятся в framework bindings или compositions. Они могут владеть framework metadata и UI-state, но их domain payload состоит только из public values, outcomes и events Domain API.

Server и client создают разные API instances и caches. Через RSC boundary передаются сериализуемые public values или hydration payload, но не фабрики, API objects, ports или mutable clients.

## Realtime

Realtime transport остаётся внутри adapter. Domain API может предоставлять command methods и subscriptions, но публикует только проверенные events, outcomes и stable domain errors. Correlation, acknowledgement, ordering, reconnect, duplicate delivery, resync, outcome uncertainty и cleanup задаются контрактом realtime port и не выводятся из поведения конкретного WebSocket SDK.

## Совместное применение форм

Простой доменный модуль и доменный пакет могут постоянно сосуществовать в одном SLM root, но одна предметная область имеет только одну форму. При связи, пересекающей пакет Level 2, доменный код использует type-only публичный контракт либо deterministic `api/runtime`; готовые API передаются runtime-аргументами assemblies пакетов Level 2 либо явным construction points модулей Level 1.

Переход одного домена изменяет его входящие dependency edges и composition roots, но не требует переводить несвязанные соседние домены на Level 2.

## Карта черновика

- [Терминология](./terminology.md)
- [Доменный пакет](./domains/domain-package.md)
- [Модуль api и Domain API](./domains/domain-api.md)
- [Фабрики, ports и adapters](./domains/factory-ports-adapters.md)
- [Assemblies и default](./domains/assemblies.md)
- [Состояние и кэш](./domains/state-cache.md)
- [Framework Groups и модули](./domains/framework-bindings.md)
- [Realtime](./domains/realtime.md)
- [Зависимости](./dependencies.md)
- [Тестирование](./domains/testing.md)
- [Проверка](./validation.md)
- [Переход auth](./domains/auth-example.md)
- [Открытые вопросы](./domains/open-questions.md)
