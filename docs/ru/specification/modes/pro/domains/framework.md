---
title: Framework surface в SLM Pro
status: draft
normative: true
overlay: pro
base: slm
---

# Framework Surface

> Overlay: `SLM Pro`.

Framework surface адаптирует готовый DomainRuntime к execution model конкретного framework. В текущей структуре React surface располагается в `react/`.

## Структура React surface

```text
domains/{group...}/{domain}/react/
├── context/
├── providers/
├── hooks/
├── ui/
└── index.ts
```

Ни один segment не обязателен без реальной потребности.

## Runtime access

**SLM-PRO-FRM-001 - ОБЯЗАН.** Framework surface должна работать с конкретным DomainRuntime через domain-owned runtime access boundary.

**SLM-PRO-FRM-002 - ЗАПРЕЩЕНО.** Framework hook или component не может самостоятельно вызывать business factory, создавать adapters или разрешать runtime из global service locator.

**SLM-PRO-FRM-003 - ОБЯЗАН.** Runtime access boundary должна получать готовый DomainRuntime извне и не создавать параллельное domain state.

Для React типичным механизмом является private Context, связывающий статически экспортированные hooks/components с переданным runtime instance. Это пояснение не предписывает точную форму или количество Providers в текущем draft.

**Domain runtime Provider** - часть framework surface, получающая готовый DomainRuntime и предоставляющая его framework consumers одного domain. Provider не создаёт cross-domain graph автоматически.

## Imports

**SLM-PRO-FRM-004 - ОБЯЗАН.** React surface должна импортировать business runtime contracts только через `import type`.

**SLM-PRO-FRM-005 - ЗАПРЕЩЕНО.** React surface не может runtime-импортировать business factory, private business services, selectors, validators, errors или constants.

**SLM-PRO-FRM-006 - ЗАПРЕЩЕНО.** React surface не может импортировать domain adapters, SDK, product infra client или assembly.

**SLM-PRO-FRM-007 - МОЖЕТ.** React surface может импортировать public API `ui`, `shared` и framework libraries, разрешённые её runtime profile.

Cross-domain runtime imports framework surface запрещены правилом [SLM-PRO-XDOM-001](./cross-domain-boundary.md#runtime-imports).

## Hooks

**SLM-PRO-FRM-009 - ОБЯЗАН.** Domain hook должен получать product data и behavior только через текущий DomainRuntime.

**SLM-PRO-FRM-010 - МОЖЕТ.** Hook может использовать framework query/cache runtime как private implementation поверх imperative DomainRuntime query.

**SLM-PRO-FRM-011 - ЗАПРЕЩЕНО.** Query hook не может использовать adapter или SDK call как fetcher в обход DomainRuntime.

**SLM-PRO-FRM-012 - ЗАПРЕЩЕНО.** Query-library types, cache keys и raw mutate API не могут становиться public business contract.

## Domain UI

Domain React UI может:

- вызывать hooks своего domain;
- использовать universal UI;
- отображать domain-owned states и outcomes;
- принимать callbacks, props и slots от composition.

**SLM-PRO-FRM-013 - ЗАПРЕЩЕНО.** Domain UI не может импортировать runtime другого domain или оркестрировать route/page flow.

Владение React UI, использующим несколько domains, определено base-правилом [SLM-BASE-CMP-006](../../../layers/compositions.md#product-ui).

## Client boundary

**SLM-PRO-FRM-015 - ОБЯЗАН.** Entry point React hooks, Context и interactive UI должен быть явно отмечен как client runtime согласно правилам используемого framework.

**SLM-PRO-FRM-016 - ЗАПРЕЩЕНО.** Server-compatible React export не может попадать в client entrypoint только из-за нахождения рядом с client hooks или Provider.

React не является синонимом client runtime; environment profile определяется фактическими dependencies export.
