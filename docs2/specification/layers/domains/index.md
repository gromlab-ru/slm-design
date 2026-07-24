---
title: Слой Domains
status: draft
normative: true
---

# Слой Domains

`domains` содержит законченные вертикальные продуктовые модули. Domain объединяет business logic, framework surfaces, concrete adapters и runtime-specific assembly одной предметной ответственности, не смешивая их внутренние направления зависимостей.

## Domain и group

**SLM-DOM-001 - ОБЯЗАН.** Конечный domain должен располагаться непосредственно в `domains` или внутри одной или нескольких навигационных groups.

```text
domains/{domain}
domains/{group}/{domain}
domains/{group}/{nested-group}/{domain}
```

**SLM-DOM-002 - ЗАПРЕЩЕНО.** Domain group не может иметь `index.ts`, public API, state, adapters, assembly или runtime.

```text
domains/
├── navigation/               # domain
└── knv/                      # group
    ├── auth/                 # domain
    ├── user/                 # domain
    └── orders/               # domain
```

**SLM-DOM-003 - ОБЯЗАН.** Первой архитектурной единицей в group tree является конечная папка, владеющая самостоятельной предметной ответственностью.

## Внутренние зоны

Базовая форма domain:

```text
domains/{group...}/{domain}/
├── business/
├── react/
├── adapters/
├── client/
└── server/
```

| Зона | Статус | Ответственность |
|---|---|---|
| [`business`](./business.md) | Обязательная | Domain model, factory, ports, scenarios, errors |
| [`react`](./framework.md) | Опциональная | React runtime access, hooks, Providers, domain UI |
| [`adapters`](./ports-and-adapters.md) | Опциональная | Concrete реализации business-owned ports |
| [`client`](./client-and-server.md) | Опциональная | Browser/client assembly одного domain |
| [`server`](./client-and-server.md) | Опциональная | Server/request assembly одного domain |

**SLM-DOM-004 - ОБЯЗАН.** Каждый domain должен содержать `business` как единственный владелец product model и business semantics.

**SLM-DOM-005 - СЛЕДУЕТ.** Опциональную зону следует добавлять только при наличии реального runtime consumer и самостоятельной ответственности.

**SLM-DOM-006 - ЗАПРЕЩЕНО.** Нельзя создавать пустые симметричные `react`, `adapters`, `client` или `server` на будущее.

**SLM-DOM-007 - ОБЯЗАН.** Domain zones должны соблюдать внутреннюю dependency direction, даже если физически находятся под одним владельцем.

## Domain ownership

Domain может владеть:

- model и value objects;
- product scenarios;
- domain state и transitions;
- ports;
- normalization и domain errors;
- framework hooks и UI одного domain;
- concrete integrations собственных ports;
- client/server runtime assembly собственного business.

Domain не владеет:

- page/route/layout composition;
- UI, объединяющим несколько domains;
- cross-domain graph;
- framework route entry;
- универсальным technical service;
- product-agnostic UI primitive.

## Product gateway

Framework surface и runtime assembly сохраняют business runtime единственным product gateway согласно [SLM-DATA-001 - SLM-DATA-003](../../state-and-data.md#domain-gateway).

## Cross-domain boundary

Domain может принять готовую внешнюю capability через contract, но не импортирует runtime surface другого domain. Точные правила определены в [cross-domain boundary](./cross-domain-boundary.md).
