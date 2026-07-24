---
title: Архитектурная модель
status: draft
normative: true
---

# Архитектурная модель

## Структура приложения

**SLM-ARCH-001 - ОБЯЗАН.** SLM-приложение должно разделять код по ответственности между следующими слоями:

```text
src/
├── app/
├── compositions/
├── domains/
├── infra/
├── ui/
└── shared/
```

Не каждый слой обязан содержать код в минимальном приложении, но роль каждого существующего модуля должна соответствовать одному владельцу.

## Группы ответственности

| Группа | Слои | Ответственность |
|---|---|---|
| Framework composition | `app`, `compositions` | Подключение к framework и сборка application flows |
| Product | `domains` | Продуктовые модели, сценарии и runtime surfaces |
| Technical | `infra`, `ui` | Технические capabilities и универсальный UI |
| Foundation | `shared` | Детерминированный общий фундамент |

## Верхнеуровневое направление

```text
app → compositions | shared
compositions → compositions | domains | infra | ui | shared
domains → infra | ui | shared согласно правилам внутренних зон
infra → infra | shared
ui → ui | shared
shared -/→ остальные SLM-слои
```

Схема описывает imports между SLM-слоями проекта. Framework APIs и external packages регулируются ответственностью импортирующего слоя и не показаны как SLM-слои.

**SLM-ARCH-002 - ОБЯЗАН.** Верхнеуровневое направление зависимостей между SLM-слоями должно соблюдаться для runtime imports и type imports, кроме явно описанных исключений.

**SLM-ARCH-003 - ЗАПРЕЩЕНО.** Нижний слой не может импортировать `app` или `compositions`.

**SLM-ARCH-004 - ЗАПРЕЩЕНО.** `infra`, `ui` и `shared` не могут владеть product graph или выступать service locator для domain runtimes.

## Путь данных

```text
app
  → composition
  → domain runtime surface
  → domain business scenario
  → business-owned port
  → domain adapter
  → infra / SDK / storage / external source
```

**SLM-ARCH-005 - ОБЯЗАН.** Каждый переход в цепочке продуктовых данных должен сохранять ownership: framework связывает, domain определяет semantics, adapter интегрирует, infra предоставляет technical capability.

## Путь UI

```text
app route
  → page/layout composition
  → domain UI и composition UI
  → universal UI
  → shared styles/resources
```

Владение multi-domain и domain UI определяется правилами [SLM-CMP-006 - SLM-CMP-007](./layers/compositions.md#product-ui) и [SLM-FRM-013](./layers/domains/framework.md#domain-ui).

## Внутренняя модель domain

```text
domain client/server assembly
  → own business factory
  → own adapters

domain framework surface
  → own DomainRuntime через runtime access boundary

composition
  → создаёт несколько domain runtimes
  → передаёт готовые capabilities
```

Внутренняя assembly одного domain и cross-domain graph разделены правилами [Client и server assembly](./layers/domains/client-and-server.md) и [Compositions](./layers/compositions.md).
