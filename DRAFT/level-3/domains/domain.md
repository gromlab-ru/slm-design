# Domain

> Рабочая заметка. Не является нормативным разделом спецификации.

## Определение

### DOM-N003: Domain является границей владения предметной областью

Domain группирует business-контракт, concrete integrations, готовые presets и framework-specific bindings одной предметной области.

Примеры Domain:

- `auth`;
- `user`;
- `catalog`;
- `orders`;
- `checkout`.

Domain не является одним большим module. Он является границей, внутри которой могут находиться modules и logical groups с заданным направлением зависимостей.

```text
Domain
├── business module
├── presets group
│   └── preset modules
├── framework binding module или group
└── optional reusable adapters group
    └── adapter modules
```

## Предварительная структура

```text
domains/auth/
├── business/
│   ├── auth.factory.ts
│   ├── errors/
│   ├── lib/
│   ├── services/
│   ├── tests/
│   ├── types/
│   └── index.ts
├── presets/
│   └── {preset-name}/
│       ├── adapters/
│       ├── create-auth.ts
│       ├── create-auth.test.ts
│       └── index.ts
└── {framework-binding}/
    ├── hooks/
    ├── providers/
    ├── tests/
    ├── ui/
    └── index.ts
```

`{preset-name}` и `{framework-binding}` являются placeholders, а не обязательными именами папок. Preset называется по своему scope или назначению. Framework binding может быть оформлен как `react`, `bindings/react`, `framework/react` или по другому локальному соглашению.

Environment-specific preset, включая server-only вариант, может быть добавлен отдельным preset module. SLM не требует заранее делить `presets` или `adapters` на `browser`, `server` и другие технические категории.

## Возможные ветки Domain

### DOM-N007: Domain не имеет фиксированного набора верхних папок

| Роль | Типичная форма | Статус |
|---|---|---|
| Business | Один business module | Основная гипотеза Domain |
| Presets | Logical group с preset modules | По наличию повторяемых assemblies |
| Framework bindings | Module или logical group | По наличию framework integration |
| Reusable adapters | Logical group с adapter modules | Только после promotion из владельца |
| Tests | Segment конкретного module | Не создаётся в корне Domain |

`model`, `types`, `errors`, `lib`, `ui`, `client` и `server` не становятся верхними Domain-разделами автоматически. Они размещаются внутри module-владельца либо появляются как локальное соглашение с отдельным обоснованием.

## Иерархия сущностей

### DOM-N004: Роль и структурный вид являются независимыми характеристиками

Архитектурная роль отвечает на вопрос «какую ответственность выполняет код»:

- business;
- preset;
- framework binding;
- adapter.

Структурный вид отвечает на вопрос «как оформлена граница кода»:

- Domain;
- module;
- group;
- segment;
- file.

```text
Domain
├── Module
│   ├── Segment
│   │   └── File
│   └── File
└── Group
    ├── Module
    └── Group
        └── Module
```

Правила структурных видов:

- Module владеет самостоятельной ответственностью и public API.
- Group является logical directory для навигации, не имеет `index.ts`, runtime и собственных файлов реализации.
- Segment существует внутри module, группирует его файлы по назначению и не имеет отдельного внешнего API.
- Имя папки само по себе не доказывает её структурный вид.

Пример классификации:

| Путь | Роль | Структурный вид |
|---|---|---|
| `domains/auth` | Предметная область Auth | Domain |
| `domains/auth/business` | Business | Module |
| `domains/auth/business/services` | Business scenarios | Segment |
| `domains/auth/business/tests` | Business tests | Segment |
| `domains/auth/presets` | Навигация presets | Group |
| `domains/auth/presets/{preset-name}` | Preset | Module |
| `domains/auth/presets/{preset-name}/adapters` | Private adapters preset | Segment |
| `domains/auth/{framework-binding}` | Framework binding | Module или Group по фактической границе |
| `domains/auth/adapters` | Навигация promoted adapters | Optional group |
| `domains/auth/adapters/{adapter-name}` | Reusable adapter | Module |

## Публичные границы

### DOM-N005: Domain предоставляет отдельные public submodules

Предварительно Domain не имеет обязательного общего facade. Каждый public module предоставляет собственный entrypoint:

```ts
import { authFactory, validateAuthPhone } from '@/domains/auth/business'
import { createApplicationAuth } from '@/domains/auth/presets/application'
import { AuthProvider, useAuth } from '@/domains/auth/react'
```

`application` и `react` здесь являются только примерами пользовательских имён. Отдельные entrypoints не смешивают business, concrete assembly и framework code в одном import graph.

Возможные public entrypoints:

```text
@/domains/auth/business
@/domains/auth/presets/{preset-name}
@/domains/auth/{framework-binding}
@/domains/auth/adapters/{adapter-name}  # только для promoted adapter module
```

Private adapters внутри preset не получают собственного внешнего entrypoint.

### DOM-N006: Omnibus barrel для всего Domain опасен

Такой entrypoint может связать изоморфный, client-only и server-only graphs:

```ts
// Не использовать как default-подход.
export * from './business'
export * from './presets/application'
export * from './react'
```

Tree shaking не считается security boundary. Server-only submodule не должен быть достижим из изоморфного или client entrypoint даже через re-export.

## Предварительное направление зависимостей

```text
business
  ↑
preset + private adapters

готовый business API instance
  ↑
framework bindings / compositions
```

Более точная схема импортов:

```text
business -/→ adapters | presets | framework | infra concrete runtime
preset-private adapters → business contracts + concrete runtime
promoted adapter module → business contracts + concrete runtime
presets → business factory + private or promoted adapters
framework → business contracts + ready API or preset
compositions → ready business API + framework bindings
```

Framework module может одновременно быть assembly site, если он явно владеет lifecycle API instance. Наличие папки `presets/` не даёт ей монополию на вызов factory.

## Domain и compositions

Domain владеет повторяемой доменной ответственностью. Composition по-прежнему владеет страницей, route tree, экраном и конкретным пользовательским outcome.

Предварительная граница:

| Ответственность | Владелец |
|---|---|
| Auth scenarios и contracts | `domains/auth/business` |
| Private auth adapters одной assembly | Segment внутри соответствующего preset module |
| Reusable auth adapter | Optional adapter module после promotion |
| Повторяемая сборка AuthApi | Конкретный preset module или другой assembly site |
| Auth React provider/access hook | Выбранный framework binding module |
| Текст ошибки, redirect, экран и route outcome | Consumer composition |

Граница domain-specific UI пока остаётся открытым вопросом.
