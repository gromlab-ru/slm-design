---
title: Ports и adapters в SLM Pro
status: draft
normative: true
overlay: pro
base: slm
---

# Ports и Adapters

> Overlay: `SLM Pro`.

Port определяет потребность business. Adapter связывает эту потребность с concrete runtime.

## Ownership

```text
domain/
├── business/
│   └── ports/
└── adapters/
```

**SLM-PRO-ADP-001 - ОБЯЗАН.** Port должен принадлежать `business` того domain, который потребляет capability.

**SLM-PRO-ADP-002 - ОБЯЗАН.** Concrete adapter должен принадлежать тому же domain, но находиться вне `business`.

**SLM-PRO-ADP-003 - ЗАПРЕЩЕНО.** Infra или external SDK не могут объявлять business port от имени domain.

**SLM-PRO-ADP-014 - ОБЯЗАН.** External technical capability из infra, SDK, storage или platform runtime должна реализовывать business port через adapter собственного domain, а этот adapter должен подключаться assembly того же domain. Готовая capability другого DomainRuntime может удовлетворять consumer-owned port напрямую только по правилу [SLM-PRO-XDOM-013](./cross-domain-boundary.md#runtime-capability-injection).

## Adapter contract

**SLM-PRO-ADP-004 - ОБЯЗАН.** Responsibilities adapter должны ограничиваться применимыми integration operations:

- импортировать type-only business port и domain input types;
- импортировать public infra API, SDK или platform runtime;
- переводить domain arguments в transport arguments;
- возвращать raw/unknown source result для business normalization;
- подписываться на concrete event source через явный lifecycle contract.

**SLM-PRO-ADP-005 - ЗАПРЕЩЕНО.** Adapter не может выполнять следующие domain/framework responsibilities:

- создавать domain error;
- выбирать domain fallback;
- реализовывать business rule;
- объявлять domain model;
- экспортировать concrete client consumer-коду;
- вызывать framework hook;
- runtime-импортировать или самостоятельно разрешать другой domain runtime.

Adapter может работать с минимальной foreign capability, явно переданной composition, только для преобразования contract или lifecycle согласно `SLM-PRO-XDOM-013`.

**SLM-PRO-ADP-006 - ОБЯЗАН.** Adapter должен реализовывать ровно тот port contract, который необходим business.

**SLM-PRO-ADP-007 - ЗАПРЕЩЕНО.** Нельзя передавать полный client, если port требует ограниченный набор capabilities.

**SLM-PRO-ADP-008 - ЗАПРЕЩЕНО.** Adapter integration logic не должна писаться inline в composition или runtime assembly.

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

**SLM-PRO-ADP-009 - ОБЯЗАН.** Client adapter не должен попадать в server graph, а server adapter - в client graph.

**SLM-PRO-ADP-010 - ОБЯЗАН.** Runtime-specific adapter должен иметь явный environment marker, если framework предоставляет такой механизм.

## Event sources

Socket, subscription и event listener реализуют event port:

```ts
export type OrdersEventsPort = {
  subscribe: (listener: (event: unknown) => void) => () => void
}
```

**SLM-PRO-ADP-011 - ОБЯЗАН.** Event adapter должен возвращать cleanup и не открывать connection при module import.

**SLM-PRO-ADP-012 - ОБЯЗАН.** Wire event проходит business normalization до изменения domain state или передачи consumer-коду.

**SLM-PRO-LIFE-013 - МОЖЕТ.** Один physical transport может обслуживать adapters нескольких domains, если transport остаётся domain-agnostic, а adapters получают суженные channels.

## Public boundary

**SLM-PRO-API-014 - ЗАПРЕЩЕНО.** Public business, framework, client или server entrypoint не может реэкспортировать concrete adapter внешним consumers.

**SLM-PRO-ADP-013 - ЗАПРЕЩЕНО.** `adapters` не имеет внешнего public API для app, compositions или других domains.

Adapters доступны только assembly собственного domain и собственным contract tests.
