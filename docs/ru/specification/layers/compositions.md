---
title: Слой Compositions
status: draft
normative: true
---

# Слой Compositions

`compositions` собирает application flows из module public APIs, technical capabilities и UI modules и может владеть product logic в пределах своей ответственности.

## Ответственность

Composition может быть:

- page;
- route composition entry;
- layout;
- screen;
- widget;
- provider composition;
- multi-module hook;
- non-visual application wiring owner.

Структура слоя свободна и отражает продуктовую навигацию приложения.

```text
compositions/
├── pages/
├── layouts/
├── screens/
├── widgets/
└── providers/
```

Эти папки являются groups, а не отдельными слоями.

## Product ownership

**SLM-BASE-CMP-001 - ОБЯЗАН.** Product flow и его локальная product logic должны принадлежать минимальной composition, охватывающей всех consumers этой ответственности.

Composition может использовать public API `infra` для external operations, сохраняя product mapping, outcomes и fallback semantics у себя.

## Public boundaries

**SLM-BASE-CMP-005 - ЗАПРЕЩЕНО.** Composition не может импортировать private services, integrations, stores, Context или другие internal paths используемого module.

## Product UI

**SLM-BASE-CMP-006 - ОБЯЗАН.** UI, объединяющий несколько самостоятельных modules, route/page scope либо application flow, принадлежит `compositions`.

Примеры:

- application header;
- order flow, объединяющий несколько product responsibilities;
- page screen;
- route guard с navigation outcome;
- widget, использующий public APIs двух самостоятельных modules.

**SLM-BASE-CMP-007 - МОЖЕТ.** Composition может использовать product UI, опубликованный другими modules, и universal UI, передавая props, callbacks и slots.

## State

**SLM-BASE-CMP-008 - ОБЯЗАН.** Page-local presentation state принадлежит минимальной composition, охватывающей всех его consumers.

Примеры page-local state:

- открытие sidebar;
- активная вкладка;
- route-local wizard step;
- presentation filters;
- состояние раскрытия section.

**SLM-BASE-CMP-009 - ЗАПРЕЩЕНО.** Page store не может становиться параллельным владельцем product model или canonical product cache другого owner.

## Imports

**SLM-BASE-CMP-010 - МОЖЕТ.** Composition module может импортировать public API других composition modules, infra, ui и shared.

Runtime-циклы между composition modules запрещены base-правилом `SLM-BASE-API-016`.

**SLM-BASE-CMP-015 - ОБЯЗАН.** Client и server composition entries должны иметь раздельные public entrypoints и environment markers, если composition участвует в обоих runtime graphs.

## Scope

Composition может владеть application, route, page, request или test scope. Выбор scope должен следовать правилам [runtime и lifecycle](../runtime-and-lifecycle.md).
