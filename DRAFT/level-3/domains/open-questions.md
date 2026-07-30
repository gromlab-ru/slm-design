# Открытые вопросы Domains

> Эти вопросы намеренно не сформулированы как правила.

## Ошибки

### OPEN-N001: Throw или typed Result

Нужно решить, остаются ли ожидаемые domain failures исключениями с public runtime guard или business API возвращает discriminated `Result<T, DomainError>`.

Текущий совместимый вариант: throw + `isDomainError`. Typed Result потребует изменения формы всех scenario methods.

### OPEN-N002: Универсальный или domain-specific error guard

Нужно определить, достаточно ли общего `isDomainError`, либо каждый business-модуль экспортирует `isAuthError`, `isUserError` и собственную проверку code set.

## Domain structure

### OPEN-N003: Имена framework modules

Варианты:

```text
domains/auth/framework/react
domains/auth/bindings/react
domains/auth/react
```

`framework/react` явно классифицирует роль, `react` сокращает import path, а `bindings/react` подчёркивает adapter-like назначение границы. Выбор пока не сделан.

### OPEN-N004: Нужен ли root Domain entrypoint

Статус: предварительно закрыт в пользу нескольких entrypoints.

Каждый public module Domain предоставляет собственную точку входа: business, конкретный preset, framework binding и promoted adapter. Обязательный root runtime barrel не создаётся, потому что он может смешать isomorphic, client-only и server-only graphs.

### OPEN-N005: Public adapters

Текущая гипотеза: adapter начинается как private segment минимального владельца, обычно preset module. При появлении самостоятельной ответственности или нескольких assembly consumers он может быть поднят в отдельный adapter module с собственным entrypoint.

Открытым остаётся точный promotion criterion; фиксированная числовая граница пока не выбрана.

## Factory и ports

### OPEN-N006: Гранулярность одной factory

Одна factory может возвращать большой API, хотя конкретному SSR scope нужны два метода. Нужно проверить, достаточно ли narrowed preset view, или крупные contracts требуют нескольких business modules/factories.

Предварительный принцип: одна factory на один связный business API contract; разные environments сами по себе не создают новую factory.

### OPEN-N007: Reactive state contract

Нужно проверить на реальном Zustand/React/SSR кейсе форму framework-neutral state port:

- `getSnapshot` + `subscribe`;
- commands/selectors;
- initial server snapshot;
- hydration;
- cleanup;
- concurrent rendering.

## Framework boundary

### OPEN-N008: Domain-specific UI

Нужно решить, какие auth components принадлежат выбранному Auth framework binding module, а какие остаются composition widgets/screens.

Framework dependency сама по себе не доказывает Domain ownership.

## Cross-domain dependencies

### OPEN-N009: Прямой импорт pure functions другого Domain

Нужно определить, может ли business одного Domain напрямую импортировать pure function другого Domain или cross-domain связь всегда должна проходить через `Deps`.

Возможный компромисс:

- type-only contracts разрешены;
- runtime API передаётся через ports;
- pure function import разрешён только как явно зафиксированная ацикличная Domain dependency.

## Уровни архитектуры

### OPEN-N010: На каком уровне появляется Domain

Статус: предварительно закрыт в пользу трёх уровней. Более высокий уровень добавляет требования и может потребовать структурного рефакторинга без изменения предметного владельца.

Текущая шкала:

```text
Level 1: базовые слои и модули
Level 2: доменные модули без строгой внутренней формы
Level 3: business, factories, ports, adapters, presets и verification внутри Domain
```

## Проверяемость

### OPEN-N011: Architecture lint

Будущие проверки могут контролировать:

- запрещённые imports из `business/**`;
- отсутствие server-only graph в isomorphic entrypoint;
- отсутствие client framework в factory graph;
- разрешённые категории exports business public API;
- запрет `export *` на environment boundaries;
- cycles между Domain modules;
- preset lifecycle declarations.

Семантическую чистоту функции нельзя надёжно доказать только по имени export. Для этого потребуется сочетание folder conventions, import restrictions, AST checks и public API tests.
