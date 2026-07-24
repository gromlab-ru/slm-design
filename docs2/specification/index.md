---
title: SLM Design Specification
version: 0.1.0-draft
status: draft
normative: true
---

# SLM Design Specification

Эта директория содержит единый нормативный корпус SLM Design 2.0. Спецификация разделена на главы, но имеет общую версию, общий статус и единый приоритет правил.

Пока статус равен `draft`, документы описывают проектируемую архитектуру и не заменяют действующую документацию в `docs/`.

## Нормативный язык

| Термин | Значение |
|---|---|
| `ОБЯЗАН` | Требование необходимо выполнить для соответствия спецификации |
| `ЗАПРЕЩЕНО` | Действие является нарушением спецификации |
| `СЛЕДУЕТ` | Рекомендуемое решение; отступление требует явного обоснования |
| `МОЖЕТ` | Допустимый, но необязательный вариант |

Правила имеют стабильные идентификаторы вида `SLM-AREA-NNN`. Точное нормативное требование принадлежит только той главе, где объявлен его rule ID. Обзорная глава может ссылаться на правило, но не должна объявлять его повторно под новым ID.

## Приоритет

**SLM-DOC-001 - ОБЯЗАН.** При конфликте между главами спецификации и любым ненормативным материалом приоритет имеет спецификация.

**SLM-DOC-002 - ЗАПРЕЩЕНО.** Ненормативный документ не может вводить новое обязательное правило, исключение или архитектурную границу.

**SLM-DOC-003 - ОБЯЗАН.** Изменение принятого архитектурного правила должно вноситься в главу, которая владеет соответствующим rule ID.

## Главы

### Основы

- [Основные инварианты](./foundations.md)
- [Терминология](./terminology.md)
- [Архитектурная модель](./architecture-model.md)

### Слои

- [Обзор слоёв](./layers/index.md)
- [App](./layers/app.md)
- [Compositions](./layers/compositions.md)
- [Domains](./layers/domains/index.md)
- [Infra](./layers/infra.md)
- [UI](./layers/ui.md)
- [Shared](./layers/shared.md)

### Внутренняя модель Domains

- [Business](./layers/domains/business.md)
- [Framework surface](./layers/domains/framework.md)
- [Ports и adapters](./layers/domains/ports-and-adapters.md)
- [Client и server assembly](./layers/domains/client-and-server.md)
- [Cross-domain boundary](./layers/domains/cross-domain-boundary.md)

### Общие правила

- [Модули и группы](./modules-and-groups.md)
- [Сегменты](./segments.md)
- [Public API и импорты](./public-api-and-imports.md)
- [State и data](./state-and-data.md)
- [Runtime и lifecycle](./runtime-and-lifecycle.md)
- [Тестирование и соответствие](./testing-and-conformance.md)
- [Монорепозитории](./monorepo.md)

## Область текущего draft

Спецификация фиксирует уже согласованные границы слоёв, доменов, business-фабрик, adapters, runtime assembly и cross-domain composition.

Точная форма React Providers, окончательная политика package extraction для domains и единая модель query cache не фиксируются сверх явно объявленных в соответствующих главах инвариантов.
