---
title: Основные инварианты
status: draft
normative: true
---

# Основные инварианты

SLM Design организует frontend-приложение по владельцам ответственности. Архитектурная единица определяется не типом файла, а тем, кто владеет моделью, поведением, данными, runtime и lifecycle.

## Ответственность до размещения

**SLM-FND-001 - ОБЯЗАН.** Перед размещением кода необходимо определить его владельца, public API, runtime-зависимости и lifecycle scope.

**SLM-FND-002 - СЛЕДУЕТ.** Код следует размещать в минимальном scope, который полностью владеет его ответственностью.

**SLM-FND-003 - ЗАПРЕЩЕНО.** Нельзя переносить код в общий слой или общий package только на основании предполагаемого будущего переиспользования.

## Путь продуктовых данных

Внешний сервис может оставаться физическим источником данных. Domain business является единственным публичным шлюзом доменной истины внутри приложения. Точные требования определены правилами [SLM-DATA-001 - SLM-DATA-003](./state-and-data.md#domain-gateway) и [SLM-BUS-017 - SLM-BUS-020](./layers/domains/business.md#normalization-и-errors).

## Явные зависимости

**SLM-FND-007 - ОБЯЗАН.** Runtime-возможности должны поступать владельцу поведения через явные contracts, а не через скрытые imports, service locator или global mutable state.

**SLM-FND-008 - ЗАПРЕЩЕНО.** Type cast, barrel, alias, dynamic import или helper в `shared` не могут использоваться для обхода архитектурной границы.

## Public API

Межмодульное взаимодействие и deep imports регулируются [SLM-API-001 - SLM-API-005](./public-api-and-imports.md#общие-правила).

## Scope и lifecycle

Создание, scope, activation и cleanup runtime определены в [Runtime и lifecycle](./runtime-and-lifecycle.md).

## Композиция доменов

Cross-domain runtime graph регулируется [SLM-CMP-001 - SLM-CMP-005](./layers/compositions.md#cross-domain-graph) и [Cross-domain boundary](./layers/domains/cross-domain-boundary.md).
