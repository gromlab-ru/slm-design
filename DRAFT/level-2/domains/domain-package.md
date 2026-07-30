# Граница доменного пакета

> Пояснение новой контейнерной сущности Level 2.

## Связанные правила

- [`SLM-L2-DOMAIN-R002`](../../rules/level-2.md#slm-l2-domain-r002)
- [`SLM-L2-DOMAIN-A003`](../../rules/level-2.md#slm-l2-domain-a003)
- [`SLM-L2-GROUP-R004`](../../rules/level-2.md#slm-l2-group-r004)
- [`SLM-L2-BUSINESS-R005`](../../rules/level-2.md#slm-l2-business-r005)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-PRESET-A020`](../../rules/level-2.md#slm-l2-preset-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

## Предметная граница

Доменный пакет представляет одну связную предметную область и объединяет только принадлежащие ей SLM-модули. Пакет `auth` может содержать business-сценарии авторизации, её browser/server presets и React-модули, но не страницу профиля или общий database client.

Пакет не владеет исполняемой ответственностью. Конкретными API, состоянием, зависимостями и lifecycle владеют модули внутри него.

## Корень пакета

```text
domains/auth/
├── README.md
├── business/
├── presets/
├── adapters/
└── react/
```

В корне разрешены:

- документация;
- ownership metadata;
- декларативный manifest или декларативная конфигурация архитектурной проверки;
- обязательный модуль `business`;
- обязательная непустая Group `presets`;
- непустая Group `adapters`, если фабрика имеет технические зависимости;
- Framework Groups при наличии соответствующих модулей.

В корне запрещены:

- `index.ts` или другой агрегирующий executable entry point;
- runtime-файлы и side effects;
- изменяемое состояние и ресурсы lifecycle;
- реэкспорт API внутренних модулей;
- page-specific компоненты или сборка нескольких доменов.

Metadata содержит только статические данные, не исполняется приложением, build tooling или проверяющим инструментом и не становится скрытым API пакета.

## Модули и Groups

`business` размещается непосредственно в пакете и предоставляет три публичных фасета: type-only barrel, `factory` и `error`. Presets размещаются в обязательной Group `presets`. Все production adapters являются самостоятельными модулями Group `adapters` и не определяются в других частях production-графа. Framework Group называется по фреймворку: `react`, `vue` и аналогично.

```text
auth/
├── business/                  # SLM-модуль
│   ├── index.ts              # Только public types
│   ├── factory.ts            # Public factory entry
│   └── error.ts              # Public error runtime entry
├── adapters/                 # Group при наличии technical dependencies
│   └── phone-http/           # SLM-модуль
├── presets/                  # Обязательная Group
│   └── browser/              # SLM-модуль
└── react/                    # Framework Group
    ├── session/              # SLM-модуль
    └── login-form/           # SLM-модуль
```

Groups не имеют `index.ts`. Поэтому публичными путями являются `auth/business`, `auth/business/factory`, `auth/business/error`, `auth/adapters/phone-http`, `auth/presets/browser` и `auth/react/session`, но не `auth`, `auth/adapters`, `auth/presets` или `auth/react`.

## Навигационные Groups

Слой `domains` может содержать навигационные Groups с пакетами:

```text
domains/
└── commerce/                 # Навигационная Group
    ├── catalog/              # Доменный пакет
    └── orders/               # Доменный пакет
```

Такая Group отличается от Group внутри пакета только допустимым составом: она содержит доменные пакеты и другие navigation Groups, а не модули.

## Границы соседних слоёв

| Ответственность | Владелец |
|---|---|
| Предметные сценарии, `DomainApi`, доменные ошибки | `business` |
| Техническая реализация зависимости одного домена | Adapter внутри пакета |
| Универсальный технический сервис | `infra` |
| Domain-specific framework API | Модуль внутри `react`, `vue` и аналогичной Group |
| Страница, маршрут, redirect, продуктовый текст | `compositions` |
| UI, объединяющий несколько доменов | `compositions` |

Зависимость от React сама по себе не доказывает принадлежность пакету. Решающим остаётся владелец ответственности.
