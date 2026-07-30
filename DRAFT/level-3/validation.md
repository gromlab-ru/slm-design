# Проверка Level 3

> Граница автоматической проверки, архитектурного ревью и verification Level 3.

## Конфигурация проекта

Конфигурация проверки сопоставляет физические пути с Domain, role modules, Groups, public entrypoints и environment labels. Она также определяет, какие entrypoints считаются client-only, server-only или isomorphic.

Сопоставление путей не определяет предметный смысл Domain. Оно позволяет проверить форму Domain, public API modules, import graph, циклы и environment boundaries.

## Автоматическая проверка

Автоматическая проверка должна блокировать:

- отсутствие или множественность `business` module в Domain;
- runtime-код или root entrypoint у Domain;
- deep imports в segments role modules;
- достижение framework, concrete runtime, environment markers, adapters или presets из `business` entrypoint;
- достижение incompatible environment graph из client-only, server-only или isomorphic entrypoint;
- циклы между modules по общему правилу Level 1.

## Архитектурное ревью

На ревью определяется:

- является ли Domain одной связной предметной областью;
- принадлежит ли business scenario, error contract и state semantics `business` module;
- описывает ли port минимальную business capability без concrete types;
- остаётся ли adapter техническим bridge без domain fallback и error mapping;
- является ли preset повторяемой assembly конкретного scope;
- определены ли module-владелец lifecycle contract, graph owner, scope instance, start и cleanup;
- проходит ли междоменная runtime-связь через consumer-owned port;
- принадлежит ли React UI Domain, а не конкретной page или route composition.

## Verification

Business проверяется factory-level tests с controlled ports. Adapter проверяется на transport/wiring boundary, preset -- на assembly, scope и environment boundary, React module -- на provider, subscriptions и framework lifecycle. Полная cross-domain assembly проверяется у graph owner.

Тесты не заменяют автоматические import checks и архитектурное ревью. Они доказывают runtime behavior на уже выбранной границе.

## Связанные правила

- [`SLM-L3-DOMAIN-A002`](../rules/level-3.md#slm-l3-domain-a002)
- [`SLM-L3-BUSINESS-R003`](../rules/level-3.md#slm-l3-business-r003)
- [`SLM-L3-BUSINESS-A004`](../rules/level-3.md#slm-l3-business-a004)
- [`SLM-L3-ENVIRONMENT-A012`](../rules/level-3.md#slm-l3-environment-a012)
- [`SLM-L3-TEST-R014`](../rules/level-3.md#slm-l3-test-r014)
- [`SLM-L1-MODULE-A004`](../rules/level-1.md#slm-l1-module-a004)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)
