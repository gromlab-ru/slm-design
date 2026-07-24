---
title: Runtime и lifecycle
status: draft
normative: true
---

# Runtime и Lifecycle

Lifecycle является архитектурной частью любого mutable runtime, subscription и external resource.

## Три стадии

```text
definition
  → module объявляет creators

creation
  → creator создаёт runtime instance без внешних effects

activation
  → graph owner запускает resources и получает cleanup
```

**SLM-LIFE-001 - ЗАПРЕЩЕНО.** Module import не должен выполнять product I/O, открывать connection или регистрировать global listener.

**SLM-LIFE-002 - ОБЯЗАН.** Factory и runtime creator должны быть side-effect free относительно external resources.

**SLM-LIFE-003 - ОБЯЗАН.** Subscription, socket, timer и listener запускаются явной operation владельца scope.

**SLM-LIFE-004 - ОБЯЗАН.** Каждый запущенный resource должен иметь cleanup или dispose contract.

## Scope

| Scope | Примеры владельца |
|---|---|
| Application | Root composition/provider |
| Route branch | Route layout composition |
| Page | Page composition/provider |
| Component flow | Nested composition module |
| Request | Server composition/request builder |
| Test | Test setup/wrapper |

**SLM-LIFE-005 - ОБЯЗАН.** Graph owner должен определить количество instances и duration каждого runtime.

**SLM-LIFE-006 - ЗАПРЕЩЕНО.** Module-level singleton не может использоваться как случайная замена application scope.

**SLM-LIFE-007 - МОЖЕТ.** Application singleton допустим только при явном application ownership и отсутствии request-, identity- и user-specific data.

## Graph activation

**SLM-LIFE-008 - ОБЯЗАН.** Cross-domain graph запускается в dependency order и освобождается в обратном порядке.

**SLM-LIFE-009 - ОБЯЗАН.** Повторный mount/unmount, включая development Strict Mode, не должен оставлять duplicate subscription или abandoned resource.

**SLM-LIFE-010 - СЛЕДУЕТ.** `start` и cleanup следует проектировать idempotent либо явно защищать от повторного вызова.

**SLM-LIFE-018 - ОБЯЗАН.** Если activation графа завершилась ошибкой, graph owner должен освободить уже успешно запущенную часть графа в обратном порядке.

**SLM-LIFE-019 - ОБЯЗАН.** Ошибка cleanup должна быть наблюдаемой и не должна препятствовать попытке освободить остальные resources графа.

## Events и sockets

Socket является technical transport, а его product events входят в domain через business-owned event port.

```text
socket transport
  → domain adapter
  → business event normalization
  → state transition или invalidation intent
  → framework projection
```

**SLM-LIFE-011 - ЗАПРЕЩЕНО.** Framework component не может подписываться на product socket напрямую.

**SLM-LIFE-012 - ОБЯЗАН.** Invalid event и connection failure должны преобразовываться в domain state/outcome либо technical telemetry согласно их semantics; callback error нельзя терять через unobserved throw.

**SLM-LIFE-013 - МОЖЕТ.** Один physical transport может обслуживать adapters нескольких domains, если transport остаётся domain-agnostic, а adapters получают суженные channels.

## Revalidation events

Event может содержать domain update или только сообщать об устаревании данных.

**SLM-LIFE-014 - ОБЯЗАН.** Invalidation intent должен выражаться domain language и не требовать import конкретной query library в business.

Framework surface может преобразовать domain invalidation event в private cache invalidation.

## Server runtime

**SLM-LIFE-015 - ОБЯЗАН.** User-specific server runtime создаётся в request scope.

**SLM-LIFE-016 - ЗАПРЕЩЕНО.** Process singleton не может захватывать request headers, cookies, credentials, AbortSignal или user-specific cache.

**SLM-LIFE-017 - ОБЯЗАН.** Request cancellation должна передаваться external operations через подходящий port/adapter, если runtime поддерживает cancellation.
