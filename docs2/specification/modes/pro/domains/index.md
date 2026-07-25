---
title: Domains в SLM Pro
status: draft
normative: true
overlay: pro
base: slm
---

# Domains в SLM Pro

> Overlay: `SLM Pro`. Base: [SLM](../../../index.md).

Domain является изолированным вертикальным product module с одной предметной ответственностью, явным public boundary и строгими внутренними dependency zones.

## Domain и group

**SLM-PRO-DOM-001 - ОБЯЗАН.** Конечный Pro domain должен располагаться непосредственно в `domains` или внутри одной или нескольких навигационных groups.

```text
domains/{domain}
domains/{group}/{domain}
domains/{group}/{nested-group}/{domain}
```

**SLM-PRO-DOM-002 - ОБЯЗАН.** Узел domain tree с собственным public API, state, integration, assembly или runtime должен классифицироваться как конечный domain, а не domain group.

```text
domains/
├── navigation/               # domain
└── knv/                      # group
    ├── auth/                 # domain
    ├── user/                 # domain
    └── orders/               # domain
```

**SLM-PRO-DOM-003 - ОБЯЗАН.** Первой архитектурной единицей в group tree является конечная папка, владеющая самостоятельной product responsibility.

## Ownership

**SLM-PRO-DOM-004 - ОБЯЗАН.** Pro domain должен владеть одной сформулированной product responsibility и предоставлять её внешним consumers через собственные public entrypoints.

Pro domain может владеть:

- product model и value objects;
- scenarios и operations;
- domain state и transitions;
- normalization и product errors;
- business-owned ports;
- concrete integrations собственных ports;
- framework hooks и UI одного domain;
- client/server runtime assembly.

**SLM-PRO-DOM-005 - ЗАПРЕЩЕНО.** Domain не может владеть framework route entry, page/layout composition, UI нескольких самостоятельных product responsibilities, universal technical capability или product-agnostic UI primitive.

Public entrypoints Pro domain следуют base-правилам `SLM-API-001` и `SLM-API-002`; Pro-главы вводят дополнительные ограничения exports.

**SLM-PRO-DOM-007 - ЗАПРЕЩЕНО.** Если product responsibility получила Pro domain owner, app, composition или infra не могут создавать параллельную модель этой ответственности либо обходить её public boundary.

**SLM-PRO-DOM-008 - ОБЯЗАН.** Для domain-owned responsibility это правило заменяет base-правило `SLM-CMP-001`: business владеет product logic, а composition владеет application flow и runtime graph.

Product responsibility считается устойчивой, если имеет самостоятельную product model или transitions, используется несколькими application flows либо владеет external integration/lifecycle contract.

**SLM-PRO-DOM-017 - ОБЯЗАН.** Каждая устойчивая product responsibility должна иметь Pro domain owner; route/page-local presentation flow остаётся ответственностью composition.

## Внутренние zones

```text
domains/{group...}/{domain}/
├── business/
├── react/
├── adapters/
├── client/
└── server/
```

| Zone | Статус | Ответственность |
|---|---|---|
| [`business`](./business.md) | Обязательная | Product model, factory, ports, scenarios, errors |
| [`react`](./framework.md) | Опциональная | React runtime access, hooks, Providers, domain UI |
| [`adapters`](./ports-and-adapters.md) | Опциональная | Concrete реализации business-owned ports |
| [`client`](./client-and-server.md) | Опциональная | Browser/client assembly одного domain |
| [`server`](./client-and-server.md) | Опциональная | Server/request assembly одного domain |

**SLM-PRO-DOM-009 - ОБЯЗАН.** Каждый Pro domain должен содержать `business` как единственного владельца product model и business semantics.

**SLM-PRO-DOM-010 - СЛЕДУЕТ.** Опциональную zone следует добавлять только при наличии реального runtime consumer и самостоятельной ответственности.

**SLM-PRO-DOM-011 - ЗАПРЕЩЕНО.** Нельзя создавать пустые симметричные `react`, `adapters`, `client` или `server` на будущее.

**SLM-PRO-DOM-012 - ОБЯЗАН.** Domain zones должны соблюдать внутреннюю dependency direction, даже если физически находятся под одним владельцем.

**SLM-PRO-MOD-001 - ОБЯЗАН.** `business`, `react`, `adapters`, `client` и `server` являются внутренними zones одного domain, а не самостоятельными верхнеуровневыми modules.

**SLM-PRO-SEG-001 - ЗАПРЕЩЕНО.** Domain zones нельзя трактовать как взаимозаменяемые generic segments.

Внутри каждой zone могут использоваться обычные base SLM segments по фактической необходимости.

## Внутреннее направление

```text
business -> shared | pure libraries
react -> ui | shared | framework libraries
adapters -> infra | SDK | platform runtime
client -> own business factory | own client adapters | own framework surface | client technical inputs
server -> own business factory | own server adapters | server technical inputs
```

Матрица описывает runtime imports. React surface может type-only импортировать собственные business contracts, adapters - собственные business ports/types, а client/server inputs - разрешённые cross-domain contracts.

## Путь данных

```text
composition
  -> domain client/server assembly при наличии runtime-specific setup
     или напрямую business factory для universal domain
  -> DomainRuntime
  -> business scenario
  -> business-owned port
  -> domain adapter
  -> infra / SDK / storage / external source
```

**SLM-PRO-DOM-013 - ОБЯЗАН.** DomainRuntime, созданный business factory, должен быть единственным product gateway своего Pro domain для runtime consumers.

Stateless logic API также является DomainRuntime, если он создан factory и соблюдает тот же public boundary.

## Product UI

**SLM-PRO-DOM-014 - МОЖЕТ.** Product UI одной Pro domain responsibility может принадлежать framework surface этого domain.

UI нескольких самостоятельных responsibilities остаётся в `compositions` согласно base-правилу `SLM-CMP-006`.

## Cross-domain graph

```text
composition
  -> создаёт несколько domain runtimes
  -> передаёт готовые capabilities
```

Pro domain не создаёт runtime другого domain и не импортирует его runtime surface. Точные правила определены в [Cross-domain boundary](./cross-domain-boundary.md).

**Graph owner** - composition, являющаяся scope owner нескольких DomainRuntime, связанных направленными dependencies в одном ацикличном graph, и определяющая порядок их создания, activation и cleanup.

## Monorepo boundary

**SLM-PRO-DOM-015 - ОБЯЗАН.** Pro domain должен оставаться внутри `apps/{app}/src/domains` до принятия отдельной package-модели.

**SLM-PRO-DOM-016 - ЗАПРЕЩЕНО.** Workspace package не может называться Pro Domain для целей Specification, если он не соответствует application path и ownership этой главы.

## Главы Pro Domain Specification

- [Business](./business.md)
- [Framework surface](./framework.md)
- [Ports и adapters](./ports-and-adapters.md)
- [Client и server assembly](./client-and-server.md)
- [Cross-domain boundary](./cross-domain-boundary.md)
- [Тестирование Pro domains](./testing.md)
