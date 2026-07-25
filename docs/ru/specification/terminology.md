---
title: Терминология
status: draft
normative: true
---

# Терминология

## Base SLM

**Base SLM** - самостоятельная минимальная архитектура, применяемая без дополнительного overlay.

## Overlay

**Overlay** - независимое опциональное нормативное расширение, применяемое непосредственно поверх base SLM. Overlay не наследует правила другого overlay.

## Слой

**Layer** - верхнеуровневая зона `src`, определяющая вид ответственности и допустимые направления зависимостей.

Base SLM использует слои `app`, `compositions`, `infra`, `ui` и `shared`.

## Модуль

**Module** - минимальный самостоятельный владелец ответственности с public boundary. Модуль может содержать код разных технических типов, если весь этот код принадлежит одной ответственности.

## Product owner

**Product owner** - module, владеющий product semantics, model, behavior, data boundary и public API одной ответственности.

## Группа

**Group** - навигационная папка, классифицирующая модули или другие группы. Группа не является модулем, не имеет public API и не владеет runtime.

## Composition

**Composition** - product module, связывающий public APIs и technical capabilities в page, route, layout, screen, widget или другой application flow.

## Scope owner

**Scope owner** - composition, request setup, provider setup или test setup, которое выбирает runtime instances и resources, их lifetime, activation и cleanup.

## Segment

**Segment** - внутренняя папка модуля, группирующая файлы по роли, например `hooks`, `services`, `types`, `styles` или `lib`.

## Компонент

**Component** - presentation unit внутри владеющего module. Компонент не является самостоятельным архитектурным owner и не выбирает application dependencies самостоятельно.

## Продуктовые данные

**Product data** - данные, состояние и outcomes, имеющие смысл в предметной области продукта. Transport DTO, raw SDK response и browser storage schema не являются product model автоматически.

## Runtime dependency

**Runtime dependency** - dependency, необходимая выполняемому коду: API другого объекта, external source, store, query runtime, event source, clock, environment или platform capability.

`import type` не создаёт runtime dependency, но может создавать статическую связанность contracts.

Термины, вводимые `SLM Advanced` или `SLM Pro`, определяются и имеют нормативную силу только внутри соответствующего overlay.
