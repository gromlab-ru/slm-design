---
title: Public API и импорты
status: draft
normative: true
---

# Public API и Импорты

Public API ограничивает знание consumers о внутренней структуре module и отделяет runtime profiles.

## Общие правила

**SLM-API-001 - ОБЯЗАН.** Межмодульный import должен использовать public entrypoint импортируемого module.

**SLM-API-002 - ЗАПРЕЩЕНО.** Deep imports во внутренние segments, zones и files другого module запрещены.

**SLM-API-003 - ОБЯЗАН.** Каждый runtime export должен иметь реального consumer за пределами владеющего entrypoint и стабильную ответственность. Sibling zone собственного domain и public-boundary test считаются consumers zone entrypoint.

**SLM-API-004 - ЗАПРЕЩЕНО.** Public API не может экспортировать raw Context, mutable store, persistence key, concrete adapter, SDK client или internal service.

**SLM-API-005 - ОБЯЗАН.** Alias или package subpath должен физически разрешаться TypeScript, tests и production build.

## Layer matrix

| Importer | Runtime imports |
|---|---|
| `app` | Public composition entries, shared static/global resources |
| `compositions` | Compositions, domain runtime surfaces, infra, ui, shared |
| Domain `business` | Own files, shared, pure libraries |
| Domain `react` | Own business types, ui, shared, framework libraries |
| Domain `adapters` | Own business types/ports, infra, SDK/platform runtime |
| Domain `client/server` | Own factory, own adapters, own runtime surface |
| `infra` | Infra, shared |
| `ui` | UI, shared |
| `shared` | External pure libraries only |

Cross-domain rules дополнительно ограничены [cross-domain boundary](./layers/domains/cross-domain-boundary.md).

## Type-only imports

**SLM-API-006 - МОЖЕТ.** `import type` может использоваться для разрешённого contract dependency без создания runtime edge.

**SLM-API-007 - ЗАПРЕЩЕНО.** Type-only import не разрешает перенос ownership, импорт concrete runtime type или обход layer boundary.

**SLM-API-008 - СЛЕДУЕТ.** Cross-domain capability следует описывать consumer-owned structural port вместо зависимости от полного foreign API type.

## Business entrypoint

```text
domains/{domain}/business/index.ts
```

Точный contract business entrypoint определён правилами [SLM-BUS-006 - SLM-BUS-008](./layers/domains/business.md#public-api).

## Runtime-specific domain entrypoints

Domain может иметь отдельные public surfaces:

```text
domains/{domain}/react
domains/{domain}/client
domains/{domain}/server
```

Разделение client/server exports и markers определено правилами [SLM-ASM-011 - SLM-ASM-014](./layers/domains/client-and-server.md#public-entrypoints).

Точная форма re-export между `react` и `client` в этом draft не предписана. Независимо от формы должны соблюдаться environment isolation и отсутствие обхода DomainRuntime.

## Groups и private zones

**SLM-API-013 - ЗАПРЕЩЕНО.** Group не имеет public entrypoint.

**SLM-API-014 - ЗАПРЕЩЕНО.** Domain `adapters` не экспортируется app, compositions или другим domains.

**SLM-API-015 - ОБЯЗАН.** Composition public API экспортирует только entry components, точные access hooks/types и contracts, необходимые внешним composition consumers.

## Cycles

**SLM-API-016 - ЗАПРЕЩЕНО.** Runtime import cycle между modules запрещён независимо от того, способен ли bundler его выполнить.

**SLM-API-017 - ЗАПРЕЩЕНО.** Barrel не должен создавать скрытый cycle между ready composition и access API её children.
