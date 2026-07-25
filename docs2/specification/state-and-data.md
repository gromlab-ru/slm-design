---
title: State и data
status: draft
normative: true
---

# State и Data

SLM рассматривает данные и состояние через одного владельца semantics, даже если runtime использует несколько caches и projections.

## Ownership matrix

| Вид | Владелец |
|---|---|
| Product model и transitions | Product owner |
| Product source integration | Product owner; technical mechanism остаётся в infra |
| Framework projection product data | Public surface владельца product data |
| Page-local presentation state | Composition |
| Component-local interaction | Владеющий component/module |
| Technical connection/cache state | Infra или runtime-specific owner |
| Request context | Server/framework scope |
| Universal UI state | Владеющий UI module |

## Product gateway

**SLM-DATA-001 - ОБЯЗАН.** Consumer должен получать product data через public boundary владеющего module.

**SLM-DATA-002 - ЗАПРЕЩЕНО.** Composition, UI или app не могут маппить transport DTO в параллельную product model, если модель уже имеет другого owner.

**SLM-DATA-003 - ОБЯЗАН.** Product owner владеет normalization, validation и semantics отсутствия данных.

## Product state

**SLM-DATA-004 - ОБЯЗАН.** Product state model и допустимые transitions должны определяться product owner независимо от concrete state manager.

**SLM-DATA-005 - ЗАПРЕЩЕНО.** Concrete mutable store implementation не может становиться public product contract без явно объявленного владельцем стабильного store access API.

**SLM-DATA-006 - ОБЯЗАН.** Mutable product instance должен быть привязан к явному lifecycle scope.

## Query cache

Framework или technical query cache может хранить projection результата product query.

**SLM-DATA-007 - ОБЯЗАН.** Query/cache consumer за пределами product owner должен использовать public boundary владельца и не может обходить его прямым вызовом private integration или SDK.

**SLM-DATA-008 - ЗАПРЕЩЕНО.** Query cache не может объявлять собственную product model, error taxonomy или fallback policy.

**SLM-DATA-009 - ОБЯЗАН.** User/session-scoped cache keys и invalidation должны изолировать данные разных identities и scopes без использования secret как публичного key contract.

Эта draft-версия не предписывает единственное физическое место QueryClient/SWR cache. Конкретная модель оценивается по правилам public boundary владельца, lifecycle и identity isolation.

**SLM-DATA-015 - ОБЯЗАН.** Cache instance должен иметь явного creator и scope owner в composition или runtime setup.

**SLM-DATA-016 - ОБЯЗАН.** Shared framework cache должен передаваться consumers через framework-supported runtime boundary, а не через import app-specific mutable singleton.

**SLM-DATA-017 - ОБЯЗАН.** Scope owner должен очищать или изолировать private cache при смене identity и завершении соответствующего scope.

## Presentation state

**SLM-DATA-010 - МОЖЕТ.** Composition или component может использовать concrete state manager для локального presentation state.

**SLM-DATA-011 - ЗАПРЕЩЕНО.** Presentation store не должен копировать canonical product state как второй source of truth.

## Serializable boundaries

**SLM-DATA-012 - ОБЯЗАН.** Через server/client boundary передаются только serializable product-owned data без functions, stores, clients, Context и resources.

**SLM-DATA-013 - ЗАПРЕЩЕНО.** Secrets, access tokens и request credentials не должны включаться в client bootstrap snapshot.

**SLM-DATA-014 - ОБЯЗАН.** Server и client initial snapshots должны быть согласованы, если framework выполняет hydration одного UI state.
