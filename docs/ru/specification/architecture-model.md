---
title: Архитектурная модель
status: draft
normative: true
---

# Архитектурная Модель

## Структура приложения

```text
src/
├── app/
├── compositions/
├── infra/
├── ui/
└── shared/
```

**SLM-BASE-ARCH-001 - ОБЯЗАН.** Base SLM-приложение должно разделять код по ответственности между слоями `app`, `compositions`, `infra`, `ui` и `shared`.

Не каждый слой обязан содержать код в минимальном приложении. Пустые папки и speculative scaffolding не требуются.

## Группы ответственности

| Группа | Слои | Ответственность |
|---|---|---|
| Framework composition | `app`, `compositions` | Подключение к framework и сборка application flows |
| Product | Product owner; в base SLM - `compositions` | Product semantics, UI и flows владеющего module |
| Technical | `infra`, `ui` | Technical capabilities и универсальный UI |
| Foundation | `shared` | Детерминированный общий фундамент |

## Верхнеуровневое направление

```text
app -> compositions | shared
compositions -> compositions | infra | ui | shared
infra -> infra | shared
ui -> ui | shared
shared -/-> остальные SLM-слои
```

Framework APIs и external packages регулируются ответственностью импортирующего слоя и не показаны как SLM-слои.

**SLM-BASE-ARCH-002 - ОБЯЗАН.** Верхнеуровневое направление зависимостей между base SLM-слоями должно соблюдаться для runtime imports и type imports, кроме явно описанных исключений.

**SLM-BASE-ARCH-003 - ЗАПРЕЩЕНО.** Нижний слой не может импортировать `app` или `compositions`.

**SLM-BASE-ARCH-004 - ЗАПРЕЩЕНО.** `infra`, `ui` и `shared` не могут владеть product wiring или выступать service locator для application modules.

## Путь данных

```text
app
  -> product owner public API
  -> infra public API
  -> external source
```

**SLM-BASE-ARCH-005 - ОБЯЗАН.** Каждый переход product data должен сохранять ownership: framework связывает, product owner определяет semantics, а technical capability не присваивает себе product model.

## Путь UI

```text
app route
  -> page/layout composition
  -> product UI
  -> universal UI
  -> shared styles/resources
```

Product UI принадлежит product owner; в base SLM таким owner является composition. Универсальный product-agnostic UI принадлежит `ui`.
