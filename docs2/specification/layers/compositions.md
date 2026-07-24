---
title: Слой Compositions
status: draft
normative: true
---

# Слой Compositions

`compositions` собирает application flows из готовых domain runtimes, infra capabilities, UI modules и других composition modules.

## Ответственность

Composition может быть:

- page;
- route composition entry;
- layout;
- screen;
- widget;
- provider composition;
- multi-domain hook;
- non-visual graph owner.

Структура слоя свободна и должна отражать продуктовую навигацию приложения.

```text
compositions/
├── pages/
├── layouts/
├── screens/
├── widgets/
└── providers/
```

Эти папки являются groups, а не отдельными слоями.

## Cross-domain graph

**SLM-CMP-001 - ОБЯЗАН.** Runtime graph нескольких domains должен собираться в composition, которая владеет его scope.

```ts
const auth = createAuthRuntime()
const user = createUserRuntime({ auth: auth.session })
const orders = createOrdersRuntime({ user: user.agreements })
```

**SLM-CMP-002 - ОБЯЗАН.** Composition должна создавать domain runtimes в явном ацикличном порядке.

**SLM-CMP-003 - ОБЯЗАН.** Cross-domain dependency должна передаваться как готовая минимальная capability, а не разрешаться service locator или domain import.

**SLM-CMP-004 - ЗАПРЕЩЕНО.** Composition не может повторять adapter wiring, если domain public assembly уже создаёт готовый runtime.

**SLM-CMP-005 - ЗАПРЕЩЕНО.** Composition не должна импортировать private business services, domain adapters, SDK-specific domain integration или внутренний Context domain.

**SLM-CMP-013 - ОБЯЗАН.** Composition должна использовать public client/server creator domain, если domain предоставляет runtime-specific assembly.

**SLM-CMP-014 - МОЖЕТ.** Composition может вызвать public business factory напрямую только для полностью universal domain без concrete adapters и runtime-specific assembly.

## Product UI

**SLM-CMP-006 - ОБЯЗАН.** UI, объединяющий несколько domains, route/page scope или application flow, принадлежит `compositions`.

Примеры:

- header, объединяющий auth, cart и navigation;
- order flow, который требует auth и user agreements;
- page screen;
- route guard с navigation outcome;
- widget, использующий hooks двух domains.

**SLM-CMP-007 - МОЖЕТ.** Composition может использовать domain UI и universal UI, передавать им props, callbacks и slots.

## State

**SLM-CMP-008 - ОБЯЗАН.** Page-local presentation state принадлежит минимальной composition, охватывающей всех его consumers.

Примеры page-local state:

- открытие sidebar;
- активная вкладка;
- route-local wizard step;
- presentation filters;
- состояние раскрытия section.

**SLM-CMP-009 - ЗАПРЕЩЕНО.** Page store не может становиться параллельным владельцем domain model или product cache.

## Imports

**SLM-CMP-010 - МОЖЕТ.** Composition module может импортировать public API других composition modules, domains, infra, ui и shared.

**SLM-CMP-011 - ЗАПРЕЩЕНО.** Runtime-циклы между composition modules запрещены.

**SLM-CMP-012 - ОБЯЗАН.** App-specific graph type должен отражать только реально предоставленные runtimes; `Partial<Graph>` с последующим приведением к полному graph запрещён.

**SLM-CMP-015 - ОБЯЗАН.** Client и server composition entries должны иметь раздельные public entrypoints и environment markers, если composition участвует в обоих runtime graphs.

## Scope

Composition может владеть application, route, page, request или test scope. Выбор scope должен следовать правилам [runtime и lifecycle](../runtime-and-lifecycle.md).
