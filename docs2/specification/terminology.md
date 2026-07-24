---
title: Терминология
status: draft
normative: true
---

# Терминология

## Слой

**Layer** - верхнеуровневая зона `src`, определяющая вид ответственности и допустимые направления зависимостей.

SLM использует слои `app`, `compositions`, `domains`, `infra`, `ui` и `shared`.

## Модуль

**Module** - минимальный самостоятельный владелец ответственности с public boundary. Модуль может содержать код разных технических типов, если весь этот код принадлежит одной ответственности.

## Группа

**Group** - навигационная папка, классифицирующая модули или другие группы. Группа не является модулем, не имеет public API и не владеет runtime.

## Домен

**Domain** - конечный продуктовый модуль в слое `domains`, владеющий одной предметной ответственностью и всеми её runtime surfaces.

Допустимые пути:

```text
domains/{domain}
domains/{group...}/{domain}
```

## Группа доменов

**Domain group** - группа внутри `domains`, используемая только для навигации. Например, `knv` в пути `domains/knv/auth` является группой, если не имеет собственного public API, состояния и assembly.

## Зона домена

**Domain zone** - внутренняя архитектурная часть domain с отдельным направлением зависимостей. Базовые зоны: `business`, `react`, `adapters`, `client`, `server`.

Зона не является самостоятельным domain.

## Business

**Business** - framework-neutral зона domain, владеющая моделью, правилами, ports, сценариями, состоянием, нормализацией и domain errors. Business создаёт public logic runtime через factory.

## Factory

**Factory** - side-effect-free constructor, принимающий явные dependencies и возвращающий public business runtime API.

## DomainRuntime

**DomainRuntime** - созданный factory экземпляр доменного поведения. Он предоставляет commands, queries, snapshots, subscriptions и lifecycle operations, необходимые конкретному domain.

Factory создаёт DomainRuntime. DomainRuntime является публичным шлюзом к данным и поведению domain.

## Port

**Port** - business-owned contract внешней capability, необходимой domain. Port описывается языком domain и не раскрывает concrete SDK, transport или framework runtime.

## Adapter

**Adapter** - concrete реализация port поверх infra, SDK, storage, platform API, framework runtime или другого внешнего механизма.

Готовая capability одного DomainRuntime, структурно удовлетворяющая port другого domain, является cross-domain runtime dependency, а не concrete adapter автоматически. Wrapper adapter требуется только при реальном преобразовании contracts.

## Framework surface

**Framework surface** - API domain для конкретного UI/framework runtime. Для React он может включать runtime access boundary, hooks, Providers и domain UI.

Framework surface не является параллельным business API и не обращается к external source в обход DomainRuntime.

## Assembly

**Assembly** - связывание factory с concrete adapters и runtime-specific input для создания готового runtime одного domain.

## Composition

**Composition** - модуль, связывающий готовые modules и domain runtimes в page, route, layout, screen, widget или другой application flow.

## Graph owner

**Graph owner** - composition, request setup или test setup, которое выбирает набор runtime instances, порядок их создания, lifecycle scope и cleanup.

## Domain runtime Provider

**Domain runtime Provider** - часть framework surface, передающая готовый runtime instance framework consumers одного domain. Она не является владельцем cross-domain graph автоматически.

## Provider composition

**Provider composition** - composition module, создающий или получающий несколько runtimes и монтирующий их framework boundaries в выбранном scope.

## Segment

**Segment** - внутренняя папка модуля, группирующая файлы по роли, например `hooks`, `services`, `types`, `styles` или `lib`.

Domain zones не являются обычными segments.

## Компонент

**Component** - presentation unit внутри владеющего module. Компонент не является самостоятельным архитектурным owner и не выбирает источники данных или runtime dependencies.

## Продуктовые данные

**Product data** - данные, состояние и outcomes, имеющие смысл в предметной области продукта. Transport DTO, raw SDK response и browser storage schema не являются доменной моделью автоматически.

## Runtime dependency

**Runtime dependency** - dependency, необходимая выполняемому коду: API другого объекта, external source, store, query runtime, event source, clock, environment или platform capability.

`import type` не создаёт runtime dependency, но может создавать статическую связанность contracts.
