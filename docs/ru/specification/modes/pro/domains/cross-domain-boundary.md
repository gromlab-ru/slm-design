---
title: Cross-domain boundary
status: draft
normative: true
overlay: pro
base: slm
---

# Cross-domain Boundary

> Overlay: `SLM Pro`.

Domains не образуют скрытый runtime graph внутри слоя `domains`. Граф связывается только graph owner в `compositions`.

## Composition graph

**SLM-PRO-CMP-001 - ОБЯЗАН.** Runtime graph нескольких domains должен собираться в composition, которая владеет его scope.

```ts
const auth = createAuthRuntime()
const user = createUserRuntime({ auth: auth.session })
const orders = createOrdersRuntime({ user: user.agreements })
```

**SLM-PRO-CMP-002 - ОБЯЗАН.** Composition должна создавать domain runtimes в явном ацикличном порядке.

**SLM-PRO-CMP-003 - ОБЯЗАН.** Cross-domain dependency должна передаваться как готовая минимальная capability, а не разрешаться service locator или domain import.

**SLM-PRO-CMP-012 - ОБЯЗАН.** App-specific graph type должен отражать только реально предоставленные runtimes; `Partial<Graph>` с последующим приведением к полному graph запрещён.

## Runtime imports

**SLM-PRO-XDOM-001 - ЗАПРЕЩЕНО.** Ни одна zone domain A не может импортировать, реэкспортировать, dynamic-import или разрешать через service locator runtime value domain B.

Запрет включает foreign business API, hooks, Provider, Context, components, adapters, runtime creators и event emitters.

Foreign runtime capability может поступить только argument-ом от composition согласно разделу [Runtime capability injection](#runtime-capability-injection).

## Type-only contracts

**SLM-PRO-API-008 - СЛЕДУЕТ.** Cross-domain capability следует описывать consumer-owned structural port вместо зависимости от полного foreign API type.

**SLM-PRO-XDOM-014 - ЗАПРЕЩЕНО.** Public contract зависимого domain не может реэкспортировать полный foreign DomainRuntime type как собственную cross-domain dependency.

**SLM-PRO-XDOM-005 - МОЖЕТ.** Business и client/server input contracts domain могут type-only импортировать минимальный стабильный business contract другого domain.

Предпочтение consumer-owned port определяется правилом `SLM-PRO-API-008`.

```ts
export type UserAuthPort = {
  getSessionSnapshot: () => SessionSnapshot
  subscribeToSession: (listener: () => void) => () => void
}
```

Type-only import не разрешает runtime import и не переносит ownership.

**SLM-PRO-XDOM-012 - ЗАПРЕЩЕНО.** Type dependency cycle между domains запрещён, даже если не создаёт runtime cycle.

## Runtime capability injection

**SLM-PRO-XDOM-007 - МОЖЕТ.** Domain runtime creator может принять готовую structurally compatible capability, созданную другим domain и переданную composition.

```ts
const auth = createAuthClientRuntime()
const user = createUserClientRuntime({ auth: auth.session })
```

User domain знает только свой input contract. Он не знает creator, Provider, adapters и scope AuthRuntime.

**SLM-PRO-XDOM-008 - ОБЯЗАН.** Передаваемая capability должна быть минимальной и не раскрывать raw store, Context, SDK client или mutable internals foreign domain.

**SLM-PRO-XDOM-013 - МОЖЕТ.** Structurally compatible foreign capability может реализовать consumer-owned port напрямую. Wrapper adapter создаётся только при необходимости преобразовать contracts или lifecycle.

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

**SLM-PRO-XDOM-009 - ОБЯЗАН.** Props, callbacks и slots, передаваемые из composition в domain UI, должны оставаться domain-local или presentation-neutral. Foreign domain semantics остаётся во владеющей composition.

```tsx
<AuthRequired>
  <OrderForm />
</AuthRequired>
```

Такое связывание выполняется в composition, а не внутри auth или orders.

## Events

Прямая подписка на event emitter другого domain через runtime import запрещена правилом `SLM-PRO-XDOM-001`.

Composition может передать event capability через consumer-owned port:

```ts
const orders = createOrdersClientRuntime({
  userEvents: {
    subscribeToIdentity: user.identity.subscribe,
  },
})
```

## Cycles

**SLM-PRO-XDOM-011 - ЗАПРЕЩЕНО.** Runtime dependency cycle между domains является нарушением границы и не может скрываться event bus, lazy resolution или two-way service locator.

**SLM-PRO-LIFE-008 - ОБЯЗАН.** Cross-domain graph запускается в dependency order и освобождается в обратном порядке.

Ненормативное пояснение: при обнаружении цикла следует пересмотреть один из вариантов:

- пересмотреть границы domains;
- перенести orchestration в composition;
- выделить отдельную product responsibility;
- инвертировать зависимость через consumer-owned port.
