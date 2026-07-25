---
title: Тестирование Pro domains
status: draft
normative: true
overlay: pro
base: slm
---

# Тестирование Pro Domains

> Overlay: `SLM Pro`.

Общие правила [тестирования и соответствия](../../../testing-and-conformance.md) дополняются проверками строгих business, adapter, assembly и framework boundaries.

## Business factory tests

**SLM-PRO-TEST-001 - ОБЯЗАН.** Каждый public method runtime API, возвращаемого factory, должен иметь factory-level tests.

Factory-level tests должны проверять применимые случаи:

- happy path;
- malformed external result;
- rejected dependency;
- синхронное исключение dependency;
- domain outcome/error semantics;
- side-effect order;
- state transition;
- отсутствие constructor-time I/O;
- public API shape.

**SLM-PRO-TEST-002 - ОБЯЗАН.** Factory-level test должен создавать runtime через public `business` entrypoint, а не deep-import factory internals.

## Adapter tests

**SLM-PRO-TEST-003 - ОБЯЗАН.** Adapter с mapping, transport payload, error channel или lifecycle должен иметь contract tests на применимые responsibilities.

**SLM-PRO-TEST-004 - ЗАПРЕЩЕНО.** Adapter test не должен дублировать business scenario tests или утверждать domain fallback/error semantics.

## Assembly tests

**SLM-PRO-TEST-005 - ОБЯЗАН.** Client/server assembly tests должны проверять корректную передачу ports, runtime profile isolation и отсутствие I/O при creation.

**SLM-PRO-TEST-006 - ОБЯЗАН.** Server assembly с request data должен иметь isolation test для параллельных scopes.

## Framework tests

**SLM-PRO-TEST-007 - ОБЯЗАН.** Framework surface tests должны проверять runtime access boundary, предсказуемую ошибку при отсутствии runtime boundary, mapping public outcomes и lifecycle integration.

## Composition tests

**SLM-PRO-TEST-009 - ОБЯЗАН.** Tests cross-domain composition должны проверять topology, точный graph contract, переданные capabilities и lifecycle cleanup.

**SLM-PRO-TEST-010 - ОБЯЗАН.** Scope с неполным набором domains не должен типизироваться как полный application graph.

## Architecture checks

**SLM-PRO-TEST-019 - ОБЯЗАН.** Pro repository checks должны проверять применимые строгие domain boundaries:

- client/server markers;
- forbidden runtime imports между domains;
- private adapters;
- business entrypoint shape;
- zone dependency direction.
