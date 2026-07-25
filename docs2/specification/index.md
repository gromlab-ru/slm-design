---
title: SLM Design Specification
version: 0.1.0-draft
status: draft
normative: true
---

# SLM Design Specification

Эта директория содержит единый нормативный корпус SLM Design 2.0. Base SLM является законченной минимальной архитектурой; дополнительные ограничения подключаются независимыми overlays `SLM Advanced` или `SLM Pro`.

Пока статус равен `draft`, документы описывают проектируемую архитектуру и не заменяют действующую документацию в `docs/`.

## Нормативный язык

| Термин | Значение |
|---|---|
| `ОБЯЗАН` | Требование необходимо выполнить для соответствия спецификации |
| `ЗАПРЕЩЕНО` | Действие является нарушением спецификации |
| `СЛЕДУЕТ` | Рекомендуемое решение; отступление требует явного обоснования |
| `МОЖЕТ` | Допустимый, но необязательный вариант |

Правила имеют стабильные идентификаторы. Base использует формат `SLM-AREA-NNN`, Advanced - `SLM-ADV-AREA-NNN`, Pro - `SLM-PRO-AREA-NNN`. Точное нормативное требование принадлежит только той главе, где объявлен его rule ID.

## Architecture modes

Base SLM не требует overlay. Если команда выбирает дополнительную архитектурную политику, она подключает ровно один независимый mode согласно [Архитектурным modes](./architecture-modes.md):

```text
SLM Advanced = SLM + Advanced rules
SLM Pro      = SLM + Pro rules
```

## Приоритет

**SLM-DOC-001 - ОБЯЗАН.** При конфликте между главами спецификации и любым ненормативным материалом приоритет имеет спецификация.

**SLM-DOC-002 - ЗАПРЕЩЕНО.** Ненормативный документ не может вводить новое обязательное правило, исключение или архитектурную границу.

**SLM-DOC-003 - ОБЯЗАН.** Изменение принятого архитектурного правила должно вноситься в главу, которая владеет соответствующим rule ID.

## Base SLM

### Основы

- [Основные инварианты](./foundations.md)
- [Терминология](./terminology.md)
- [Архитектурная модель](./architecture-model.md)

### Слои

- [Обзор слоёв](./layers/index.md)
- [App](./layers/app.md)
- [Compositions](./layers/compositions.md)
- [Infra](./layers/infra.md)
- [UI](./layers/ui.md)
- [Shared](./layers/shared.md)

### Общие правила

- [Модули и группы](./modules-and-groups.md)
- [Сегменты](./segments.md)
- [Public API и импорты](./public-api-and-imports.md)
- [State и data](./state-and-data.md)
- [Runtime и lifecycle](./runtime-and-lifecycle.md)
- [Тестирование и соответствие](./testing-and-conformance.md)
- [Монорепозитории](./monorepo.md)

## Overlays

### SLM Advanced

- [Отличия Advanced от base SLM](./modes/advanced/index.md)
- [Domains в SLM Advanced](./modes/advanced/domains.md)

### SLM Pro

- [Отличия Pro от base SLM](./modes/pro/index.md)
- [Domains в SLM Pro](./modes/pro/domains/index.md)
- [Business](./modes/pro/domains/business.md)
- [Framework surface](./modes/pro/domains/framework.md)
- [Ports и adapters](./modes/pro/domains/ports-and-adapters.md)
- [Client и server assembly](./modes/pro/domains/client-and-server.md)
- [Cross-domain boundary](./modes/pro/domains/cross-domain-boundary.md)
- [Тестирование Pro domains](./modes/pro/domains/testing.md)

## Область текущего draft

Base SLM фиксирует ownership, пять основных слоёв, public boundaries, state и lifecycle. Текущие версии Advanced и Pro в первую очередь определяют собственные независимые модели слоя `domains`; будущие mode-specific правила могут относиться к любому разделу архитектуры.

Точная форма React Providers, окончательная политика package extraction и единая модель query cache не фиксируются сверх явно объявленных инвариантов base или выбранного overlay.
