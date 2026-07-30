# Domains: рабочие заметки

> Статус: исследовательский черновик. Материалы в этой папке не являются спецификацией и пока не задают обязательных правил SLM.

Эта папка фиксирует текущую гипотезу о новой сущности `Domain`, business-модуле внутри неё, framework-neutral factory, ports, adapters, presets и framework bindings.

Идентификаторы вида `DOM-N001` и `FAC-N001` являются стабильными якорями заметок. Они нужны для обсуждения и последующего переноса решений в спецификацию, но не являются идентификаторами нормативных правил.

## Основная формула

```text
Business определяет ЧТО делать.
Ports описывают ЧТО business нужно.
Factory создаёт business API из ports.
Adapters реализуют ports в конкретной среде.
Preset выбирает adapters, scope и lifecycle.
Framework binding подключает готовый API к React, Vue, Next.js и другим фреймворкам.
```

Краткая схема:

```text
                         ┌─ browser preset
                         ├─ SSR request preset
Business factory + ports ├─ server action preset
                         ├─ per-test assembly
                         └─ другой application preset

готовый business API instance
  ├─ framework bindings
  ├─ compositions
  └─ другие business factories через ports
```

## Зафиксированные гипотезы

### DOM-N001: Domain является отдельной архитектурной сущностью

Domain является границей владения одной предметной областью. Он содержит modules и logical groups с разной технической ролью, но общей доменной принадлежностью.

### DOM-N002: Business внутри Domain является модулем

`business` имеет собственную ответственность и public API, поэтому это module, а не segment. `types/`, `services/`, `errors/` и `lib/` внутри business остаются segments.

### FAC-N001: Один business-контракт имеет одну factory

Разные среды выполнения не требуют разных factories, если они предоставляют один и тот же API. Различия среды выражаются ports, adapters и presets.

### PRE-N001: Одна factory допускает несколько presets

Browser, SSR, server action, tests и другие контексты могут собирать одну factory с разными реализациями ports.

### FAC-N002: Business и factory нейтральны к framework и environment

Изоморфный business import graph не достигает React, Vue, Next.js, browser-only, server-only, SDK, storage implementations и других concrete runtimes.

### PRE-N002: Среда является свойством preset

Client/server/request различия определяются preset и выбранными adapters, а не `mode` внутри factory. Tests создают отдельную per-test assembly напрямую через factory и не требуют общего test preset.

## Карта заметок

- [Domain](./domain.md) - роль новой сущности, структура и публичные границы.
- [Business](./business.md) - ответственность business-модуля, types, pure functions и errors.
- [Factory, ports и adapters](./factory-ports-adapters.md) - контракт factory и требования изоморфности.
- [Presets и SSR](./presets.md) - варианты сборки, lifecycle и защита server-only кода.
- [Framework bindings](./framework-bindings.md) - React/Vue/Next-код внутри Domain.
- [Тестирование](./testing.md) - границы тестов, factory-level contract, harness, adapters, presets, framework и UI.
- [Auth как проверочный пример](./auth-example.md) - применение гипотез к реальному модулю.
- [Открытые вопросы](./open-questions.md) - решения, которые ещё нельзя превращать в правила.

## Предварительная структура приложения

```text
src/
├── app/
├── compositions/
├── domains/
├── infra/
├── ui/
└── shared/
```

`domains/` пока рассматривается как новая верхнеуровневая область, заменяющая разнесение одной доменной ответственности между `business/{domain}` и `compositions/business/{domain}`.
