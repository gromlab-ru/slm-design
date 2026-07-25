---
title: Runtime и lifecycle
status: draft
normative: true
---

# Runtime и Lifecycle

Lifecycle является архитектурной частью любого mutable runtime, subscription и external resource. Эти правила не требуют создавать отдельный runtime или factory, если у module нет соответствующего состояния или resources.

## Definition, creation и activation

Для module с создаваемым runtime применима модель:

```text
definition
  -> module объявляет creator

creation
  -> creator создаёт instance без external effects

activation
  -> scope owner запускает resources и получает cleanup
```

**SLM-LIFE-001 - ЗАПРЕЩЕНО.** Module import не должен выполнять product I/O, открывать connection или регистрировать global listener.

**SLM-LIFE-002 - ОБЯЗАН.** Если module предоставляет factory или runtime creator, creation должна быть side-effect free относительно external resources.

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

**SLM-LIFE-005 - ОБЯЗАН.** Scope owner должен определить количество instances и duration каждого mutable runtime или resource.

**SLM-LIFE-006 - ЗАПРЕЩЕНО.** Module-level singleton не может использоваться как случайная замена application scope.

**SLM-LIFE-007 - МОЖЕТ.** Application singleton допустим только при явном application ownership и отсутствии request-, identity- и user-specific data.

## Activation и cleanup

**SLM-LIFE-009 - ОБЯЗАН.** Повторный mount/unmount, включая development Strict Mode, не должен оставлять duplicate subscription или abandoned resource.

**SLM-LIFE-010 - СЛЕДУЕТ.** `start` и cleanup следует проектировать idempotent либо явно защищать от повторного вызова.

**SLM-LIFE-018 - ОБЯЗАН.** Если activation составного resource set завершилась ошибкой, scope owner должен освободить уже успешно запущенную часть в обратном порядке.

**SLM-LIFE-019 - ОБЯЗАН.** Ошибка cleanup должна быть наблюдаемой и не должна препятствовать попытке освободить остальные resources scope.

## Events и sockets

Product event обрабатывается владельцем product semantics; socket остаётся technical transport.

**SLM-LIFE-011 - ЗАПРЕЩЕНО.** Framework component не может открывать product socket напрямую при render или module import.

**SLM-LIFE-012 - ОБЯЗАН.** Invalid event и connection failure должны преобразовываться в product state/outcome либо technical telemetry согласно их semantics; callback error нельзя терять через unobserved throw.

## Revalidation events

Event может содержать product update или только сообщать об устаревании данных.

**SLM-LIFE-014 - ОБЯЗАН.** Invalidation intent должен выражаться product language и не требовать import конкретной query library в public product contract.

## Server runtime

**SLM-LIFE-015 - ОБЯЗАН.** User-specific server runtime создаётся в request scope.

**SLM-LIFE-016 - ЗАПРЕЩЕНО.** Process singleton не может захватывать request headers, cookies, credentials, AbortSignal или user-specific cache.

**SLM-LIFE-017 - ОБЯЗАН.** Request cancellation должна передаваться external operations, если runtime и используемая integration поддерживают cancellation.

Overlay может вводить дополнительные lifecycle boundaries только внутри собственного delta.
