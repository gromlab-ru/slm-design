---
title: Слой Infra
status: draft
normative: true
---

# Слой Infra

`infra` содержит technical capabilities приложения, не определяющие product model и scenarios.

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

**SLM-INF-001 - ОБЯЗАН.** Infra module должен описывать technical capability, а не product semantics или scenario.

**SLM-INF-002 - МОЖЕТ.** Infra module может импортировать public API другого infra module и `shared`.

Запрет infra импортировать `compositions` или `app` определяется base-правилом `SLM-ARCH-003`.

**SLM-INF-004 - ЗАПРЕЩЕНО.** Infra не может владеть product wiring, собирать application graph или предоставлять generic product service locator.

**SLM-INF-005 - ЗАПРЕЩЕНО.** Infra не создаёт product errors, product fallback и product model из transport DTO.

**SLM-INF-006 - МОЖЕТ.** Infra может экспортировать technical client, transport, event source, storage primitive или platform wrapper через собственный public API.

**SLM-INF-007 - ОБЯЗАН.** Generated SDK и transport details должны оставаться внутри technical или private integration boundary владельца и не становиться частью public product contract.

## Product integration

Infra знает technical mechanism:

```text
HTTP client
WebSocket transport
local storage primitive
analytics SDK
```

Product owner определяет semantics использования capability; infra предоставляет механизм через public API. Один infra module может использоваться несколькими product owners без знания их semantics.
