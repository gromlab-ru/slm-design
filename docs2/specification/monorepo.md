---
title: Монорепозитории
status: draft
normative: true
---

# Монорепозитории

SLM применяется внутри границы каждого frontend-приложения. Workspace packages имеют собственные public boundaries и ownership.

## Application boundary

```text
apps/
└── web/
    └── src/
        ├── app/
        ├── compositions/
        ├── infra/
        ├── ui/
        └── shared/
```

**SLM-MONO-001 - ОБЯЗАН.** Каждое приложение должно самостоятельно определять свои application compositions, product ownership и runtime wiring.

**SLM-MONO-002 - ЗАПРЕЩЕНО.** Workspace package не может импортировать код из `apps/*`.

**SLM-MONO-003 - ЗАПРЕЩЕНО.** Одно приложение не может deep-import исходники другого приложения вместо общего package contract.

## Package boundary

**SLM-MONO-004 - ОБЯЗАН.** Package должен иметь самостоятельного owner, public exports и подтверждённую reuse/ownership semantics.

**SLM-MONO-005 - ЗАПРЕЩЕНО.** Нельзя создавать package только для обхода layer direction, public API или иной объявленной dependency boundary.

**SLM-MONO-006 - ОБЯЗАН.** Consumers импортируют package через объявленный package export, а не через filesystem path к internal source.

## Типичные packages

Допустимыми кандидатами являются:

- product-agnostic UI kit;
- technical infra client;
- deterministic shared foundation;
- schema/codegen/tooling package;
- configuration package без application-specific wiring.

Base SLM не присваивает package дополнительный архитектурный статус автоматически.

## Dependency direction

**SLM-MONO-009 - ОБЯЗАН.** Package dependency graph должен оставаться ацикличным и соответствовать заявленной ответственности packages.

**SLM-MONO-010 - ЗАПРЕЩЕНО.** Shared package не может импортировать application composition или app-specific infra package.
