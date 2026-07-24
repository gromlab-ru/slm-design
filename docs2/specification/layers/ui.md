---
title: Слой UI
status: draft
normative: true
---

# Слой UI

`ui` содержит reusable presentation modules без product scenario и domain ownership.

## Примеры

```text
ui/
├── button/
├── input/
├── icon/
├── modal/
├── carousel/
├── tabs/
└── tooltip/
```

## Правила

**SLM-UI-001 - ОБЯЗАН.** UI module должен быть применим без знания конкретного product domain.

**SLM-UI-002 - ЗАПРЕЩЕНО.** UI module не может импортировать `domains`, `compositions`, `app` или product-specific infra.

**SLM-UI-003 - МОЖЕТ.** UI module может импортировать public API других UI modules и `shared`.

**SLM-UI-004 - ЗАПРЕЩЕНО.** UI module не выбирает product data source, не вызывает domain scenario и не владеет cross-domain behavior.

**SLM-UI-005 - МОЖЕТ.** UI module может владеть локальным interaction state, необходимым только для собственной presentation mechanics.

**SLM-UI-006 - ОБЯЗАН.** Компонент с product semantics должен принадлежать framework surface domain или composition, а не `ui`.

## Классификация

| Сущность | Владелец |
|---|---|
| `Button`, `Input`, `Modal` | `ui` |
| `LoginForm` одного auth domain | domain framework surface |
| Header с auth и navigation | `compositions` |
| Generic date picker | `ui` |
| Medication schedule | domain или composition согласно используемым domains |

Универсальность определяется отсутствием product knowledge, а не количеством текущих consumers.
