---
title: Основные инварианты
status: draft
normative: true
---

# Основные Инварианты

SLM Design организует frontend-приложение по владельцам ответственности. Архитектурная единица определяется не типом файла, а тем, кто владеет моделью, поведением, данными, runtime и lifecycle.

## Ответственность до размещения

**SLM-FND-001 - ОБЯЗАН.** Перед размещением кода необходимо определить его владельца, public boundary, runtime dependencies и lifecycle scope.

**SLM-FND-002 - СЛЕДУЕТ.** Код следует размещать в минимальном scope, который полностью владеет его ответственностью.

**SLM-FND-003 - ЗАПРЕЩЕНО.** Нельзя переносить код в общий слой или общий package только на основании предполагаемого будущего переиспользования.

## Путь продуктовых данных

Product data проходят через public boundary текущего владельца согласно [SLM-DATA-001](./state-and-data.md#product-gateway). Внешний сервис может оставаться физическим источником данных, но transport contract не становится product model автоматически.

## Явные зависимости

**SLM-FND-007 - ОБЯЗАН.** Runtime capabilities должны поступать владельцу поведения через разрешённые imports, явные arguments или contracts, а не через скрытый service locator или global mutable state.

**SLM-FND-008 - ЗАПРЕЩЕНО.** Type cast, barrel, alias, dynamic import или helper в `shared` не могут использоваться для обхода применимой архитектурной границы.

## Public API

Межмодульное взаимодействие и deep imports регулируются [SLM-API-001 - SLM-API-005](./public-api-and-imports.md#общие-правила).

## Scope и lifecycle

Создание, scope, activation и cleanup применимых runtimes и resources определены в [Runtime и lifecycle](./runtime-and-lifecycle.md).

## Overlays

Base SLM не вводит дополнительные архитектурные слои и специализированные runtime contracts. Каждый overlay самостоятельно определяет свои добавления и замены base-правил.
