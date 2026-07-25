---
title: Модули
description: Структура модуля, типы (композиционный, UI, бизнес, инфра), публичный API, отличие модуля от компонента
---

# Модули

Раздел описывает модуль как границу ответственности в SLM: что считается модулем, что такое компонент внутри модуля и как модуль взаимодействует с остальным кодом.

## Определение

**Модуль — минимальная архитектурная единица SLM. Он живёт на одном из слоёв, владеет конкретной областью ответственности и предоставляет наружу только публичный API.**

Модуль может содержать всё, что нужно этой области: компоненты, вложенные модули, хуки, сторы, сервисы, типы, стили, конфиги и утилиты. Набор сегментов не фиксирован — модуль включает только то, что реально нужно.

Модуль не обязан быть UI-блоком. Это может быть page composition, layout composition, screen composition, widget composition, бизнес-домен, инфраструктурный сервис или UI-kit сущность.

Главная граница модуля — не папка, а ответственность.

## Компонент

**Компонент — презентационная единица модуля, которая находится только в `ui/` своего родительского модуля и отвечает за отображение части интерфейса.**

Компонент не является архитектурной единицей: он не владеет сценарием, зависимостями, данными или внутренней структурой. Он работает только внутри границы родительского модуля.

> Компонент отображает. Модуль организует.

Компонент не может:

- Импортировать код проекта за пределами родительского модуля. Единственное исключение — компоненты слоя `ui`, если правила слоёв разрешают родительскому модулю импортировать `ui`.
- Владеть архитектурными зависимостями.
- Содержать вложенные компоненты: папка компонента включает только `{name}.tsx`, `index.ts`, `styles/`, `types/`.
- Содержать вложенные модули.
- Делать внешние запросы.
- Самостоятельно получать данные.
- Выбирать источник данных.
- Композировать данные.
- Вызывать сценарные хуки.
- Оркестрировать сценарий.
- Композировать модули.
- Решать, как устроен процесс.
- Содержать бизнес-логику.
- Содержать сценарную логику.

Компонент может рендерить другие компоненты: соседние компоненты из `ui/` своего модуля, компоненты слоя `ui` и элементы, переданные через props. Запрет «содержать» относится к структуре папки, а не к JSX-разметке: декомпозиция компонентов остаётся плоской внутри `ui/` родительского модуля.

Если компоненту требуется что-то из запрещённого списка, он перестаёт быть компонентом и должен быть оформлен как модуль.

```text
auth/
├── ui/
│   └── logout-button/
│       ├── logout-button.tsx
│       ├── styles/
│       │   └── logout-button.module.css
│       ├── types/
│       │   └── logout-button-props.type.ts
│       └── index.ts
└── index.ts
```

## Что считается модулем

Модулем считается папка, которая представляет самостоятельную область ответственности и имеет публичную границу.

## Группы модулей

Слой может содержать не только модули, но и группы модулей. По умолчанию модуль лежит прямо в слое; группу вводят только когда модулей много и нужна явная классификация.

Группа — навигационная папка внутри слоя или другой группы. Она классифицирует модули по типу, предметной области, продуктовой зоне или runtime-назначению, но сама не является модулем.

Жёсткие правила группы:

- группа не имеет public API;
- группа не содержит `index.ts`;
- группа не импортируется внешним кодом;
- группа не владеет логикой, состоянием, deps или runtime-сборкой;
- группа может содержать другие группы и конечные модули.

Модулем считается конечная папка с самостоятельной ответственностью и публичной границей.

```text
src/business/
├── app/          # группа
│   ├── auth/     # business-модуль
│   └── profile/  # business-модуль
└── cms/          # группа
    ├── content/  # business-модуль
    └── media/    # business-модуль
```

Примеры модулей:

- `compositions/pages/home/` — модуль page composition.
- `compositions/layouts/main/` — модуль layout composition.
- `compositions/screens/profile/` — модуль screen composition.
- `compositions/widgets/page-heading/` — модуль widget composition.
- `business/auth/` — модуль бизнес-домена.
- `infra/theme/` — модуль инфраструктурного сервиса.
- `ui/button/` — модуль UI-kit сущности.
- `compositions/pages/home/parts/hero-section/` — вложенный модуль page composition.

Не считаются модулями:

- `ui/`, `parts/`, `hooks/`, `types/`, `styles/`, `config/`, `providers/` — это сегменты.
- `compositions/pages/`, `business/app/`, `business/cms/` — это группы, если в них нет `index.ts`.
- `compositions/pages/home/ui/user-card/` — это компонент, если он находится в `ui/` и соблюдает ограничения компонента.

## Типы модулей

Тип модуля определяет обязательный корневой файл и стартовую структуру.

### Композиционный модуль

Композиционный модуль — модуль внутри `compositions`, который участвует в сборке страниц, маршрутов и крупных продуктовых частей интерфейса.

Он может быть page, layout, screen, widget, block, entry-point, CMS-entry, route segment или другим типом композиции, выбранным командой.

```text
compositions/pages/profile/
├── profile.page.tsx
├── profile-business-composition.ts
├── providers/
├── hooks/
├── stores/
├── parts/
├── types/
└── index.ts
```

Композиционный модуль может импортировать другие composition modules через public API. Это отличие слоя `compositions`: внутри него допускается графовая композиция.

При этом deep imports запрещены.

```ts
// Хорошо
import { useProfilePageStore } from '@/compositions/pages/profile'

// Плохо
import { useProfilePageStore } from '@/compositions/pages/profile/hooks/use-profile-page-store.hook'
```

### UI-модуль

Модуль строится вокруг основного UI-компонента и обязан иметь основной `.tsx` файл в корне:

```text
button/
├── button.tsx
└── index.ts
```

`ui/` внутри такого модуля используется только для компонентов, которые помогают корневому `.tsx` файлу.

### Бизнес-модуль

Бизнес-модуль — модуль, который строится вокруг публичного API фабрики.

Business-модуль содержит доменную логику, типы, hooks, services, mappers и helpers. Он не содержит React-компоненты и не возвращает компоненты из фабрики.

Бизнес-модуль обязан иметь фабрику в корне:

```text
auth/
├── auth.factory.ts
├── index.ts
└── types/
```

Фабрика возвращает публичный API модуля для использования в runtime.

### Инфраструктурный модуль

Инфраструктурный модуль — модуль, который строится вокруг технического сервиса или интеграции.

Инфраструктурный модуль не обязан иметь фиксированный корневой файл. Его структура определяется природой сервиса.

```text
theme/
├── index.ts
├── config/
├── hooks/
├── styles/
└── ui/
```

```text
backend-api/
├── backend-api.client.ts
├── config/
├── types/
└── index.ts
```

## Структура

Модуль состоит из сегментов. Ни один сегмент не обязателен — модуль включает только те части, которые нужны его ответственности.

```text
{module-name}/
├── {module-name}.factory.ts     # фабрика (для business-модулей)
├── {module-name}.tsx            # корневой файл модуля (опционален)
├── ui/                          # компоненты модуля, кроме business-модулей
├── parts/                       # вложенные модули
├── providers/                   # провайдеры модуля
├── hooks/                       # хуки
├── stores/                      # сторы состояния
├── services/                    # сценарии и операции модуля
├── mappers/                     # трансформация на границе ответственности
├── types/                       # типы
├── styles/                      # стили
├── lib/                         # утилиты модуля
├── config/                      # константы и конфигурация
└── index.ts                     # публичный API
```

Подробное описание сегментов — в разделе [Сегменты](./segments.md).

## Публичный API

Внешний код импортирует модуль только через публичный API.

```ts
// Хорошо
import { customerFactory } from '@/business/customer'
import type { Customer } from '@/business/customer'
```

```ts
// Плохо
import { validateToken } from '@/business/auth/lib/tokens'
```

`index.ts` модуля не обязан экспортировать всё содержимое. Он экспортирует только то, что действительно нужно снаружи.

Внутренние сегменты модуля остаются деталями реализации.

Business-модуль экспортирует из `index.ts` только фабрику и type-only экспорты. Это жёсткое правило без исключений.

```ts
// business/customer/index.ts
export { customerFactory } from './customer.factory'

export type { Customer } from './types/customer.type'
export type { CustomerApi } from './types/customer-api.type'
export type { CustomerDeps } from './types/customer-deps.type'
export type { CustomerFactory } from './types/customer-factory.type'
```

Composition module экспортирует через `index.ts` только безопасный контракт, который нужен другим composition modules или `app`: page/layout/screen/widget, provider, hooks доступа, типы. Внутренние stores, context objects и функции создания состояния не экспортируются без необходимости.

Stateful module по умолчанию не экспортирует raw context, `StoreApi`, mutable singleton, persistence key или concrete adapter. Экспортируй domain/technical commands, selectors и access hooks. Каждый mutable export требует реального внешнего consumer и отдельного обоснования.

Если layout, screen или widget импортируют hooks из page composition, не смешивайте в одном public API готовую page composition и hooks для дочерних модулей: это может создать runtime-цикл.

```ts
// compositions/pages/profile/index.ts
export { ProfilePageProvider } from './providers/profile-page.provider'
export { useProfilePageStore } from './hooks/use-profile-page-store.hook'
export { useProfileBusinessComposition } from './hooks/use-profile-business-composition.hook'

export type { ProfilePageState } from './types/profile-page-state.type'
```

## Фабрика

Business-модуль всегда экспортирует фабрику. Фабрика лежит в корне модуля (`{name}.factory.ts`), типизируется через `{Name}Factory` и возвращает публичный logic API фабрики.

Всё, что нужно внешнему коду в runtime, должно быть частью API, который возвращает фабрика.

Фабрика не возвращает React-компоненты, layouts, guards, boundaries, providers или page-level wrappers. Business-модуль не содержит React-компоненты: UI-решения домена размещаются в `compositions`, а полностью универсальные UI-компоненты — в `ui`.

Модуль без runtime-capabilities экспортирует фабрику без аргументов. Модуль с зависимостями экспортирует фабрику, принимающую `deps`: API других доменов и внешние возможности, описанные бизнес-языком. Source/query hooks, state stores, subscriptions, browser API, clock и другие runtime-механизмы также считаются dependencies. Типы всегда экспортируются напрямую через `export type`, но `import type` не разрешает протащить в business generated DTO, SDK/store/query contracts.

Runtime-сборка фабрики с реальными SDK, storage, infra-клиентами, source hooks, stores, events и browser API происходит в `compositions/business/{domain}` через отдельные adapters. Builder явно создаёт или получает scoped runtime instances без I/O, создаёт adapters поверх них и передаёт adapters factory. Конечный граф business API собирается в месте, которое владеет lifecycle: page composition, route composition, application-lifetime composition provider, request scope или test setup.

### Примеры

Подробные правила фабрики см. в [Business-фабрика](./business-factory.md).

Пример runtime-сборки business-фабрик см. в [Business composition](../examples/business-composition.md).

Пример page-level Provider в React см. в [Композиция через Provider](../examples/react/composition-provider.md).

Примеры разных структур слоя `compositions` см. в [Структуры compositions](../examples/react/composition-structures.md).

## Жизненный цикл

Модуль рождается на самом низком уровне использования и поднимается выше только при реальной потребности.

- Нужен одной странице, route branch или крупной продуктовой части интерфейса → внутри соответствующего composition module.
- Нужен нескольким частям одной страницы → внутри page composition или другого общего composition scope.
- Нужен нескольким страницам или маршрутам → отдельный composition module внутри `compositions`.
- Абстрактный UI без бизнес-логики → `ui/`.
- Сценарий, product data contract, domain state, тип или доменная логика → `business/{domain}/`.
- Concrete implementation business dependency → adapter в `compositions/business/{domain}/`.
- Технический сервис → `infra/`.
- Общая чистая утилита → `shared/`.

Подъём — обычный рефакторинг в рамках задачи, а не отдельная активность.
