---
title: Слой Infra
status: draft
normative: true
---

# Слой Infra

`infra` содержит технические capabilities приложения, не определяющие продуктовую модель и сценарии.

## Примеры modules

```text
infra/
├── http/
├── backend-api/
├── realtime/
├── analytics/
├── logger/
├── app-config/
├── storage/
├── i18n/
└── theme/
```

## Правила

**SLM-INF-001 - ОБЯЗАН.** Infra module должен описывать техническую capability, а не продуктовый domain.

**SLM-INF-002 - МОЖЕТ.** Infra module может импортировать public API другого infra module и `shared`.

**SLM-INF-003 - ЗАПРЕЩЕНО.** Infra module не может импортировать `domains`, `compositions` или `app`.

**SLM-INF-004 - ЗАПРЕЩЕНО.** Infra не может собирать domain factory, хранить cross-domain graph или предоставлять generic product service locator.

**SLM-INF-005 - ЗАПРЕЩЕНО.** Infra не создаёт domain errors, domain fallback и domain model из transport DTO.

**SLM-INF-006 - МОЖЕТ.** Infra может экспортировать technical client, transport, event source, storage primitive или platform wrapper через собственный public API.

**SLM-INF-007 - ОБЯЗАН.** Generated SDK и transport details должны оставаться внутри infra или concrete domain adapter и не становиться public contract продуктовых consumers.

## Отличие от adapter

Infra знает технический механизм:

```text
HTTP client
WebSocket transport
local storage primitive
analytics SDK
```

Domain adapter знает, какая часть этого механизма реализует конкретный business-owned port:

```text
AuthPhonePort
OrdersEventsPort
UserAgreementsStoragePort
```

Один infra module может использоваться adapters нескольких domains без знания их product semantics.
