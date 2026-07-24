---
title: Ports и adapters domain
status: draft
normative: true
---

# Ports и Adapters

Port определяет потребность business. Adapter связывает эту потребность с concrete runtime.

## Ownership

```text
domain/
├── business/
│   └── ports/
└── adapters/
```

**SLM-ADP-001 - ОБЯЗАН.** Port должен принадлежать `business` того domain, который потребляет capability.

**SLM-ADP-002 - ОБЯЗАН.** Concrete adapter должен принадлежать тому же domain, но находиться вне `business`.

**SLM-ADP-003 - ЗАПРЕЩЕНО.** Infra или external SDK не могут объявлять business port от имени domain.

## Adapter contract

**SLM-ADP-004 - МОЖЕТ.** Adapter может выполнять только следующие integration responsibilities:

- импортировать type-only business port и domain input types;
- импортировать public infra API, SDK или platform runtime;
- переводить domain arguments в transport arguments;
- возвращать raw/unknown source result для business normalization;
- подписываться на concrete event source через явный lifecycle contract.

**SLM-ADP-005 - ЗАПРЕЩЕНО.** Adapter не может выполнять следующие domain/framework responsibilities:

- создавать domain error;
- выбирать domain fallback;
- реализовывать business rule;
- объявлять domain model;
- экспортировать concrete client consumer-коду;
- вызывать framework hook;
- обращаться к другому domain runtime.

**SLM-ADP-006 - ОБЯЗАН.** Adapter должен реализовывать ровно тот port contract, который необходим business.

**SLM-ADP-007 - ЗАПРЕЩЕНО.** Нельзя передавать полный client, если port требует ограниченный набор capabilities.

**SLM-ADP-008 - ЗАПРЕЩЕНО.** Adapter integration logic не должна писаться inline в composition или runtime assembly.

## Client и server adapters

Adapters могут быть разделены по runtime:

```text
adapters/
├── client/
│   ├── browser-session.adapter.ts
│   └── websocket-orders.adapter.ts
└── server/
    ├── request-session.adapter.ts
    └── server-orders-api.adapter.ts
```

**SLM-ADP-009 - ОБЯЗАН.** Client adapter не должен попадать в server graph, а server adapter - в client graph.

**SLM-ADP-010 - ОБЯЗАН.** Runtime-specific adapter должен иметь явный environment marker, если framework предоставляет такой механизм.

## Event sources

Socket, subscription и event listener реализуют event port:

```ts
export type OrdersEventsPort = {
  subscribe: (listener: (event: unknown) => void) => () => void
}
```

**SLM-ADP-011 - ОБЯЗАН.** Event adapter должен возвращать cleanup и не открывать connection при module import.

**SLM-ADP-012 - ОБЯЗАН.** Wire event проходит business normalization до изменения domain state или передачи consumer-коду.

## Public boundary

**SLM-ADP-013 - ЗАПРЕЩЕНО.** `adapters` не имеет внешнего public API для app, compositions или других domains.

Adapters доступны только assembly собственного domain и собственным contract tests.
