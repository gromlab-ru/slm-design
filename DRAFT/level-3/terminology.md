# Терминология Level 3

> Нормативные определения рабочего черновика. Этот раздел не объявляет правила.

Level 3 наследует терминологию Levels 1-2 и заменяет структурную модель доменного модуля Level 2 новой сущностью Domain.

## Domain

### Domain

Немодульная предметная граница слоя `domains`, представляющая одну самостоятельную предметную область. Domain объединяет role modules и Groups этой области, но не содержит собственного runtime-кода, состояния, lifecycle, public API или узла графа зависимостей.

Domain не является module и не является Group. Он может находиться непосредственно в слое `domains` или внутри навигационной Group этого слоя. В этом частном случае Group вправе содержать Domain, но сохраняет все остальные свойства Group Level 1.

Module, расположенный непосредственно внутри Domain или внутри его Group, не является вложенным module: ближайшая внешняя граница Domain не является module.

### Role module

Module внутри Domain, чья ответственность определяется одной технической ролью: `business`, preset, adapter или framework binding. Каждый role module остаётся обычным module Level 1 со своим public API и узлом графа зависимостей.

### Business module

Обязательный module `business` внутри Domain. Он определяет public business scenarios, business contracts, factory, ports, domain errors, детерминированные правила и семантику domain state.

`business` не зависит от concrete runtime, execution environment или framework.

### Port

Минимальный business-owned contract runtime capability, которая нужна business для выполнения scenario. Port описывается языком предметной области и не раскрывает SDK, generated DTO, store, hook, platform object или другой concrete runtime.

### Factory

Функция business module, которая получает полный набор ports и создаёт business API instance. Factory не является assembly и не выбирает concrete implementation ports.

### Adapter

Код, который реализует один или несколько business ports поверх concrete runtime: SDK, storage, platform API, request input, state manager или технического сервиса. Adapter может быть private segment preset module либо самостоятельным promoted adapter module.

### Preset

Module с именованной повторяемой assembly одной business factory для execution context. Preset выбирает implementations ports и сообщает caller, как владеть созданным API instance.

### Framework module

Role module, который существует из-за contract конкретного framework. Такой module размещается непосредственно в Domain и называется именем framework: `react`, `vue` и аналогично. Он получает готовый business API, но не собирает factory и не реализует concrete adapter.

### Assembly site

Место, которое вызывает business factory, передаёт полный набор ports и получает API instance. Reusable assembly оформляется preset module; одноразовая assembly принадлежит явному composition graph owner. Framework module не является assembly site.

### Graph owner

Код, который удерживает конкретный runtime graph и API instances в execution scope и вызывает предоставленные start/cleanup operations. Graph owner не заменяет module-владельца lifecycle resource; contract создания, области жизни, числа instances и cleanup определяет module по правилам Level 1. Graph owner может быть application, route, page, request или test scope.

### Environment boundary

Граница между client-only, server-only и isomorphic import graphs. Она определяется достижимостью import graph, а не названием папки или надеждой на tree shaking.

## Виды владения

Level 3 различает три вопроса, которые в обычной речи могут называться владением:

| Вопрос | Ответственный |
|---|---|
| Какая предметная область и словарь объединяют код | Domain |
| Кто владеет самостоятельной ответственностью и public API | Конкретный module |
| Кто удерживает API instance в execution scope и вызывает lifecycle operations | Graph owner |

Например, `business` владеет моделью `AuthState` и её допустимыми переходами. Adapter владеет concrete state runtime и его lifecycle contract. Graph owner удерживает конкретный `AuthApi` instance в допустимом scope и вызывает его cleanup.

## Структурная модель

```text
SLM root
└── domains
    └── Domain
        ├── business module
        ├── presets Group
        │   └── preset module
        ├── adapters Group
        │   └── adapter module
        └── react framework module
```

`presets` и `adapters` являются Groups только при наличии соответствующих modules. `errors`, `ports`, `services`, `types`, `hooks` и `providers` являются segments своих module-владельцев, если сами не образуют отдельный module.
