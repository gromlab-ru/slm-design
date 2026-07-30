# Граница доменного пакета

> Пояснение контейнерной сущности Level 2 и её совместного использования с доменными модулями Level 1.

## Связанные правила

- [`SLM-L2-DOMAIN-R002`](../../rules/level-2.md#slm-l2-domain-r002)
- [`SLM-L2-DOMAIN-A003`](../../rules/level-2.md#slm-l2-domain-a003)
- [`SLM-L2-GROUP-R004`](../../rules/level-2.md#slm-l2-group-r004)
- [`SLM-L2-BUSINESS-R005`](../../rules/level-2.md#slm-l2-business-r005)
- [`SLM-L2-DOMAIN-A026`](../../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)

## Предметная граница

Доменный пакет представляет одну связную предметную область и объединяет только принадлежащие ей SLM-модули. Пакет `auth` может содержать business-сценарии авторизации, её browser/server assemblies и React-модули, но не страницу профиля или общий database client.

Пакет не владеет исполняемой ответственностью. Конкретными API, состоянием, зависимостями и lifecycle владеют модули внутри него.

Level 2 применяется к пакету, а не ко всему SLM root. Например, `auth` может быть пакетом Level 2, пока `catalog` и `news` остаются доменными модулями Level 1.

## Корень пакета

```text
domains/auth/
├── README.md
├── business/
├── assemblies/
├── adapters/
└── react/
```

В корне разрешены:

- документация;
- ownership metadata;
- декларативный manifest или декларативная конфигурация архитектурной проверки;
- обязательный модуль `business`;
- обязательная непустая Group `assemblies`;
- непустая Group `adapters`, если хотя бы одна фабрика имеет технические зависимости;
- Framework Groups при наличии соответствующих модулей.

В корне запрещены:

- `index.ts` или другой агрегирующий executable entry point;
- runtime-файлы и side effects;
- изменяемое состояние и ресурсы lifecycle;
- реэкспорт API внутренних модулей;
- page-specific компоненты или сборка нескольких доменов.

Metadata содержит только статические данные. Проверяющий инструмент может читать её декларативно, но она не исполняется и не становится скрытым API пакета.

## Policy boundary

Доменный пакет не является узлом import-графа. Его техническая граница состоит из объявленного проверке набора дочерних модулей и правил, применяемых ко всем связям через эту границу.

Отсутствие root barrel намеренно:

- client- и server-entry points не агрегируются в один импорт;
- каждый модуль сохраняет отдельную ответственность и environment boundary;
- переименование публичного модуля является изменением его собственного контракта, а не скрывается пакетом;
- versioning целого publishable package остаётся за пределами Level 2.

## Модули и Groups

`business` размещается непосредственно в пакете. Assemblies находятся в обязательной Group `assemblies`. Production adapters являются самостоятельными модулями Group `adapters`. Framework Group называется по фреймворку: `react`, `vue` и аналогично.

```text
auth/
├── business/                  # SLM-модуль
│   ├── index.ts              # Только public types
│   ├── factory.ts            # Public factories entry
│   └── runtime.ts            # Необязательный deterministic runtime
├── adapters/                 # Group при наличии technical dependencies
│   └── phone-http/           # SLM-модуль
├── assemblies/               # Обязательная Group
│   └── browser/              # SLM-модуль
└── react/                    # Framework Group
    ├── session/              # SLM-модуль
    └── login-form/           # SLM-модуль
```

Groups не имеют `index.ts`. Поэтому публичными путями являются `auth/business`, `auth/business/factory`, опциональный `auth/business/runtime`, `auth/adapters/phone-http`, `auth/assemblies/browser` и `auth/react/session`, но не `auth`, `auth/adapters`, `auth/assemblies` или `auth/react`.

## Навигационные Groups

Слой `domains` может содержать Groups с обеими формами домена:

```text
domains/
└── commerce/                 # Навигационная Group
    ├── catalog/              # Доменный модуль Level 1
    └── orders/               # Доменный пакет Level 2
```

Такая Group отличается от Group внутри пакета допустимым составом: она содержит доменные модули, доменные пакеты и другие navigation Groups, а не внутренние модули пакета.

Одна предметная область не представляется одновременно модулем и пакетом. Переход завершается удалением старой границы именно этого домена, а не переводом всех соседних областей.

## Границы соседних слоёв

| Ответственность | Владелец |
|---|---|
| Предметные сценарии, Domain API, доменные ошибки | `business` |
| Техническая реализация зависимости одного домена | Adapter внутри пакета |
| Сборка API для именованного контекста | Assembly внутри пакета |
| Универсальный технический сервис | `infra` |
| Domain-specific framework API | Модуль внутри `react`, `vue` и аналогичной Group |
| Страница, маршрут, redirect, продуктовый текст | `compositions` |
| UI, объединяющий несколько доменов | `compositions` |

Зависимость от React сама по себе не доказывает принадлежность пакету. Решающим остаётся владелец ответственности.
