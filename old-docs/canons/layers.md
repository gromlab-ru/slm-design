---
title: Слои
description: Иерархия слоёв от app до shared, правила зависимостей и зона ответственности каждого слоя
---

# Слои

Раздел описывает слои SLM: что такое слой, какие бывают, как между ними направлены зависимости и какие правила действуют на каждом.

## Определение

**Слой — уровень организации кода внутри `src/`. Каждый слой отвечает за свою область и задаёт правила для кода внутри: направление импортов, именование, допустимые связи между модулями.**

## Группы слоёв

Слои делятся на три группы:

| Группа | Слои | Описание |
|--------|------|----------|
| Композиция | `app`, `compositions` | Подключают приложение к фреймворку и собирают страницы, маршруты и крупные продуктовые части интерфейса |
| Ядро | `business`, `infra`, `ui` | Реализация продукта: бизнес-домены, техсервисы, UI-кит |
| Фундамент | `shared` | Общие ресурсы: утилиты, хелперы, стили, конфиги |

## Направление зависимостей

Любой импорт между модулями — только через публичный API.

```text
app → compositions
compositions → business | infra | ui | shared
business → shared
infra → infra | shared
ui → ui | shared
shared -/→ SLM-слои
```

- `app` подключает приложение к фреймворку и импортирует готовые composition modules
- `compositions` импортирует `business`, `infra`, `ui`, `shared`
- `business` импортирует только собственные файлы, детерминированный `shared`, чистые библиотеки и type-only контракты других business-модулей
- `infra` импортирует `infra` и `shared`
- `ui` импортирует `ui` и `shared`
- `shared` не импортирует другие SLM-слои
- `business`, `infra`, `ui`, `shared` не импортируют `compositions`
- Внутри `compositions` направление импортов между composition modules не фиксируется, но импорты разрешены только через публичный API и не должны создавать runtime-циклы
- Модули `business` вызывают любую runtime-capability только через `deps` фабрики; source/query hooks, stores, events и platform APIs также являются dependencies
- `import type` не разрешает переносить ownership: business не импортирует generated DTO, SDK/client/store/query types, а infra не объявляет product graph через type-only business imports
- Pure deterministic third-party libraries допустимы внутри business, если не имеют I/O/state/hidden environment и не протекают в public contract

## Слой App

Точка входа приложения. Отвечает за запуск, роутинг и подключение composition modules к фреймворку.

В отличие от остальных слоёв, `app/` не содержит модулей SLM. Здесь живут только инфраструктурные файлы, которые не могут быть никаким другим слоем: файлы фреймворка роутинга, точка запуска и код инициализации.

### Требования

- Не содержит модулей SLM — только файлы фреймворка, роутинг, инициализация
- Содержит: файлы маршрутов, bootstrap, обработку ошибок верхнего уровня (404, error boundary), подключение глобальных стилей и ассетов
- Провайдеры, guards, layouts, screens и страницы — только подключает готовые из `compositions`, не реализует
- Не содержит бизнес-логику, UI-компоненты, хуки, сторы, сервисы
- Никем не импортируется

## Слой Compositions

`compositions/` — слой сборки страниц, маршрутов и крупных продуктовых частей интерфейса.

На этом слое собираются page, layout, screen, widget и другие composition modules. Они связываются между собой и с нижними слоями: `business`, `infra`, `ui`, `shared`.

SLM не фиксирует жёсткую структуру внутри `compositions`. Команда выбирает организацию под фреймворк, роутинг, CMS и продуктовую задачу.

Базовая рекомендация:

```text
src/compositions/
├── business/
├── pages/
├── layouts/
├── screens/
└── widgets/
```

`business`, `pages`, `layouts`, `screens` и `widgets` внутри `compositions` не являются отдельными SLM-слоями. Это группы composition modules.

`compositions/business/{domain}` используется для runtime-сборки business-фабрик с реальными зависимостями приложения. Это не business-слой, а composition module, который адаптирует `infra`, SDK, storage и browser API к `deps` business-фабрики.

Внутри `compositions` различай три роли:

| Роль | Ответственность |
|---|---|
| Integration module | `compositions/business/{domain}` реализует adapters и собирает одну business-фабрику |
| Graph owner | Page/route/provider/request scope собирает готовые business API и управляет lifecycle |
| Consumer composition | Page/layout/screen/widget вызывает `{Domain}Api` и не знает concrete product source |

Consumer composition получает продуктовые данные только через business API. Прямые SDK/HTTP/generated/storage вызовы разрешены только dependency adapters интеграционного модуля домена.

Технический infra-сервис без product data можно использовать в composition напрямую. Если такой сервис нужен business, он всё равно описывается business-owned capability и передаётся фабрике через adapter.

Если business-домены сгруппированы, `compositions/business` повторяет ту же группировку: `business/app/auth` соответствует `compositions/business/app/auth`, `business/cms/content` соответствует `compositions/business/cms/content`. Это не default-структура, а способ сохранить навигацию в крупных проектах.

Composition module может содержать обычные сегменты SLM: `ui/`, `parts/`, `hooks/`, `stores/`, `services/`, `mappers/`, `types/`, `styles/`, `lib/`, `config/`, `providers/`.

Page-level store, provider, guard или business composition размещаются внутри page composition module, если они нужны всей странице.

```text
compositions/pages/profile/
├── profile.page.tsx
├── profile-business-composition.ts
├── providers/
├── hooks/
├── stores/
├── types/
└── index.ts
```

Layout, screen и widget могут получать через public API page composition локальный UI-state и готовые `{Domain}Api`. Product data не копируется в page store как параллельный источник истины.

```ts
import { useProfilePageStore } from '@/compositions/pages/profile'
```

Внутри `compositions` направление импортов между composition modules не фиксируется. Допустим граф, но все импорты идут только через public API.

```ts
// Хорошо
import { useProfilePageStore } from '@/compositions/pages/profile'

// Плохо
import { useProfilePageStore } from '@/compositions/pages/profile/hooks/use-profile-page-store.hook'
```

### Требования

- `compositions` содержит composition modules страниц, маршрутов и крупных продуктовых частей интерфейса
- Структура внутри `compositions` выбирается командой
- Базовая рекомендация: `business/`, `pages/`, `layouts/`, `screens/`, `widgets/`
- `business`, `pages`, `layouts`, `screens`, `widgets` внутри `compositions` являются группами composition modules
- `compositions/business/{domain}` собирает конкретную business-фабрику с runtime-зависимостями; при группировке используется зеркальный путь `compositions/business/{group}/{domain}`
- Concrete product sources, source/query hooks, domain stores, browser APIs и events подключаются только adapters интеграционного module
- Page/layout/screen/widget используют product data только через `{Domain}Api`
- Builder одной фабрики явно создаёт или получает scoped runtime instances без I/O, создаёт adapters поверх них и передаёт adapters factory; integration logic не пишется inline
- Providers, stores, guards и business composition размещаются внутри того composition module, которому они принадлежат
- Внутри `compositions` импорты между composition modules разрешены в любую сторону, но только через public API
- Runtime-циклы между composition modules запрещены
- Deep imports внутрь composition modules запрещены
- `business`, `infra`, `ui` и `shared` не импортируют `compositions`

## Слой Business

Бизнес-домены приложения: auth, catalog, orders, checkout, chat. Каждый домен — отдельный модуль со своими типами, hooks, services, mappers и доменной логикой.

Слой входит в группу «Ядро». Импортирует собственные файлы, детерминированный `shared/`, чистые библиотеки и type-only контракты других business-модулей. Каждый бизнес-модуль создаёт публичный API фабрики в корне. Любые runtime-capabilities передаются через аргументы фабрики.

Business объединяет то, что в FSD разделено на `features` и `entities`: пользовательские сценарии и бизнес-сущности живут вместе, внутри одного домена. Внутри домена сегменты разделяют ответственность: `types/` — доменная модель и dependency contracts, `hooks/` и `services/` — wrappers над переданными capabilities, `mappers/` — доменная нормализация, `lib/` — детерминированные доменные утилиты.

Business-модуль не содержит React-компоненты, layouts, guards, providers и page-level wrappers. Визуальный fallback, route boundary и привязка logic API к React tree размещаются в `compositions`; error mapping и допустимый доменный fallback остаются в business.

```text
src/business/
├── auth/
├── catalog/
├── orders/
├── checkout/
└── chat/
```

Когда количество доменов затрудняет навигацию — можно ввести группировку по крупным предметным областям. Группа — папка для организации, не модуль и не public API.

```text
src/business/
├── app/
│   ├── auth/
│   ├── profile/
│   └── orders/
└── cms/
    ├── content/
    ├── media/
    └── navigation/
```

`app` и `cms` здесь являются группами доменов. Модулями остаются конечные папки: `auth`, `profile`, `content`, `media`, `navigation`.

### Требования

- Один модуль = один бизнес-домен
- Business-домены можно группировать при необходимости; группа не является модулем и не содержит `index.ts`
- Циклические зависимости между доменами запрещены
- Публичный API фабрики — через фабрику в корне модуля (`{name}.factory.ts`). `index.ts` экспортирует только фабрику и type-only экспорты, без исключений
- Фабрика возвращает только logic API: hooks, selectors, command/query methods, scenario services
- Business-модуль не содержит React-компоненты и не возвращает компоненты из фабрики
- Любые runtime-capabilities — только через `deps` фабрики: product sources, hooks, stores, events, technical services, env и browser APIs
- Business не импортирует React/SWR/query/store runtime; concrete hooks и stores реализуются adapters
- Реальные SDK, API-клиенты, storage, state/query runtime, env и browser API подключаются в `compositions/business/{domain}` или зеркальном пути при группировке
- Business нормализует внешние результаты и подставляет только собственные domain errors
- Доменные типы (`User`, `Product`) живут здесь, не в `shared/`

## Слой infra

Техсервисы приложения: theme, i18n, API-адаптеры, logger, realtime. Каждый сервис — отдельный модуль.

Слой входит в группу «Ядро». Импортирует `infra/` и `shared/`.

Отличие от `shared/`: infra — инфраструктура приложения (сервисы, темы, адаптеры к API), `shared/` — общие ресурсы (утилиты, хелперы, стили, конфиги).

```text
src/infra/
├── theme/
├── i18n/
├── backend-api/
├── maps-api/
├── logger/
├── feature-flags/
└── realtime/
```

### Требования

- Один модуль = один техсервис
- Импортирует `infra/` и `shared/`
- Не содержит продуктовые composition modules конкретных страниц или маршрутов

## Слой UI

UI-кит без бизнес-логики: button, carousel, toast, modal.

Слой входит в группу «Ядро». Импортирует `ui/` и `shared/`.

Компоненты строятся друг на друге: `button` использует `icon`, `carousel` использует `button`.

```text
src/ui/
├── button/
├── input/
├── icon/
├── carousel/
├── modal/
├── toast/
├── dropdown/
├── tabs/
└── tooltip/
```

Когда количество компонентов затрудняет навигацию — вводится группировка на примитивы и композиции. Примитивы (`button`, `icon`, `input`) не импортируют композиции. Композиции (`carousel`, `modal`, `dropdown`) строятся на примитивах.

```text
src/ui/
├── primitives/
│   ├── button/
│   ├── input/
│   ├── icon/
│   └── badge/
└── composites/
    ├── carousel/
    ├── modal/
    ├── dropdown/
    ├── tabs/
    └── tooltip/
```

### Требования

- Не содержит бизнес-логику
- Импортирует только `ui/` и `shared/`

## Слой Shared

Общие ресурсы: утилиты, хелперы, стили, конфиги. Не знает о бизнес-домене.

Слой входит в группу «Фундамент» — ни о ком не знает, никого не импортирует.

Отличие от `infra/`: infra — инфраструктура приложения (сервисы, темы, адаптеры к API), `shared/` — общие ресурсы (утилиты, хелперы, стили, конфиги).

Отличие от `ui/`: UI-компоненты (button, carousel, modal) живут в слое `ui/`, а не здесь.

```text
src/shared/
├── lib/
├── types/
├── styles/
└── sprites/
```

### Требования

- Не имеет runtime-состояния
- Не знает о продуктовых composition modules
