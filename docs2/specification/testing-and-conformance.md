---
title: Тестирование и соответствие
status: draft
normative: true
---

# Тестирование и Соответствие

Тесты проверяют public boundaries и runtime risks каждого owner, а не только внутренние helpers.

## Business factory tests

**SLM-TEST-001 - ОБЯЗАН.** Каждый public method runtime API, возвращаемого factory, должен иметь factory-level tests.

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

**SLM-TEST-002 - ОБЯЗАН.** Factory-level test должен создавать runtime через public `business` entrypoint, а не deep-import factory internals.

## Adapter tests

**SLM-TEST-003 - ОБЯЗАН.** Adapter с mapping, transport payload, error channel или lifecycle должен иметь contract tests на применимые responsibilities.

**SLM-TEST-004 - ЗАПРЕЩЕНО.** Adapter test не должен дублировать business scenario tests или утверждать domain fallback/error semantics.

## Assembly tests

**SLM-TEST-005 - ОБЯЗАН.** Client/server assembly tests должны проверять корректную передачу ports, runtime profile isolation и отсутствие I/O при creation.

**SLM-TEST-006 - ОБЯЗАН.** Server assembly с request data должен иметь isolation test для параллельных scopes.

## Framework tests

**SLM-TEST-007 - ОБЯЗАН.** Framework surface tests должны проверять runtime access boundary, предсказуемую ошибку при отсутствии runtime boundary, mapping public outcomes и lifecycle integration.

**SLM-TEST-008 - ОБЯЗАН.** Client/server import boundary должна проверяться инструментом, понимающим реальный framework module graph; DOM unit test не заменяет production build probe.

## Composition tests

**SLM-TEST-009 - ОБЯЗАН.** Tests cross-domain composition должны проверять topology, точный graph contract, переданные capabilities и lifecycle cleanup.

**SLM-TEST-010 - ОБЯЗАН.** Scope с неполным набором domains не должен типизироваться как полный application graph.

## Architecture conformance

Repository checks должны проверять применимые ограничения:

- направление imports;
- deep imports;
- public entrypoints;
- runtime cycles;
- client/server markers;
- forbidden cross-domain imports;
- unique rule IDs документации;
- generated artifacts, если они используются.

**SLM-TEST-011 - ЗАПРЕЩЕНО.** Документированное правило не считается механически enforced, если repository tooling его фактически не проверяет.

## Единица соответствия

**SLM-TEST-014 - ОБЯЗАН.** Application соответствует Specification, если все его modules и связи выполняют применимые обязательные правила.

**SLM-TEST-015 - ОБЯЗАН.** Изменение соответствует Specification, если новые и изменённые modules не создают новых нарушений и проходят применимые checks.

**SLM-TEST-016 - ОБЯЗАН.** Отступление от правила `СЛЕДУЕТ` должно быть зафиксировано в архитектурном review или принятом decision с указанием причины и scope.

**SLM-TEST-017 - ОБЯЗАН.** Manual conformance и mechanical enforcement должны различаться явно; отсутствие автоматической проверки не отменяет нормативное правило.

## Completion gate

**SLM-TEST-012 - ОБЯЗАН.** Изменение считается завершённым только после выполнения ближайших tests, typecheck, lint, build и architecture checks, существующих в repository.

**SLM-TEST-013 - ОБЯЗАН.** Невыполненная проверка и остаточный риск должны быть явно указаны в результате работы.
