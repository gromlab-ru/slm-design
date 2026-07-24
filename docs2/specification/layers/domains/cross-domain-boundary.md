---
title: Cross-domain boundary
status: draft
normative: true
---

# Cross-domain Boundary

Domains не образуют скрытый runtime graph внутри слоя `domains`. Граф связывается только graph owner в `compositions`.

## Runtime imports

**SLM-XDOM-001 - ЗАПРЕЩЕНО.** `business` domain A не импортирует runtime values domain B.

**SLM-XDOM-002 - ЗАПРЕЩЕНО.** Framework surface domain A не импортирует hooks, Provider, Context, components или runtime domain B.

**SLM-XDOM-003 - ЗАПРЕЩЕНО.** Adapter domain A не импортирует adapter или runtime domain B.

**SLM-XDOM-004 - ЗАПРЕЩЕНО.** Client/server assembly domain A не импортирует runtime creator domain B.

Запрет распространяется на direct import, barrel re-export, dynamic import, lazy import и service locator resolution.

## Type-only contracts

**SLM-XDOM-005 - МОЖЕТ.** Business и client/server input contracts domain могут type-only импортировать минимальный стабильный business contract другого domain.

**SLM-XDOM-006 - СЛЕДУЕТ.** Зависимому domain следует объявлять consumer-owned port, если capability можно описать без зависимости от полного foreign API.

```ts
export type UserAuthPort = {
  getSessionSnapshot: () => SessionSnapshot
  subscribeToSession: (listener: () => void) => () => void
}
```

Type-only import не разрешает runtime import и не переносит ownership.

**SLM-XDOM-012 - ЗАПРЕЩЕНО.** Type dependency cycle между domains запрещён, даже если не создаёт runtime cycle.

## Runtime capability injection

**SLM-XDOM-007 - МОЖЕТ.** Domain runtime creator может принять готовую structurally compatible capability, созданную другим domain и переданную composition.

```ts
const auth = createAuthClientRuntime()
const user = createUserClientRuntime({ auth: auth.session })
```

User domain знает только свой input contract. Он не знает creator, Provider, adapters и scope AuthRuntime.

**SLM-XDOM-008 - ОБЯЗАН.** Передаваемая capability должна быть минимальной и не раскрывать raw store, Context, SDK client или mutable internals foreign domain.

**SLM-XDOM-013 - МОЖЕТ.** Structurally compatible foreign capability может реализовать consumer-owned port напрямую. Wrapper adapter создаётся только при необходимости преобразовать contracts или lifecycle.

## React composition

Если React-сущность использует runtime API двух domains, она принадлежит `compositions`.

```tsx
const ProtectedOrderForm = () => {
  const auth = useAuth()
  const order = useOrder()

  return auth.isAuthenticated
    ? <OrderForm order={order} />
    : <AuthPrompt />
}
```

**SLM-XDOM-009 - ОБЯЗАН.** Domain UI может получать от composition только domain-local или presentation-neutral props, callbacks и slots. Foreign domain semantics остаётся во владеющей composition.

```tsx
<AuthRequired>
  <OrderForm />
</AuthRequired>
```

Такое связывание выполняется в composition, а не внутри auth или orders.

## Events

**SLM-XDOM-010 - ЗАПРЕЩЕНО.** Domain не подписывается напрямую на event emitter другого domain через runtime import.

Composition может передать event capability через consumer-owned port:

```ts
const orders = createOrdersClientRuntime({
  userEvents: {
    subscribeToIdentity: user.identity.subscribe,
  },
})
```

## Cycles

**SLM-XDOM-011 - ЗАПРЕЩЕНО.** Runtime dependency cycle между domains является нарушением границы и не может скрываться event bus, lazy resolution или two-way service locator.

Ненормативное пояснение: при обнаружении цикла следует пересмотреть один из вариантов:

- пересмотреть границы domains;
- перенести orchestration в composition;
- выделить отдельную product responsibility;
- инвертировать зависимость через consumer-owned port.
