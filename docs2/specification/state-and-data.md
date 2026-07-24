---
title: State и data
status: draft
normative: true
---

# State и Data

Данные и состояние должны иметь одного понятного владельца semantics, даже если runtime использует несколько caches и projections.

## Ownership matrix

| Вид | Владелец |
|---|---|
| Domain model и transitions | Domain business |
| Product source integration | Domain adapter |
| Framework projection доменных данных | Domain framework surface |
| Page-local presentation state | Composition |
| Component-local interaction | Владеющий component/module |
| Technical connection/cache state | Infra или runtime-specific owner |
| Request context | Server/framework scope |
| Universal UI state | Владеющий UI module |

## Domain gateway

**SLM-DATA-001 - ОБЯЗАН.** Consumer получает product data только через public domain runtime surface.

**SLM-DATA-002 - ЗАПРЕЩЕНО.** Composition, UI или app не могут маппить transport DTO в параллельную domain model.

**SLM-DATA-003 - ОБЯЗАН.** Domain business владеет normalization, validation и semantics отсутствия данных.

## Domain state

**SLM-DATA-004 - ОБЯЗАН.** Domain state model и допустимые transitions определяются business независимо от concrete state manager.

**SLM-DATA-005 - ЗАПРЕЩЕНО.** Raw store API не может становиться public domain contract.

**SLM-DATA-006 - ОБЯЗАН.** Mutable domain instance должен быть привязан к явному lifecycle scope.

## Query cache

Framework или technical query cache может хранить projection результата DomainRuntime query.

**SLM-DATA-007 - ОБЯЗАН.** Fetcher продуктового query должен вызывать DomainRuntime, а не adapter или SDK напрямую.

**SLM-DATA-008 - ЗАПРЕЩЕНО.** Query cache не может объявлять собственную domain model, error taxonomy или fallback policy.

**SLM-DATA-009 - ОБЯЗАН.** User/session-scoped cache keys и invalidation должны изолировать данные разных identities и scopes без использования secret как публичного key contract.

Эта draft-версия не предписывает единственное физическое место QueryClient/SWR cache. Конкретная модель должна сохранять правила gateway, lifecycle и identity isolation.

**SLM-DATA-015 - ОБЯЗАН.** Cache instance должен иметь явного creator и scope owner в composition или runtime setup.

**SLM-DATA-016 - ОБЯЗАН.** Shared framework cache должен передаваться domain surfaces через framework-supported runtime boundary, а не через import app-specific infra singleton.

**SLM-DATA-017 - ОБЯЗАН.** Graph owner должен очищать или изолировать private cache при смене identity и завершении соответствующего scope.

## Presentation state

**SLM-DATA-010 - МОЖЕТ.** Composition или component может использовать concrete state manager для локального presentation state.

**SLM-DATA-011 - ЗАПРЕЩЕНО.** Presentation store не должен копировать DomainRuntime state как второй source of truth.

## Serializable boundaries

**SLM-DATA-012 - ОБЯЗАН.** Через server/client boundary передаются только serializable business-owned data без functions, stores, clients, Context и resources.

**SLM-DATA-013 - ЗАПРЕЩЕНО.** Secrets, access tokens и request credentials не должны включаться в client bootstrap snapshot.

**SLM-DATA-014 - ОБЯЗАН.** Server и client initial snapshots должны быть согласованы, если framework выполняет hydration одного UI state.
