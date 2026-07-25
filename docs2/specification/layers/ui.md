---
title: Слой UI
status: draft
normative: true
---

# Слой UI

`ui` содержит reusable presentation modules без product scenario и product ownership.

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

**SLM-UI-001 - ОБЯЗАН.** UI module должен быть применим без product-specific knowledge.

**SLM-UI-002 - ЗАПРЕЩЕНО.** UI module не может импортировать `compositions`, `app` или product-specific infra.

**SLM-UI-003 - МОЖЕТ.** UI module может импортировать public API других UI modules и `shared`.

**SLM-UI-004 - ЗАПРЕЩЕНО.** UI module не выбирает product data source, не вызывает product scenario и не владеет multi-module behavior.

**SLM-UI-005 - МОЖЕТ.** UI module может владеть локальным interaction state, необходимым только для собственной presentation mechanics.

**SLM-UI-006 - ОБЯЗАН.** Компонент с product semantics должен принадлежать владеющему product module, а не `ui`.

## Классификация

| Сущность | Владелец |
|---|---|
| `Button`, `Input`, `Modal` | `ui` |
| `LoginForm` одной auth responsibility | Владеющий product module |
| Application header | `compositions` |
| Generic date picker | `ui` |
| Medication schedule | Владеющий product module согласно ownership |

Универсальность определяется отсутствием product knowledge, а не количеством текущих consumers.
