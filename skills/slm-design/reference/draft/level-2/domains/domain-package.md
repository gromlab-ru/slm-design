# Граница доменного пакета

> Пояснение контейнерной сущности Level 2 и её совместного использования с доменными модулями Level 1.

## Связанные правила

- [`SLM-L2-DOMAIN-R002`](../../rules/level-2.md#slm-l2-domain-r002)
- [`SLM-L2-DOMAIN-A003`](../../rules/level-2.md#slm-l2-domain-a003)
- [`SLM-L2-GROUP-R004`](../../rules/level-2.md#slm-l2-group-r004)
- [`SLM-L2-API-R005`](../../rules/level-2.md#slm-l2-api-r005)
- [`SLM-L2-DOMAIN-A026`](../../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)

## Предметная граница

Доменный пакет представляет одну связную предметную область и объединяет только принадлежащие ей SLM-модули. Пакет `auth` может содержать Domain API авторизации, production adapters её providers, assemblies и React bindings, но не страницу профиля, общий database client или multi-domain navigation policy.

Пакет не владеет исполняемой ответственностью. Domain API, adapters, production graph, framework projection и lifecycle принадлежат конкретным модулям внутри него.

Level 2 применяется к пакету, а не ко всему SLM root. Например, `auth` может быть пакетом Level 2, пока `catalog` и `news` остаются доменными модулями Level 1.

## Корень пакета

```text
domains/auth/
├── README.md
├── api/
├── adapters/
├── assemblies/
└── react/
```

В корне разрешены:

- документация;
- ownership metadata;
- декларативный manifest архитектурной проверки;
- объявления environment capability sets;
- обязательный модуль `api`;
- обязательная непустая Group `assemblies` с модулем `default`;
- непустая Group `adapters`, если хотя бы одна фабрика имеет dependency port;
- Framework Groups при наличии соответствующих модулей.

В корне запрещены:

- `index.ts` или другой агрегирующий executable entry point;
- runtime-файлы и side effects;
- изменяемое состояние и lifecycle resources;
- реэкспорт API внутренних модулей;
- page-specific компоненты или сборка нескольких доменов.

Metadata содержит только статические данные. Проверяющий инструмент может читать её декларативно, но она не исполняется и не становится скрытым API пакета.

## Policy boundary

Доменный пакет не является узлом import-графа. Его техническая граница состоит из объявленного проверке набора дочерних модулей и правил, применяемых ко всем связям через эту границу.

Отсутствие root barrel намеренно:

- client, server, RSC и worker entry points не агрегируются в один импорт;
- каждый модуль сохраняет отдельные ответственность и environment boundary;
- concrete adapters не становятся частью Domain API;
- Groups не превращаются в скрытые modules;
- versioning publishable package остаётся за пределами Level 2.

## Модули и Groups

```text
auth/
├── api/                       # SLM-модуль
│   ├── index.ts               # Consumer-facing types
│   ├── ports.ts               # Implementer-facing types
│   ├── factory.ts             # Runtime factories
│   └── runtime.ts             # Необязательный deterministic runtime
├── adapters/                  # Group при наличии ports
│   ├── identity-rest/         # SLM-модуль
│   └── identity-realtime/     # SLM-модуль
├── assemblies/                # Обязательная Group
│   ├── default/               # Обязательный SLM-модуль
│   └── administration/        # Дополнительный SLM-модуль
└── react/                     # Framework Group
    ├── session/               # SLM-модуль
    └── queries/               # SLM-модуль
```

Groups не имеют `index.ts`. Публичными путями являются `auth/api`, `auth/api/ports`, `auth/api/factory`, опциональный `auth/api/runtime`, `auth/adapters/identity-rest`, `auth/assemblies/default` и `auth/react/session`, но не `auth`, `auth/adapters`, `auth/assemblies` или `auth/react`.

## Навигационные Groups

Слой `domains` может содержать Groups с обеими формами домена:

```text
domains/
└── commerce/                 # Навигационная Group
    ├── catalog/              # Доменный модуль Level 1
    └── orders/               # Доменный пакет Level 2
```

Такая Group отличается от Group внутри пакета допустимым составом: она содержит доменные модули, доменные пакеты и другие navigation Groups, а не внутренние модули пакета.

Одна предметная область не представляется одновременно модулем и пакетом. Переход завершается удалением старой границы выбранного домена, но требует обновить все его входящие imports и production composition roots.

## Границы соседних слоёв

| Ответственность | Владелец |
|---|---|
| Публичные модели, Domain API, validation и domain errors | `api` |
| Контракт external capability | `api/ports` |
| Production-реализация dependency port | Adapter внутри пакета |
| Штатный production-граф | `assemblies/default` |
| Специальный production-граф | Дополнительная assembly |
| Domain-specific framework state, cache и bindings | Модуль внутри `react`, `vue` и аналогичной Group |
| Универсальный технический сервис | `infra` |
| Страница, маршрут, redirect, продуктовый текст | `compositions` |
| UI, объединяющий несколько доменов | `compositions` |

Зависимость от React, WebSocket или SDK сама по себе не определяет владельца. Решающими остаются предметная ответственность, направление dependency inversion и публичная граница.
