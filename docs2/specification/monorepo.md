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
        ├── domains/
        ├── infra/
        ├── ui/
        └── shared/
```

**SLM-MONO-001 - ОБЯЗАН.** Каждое приложение должно самостоятельно определять свой product graph и application compositions.

**SLM-MONO-002 - ЗАПРЕЩЕНО.** Workspace package не может импортировать код из `apps/*`.

**SLM-MONO-003 - ЗАПРЕЩЕНО.** Одно приложение не может deep-import исходники другого приложения вместо общего package contract.

## Package boundary

**SLM-MONO-004 - ОБЯЗАН.** Package должен иметь самостоятельного owner, public exports и подтверждённую reuse/ownership semantics.

**SLM-MONO-005 - ЗАПРЕЩЕНО.** Нельзя создавать package только для обхода layer direction или скрытия cross-domain import.

**SLM-MONO-006 - ОБЯЗАН.** Consumers импортируют package через объявленный package export, а не через filesystem path к internal source.

## Типичные packages

Допустимыми кандидатами являются:

- product-agnostic UI kit;
- technical infra client;
- deterministic shared foundation;
- schema/codegen/tooling package;
- configuration package без application graph.

## Domains в packages

Эта draft-версия определяет Domain как module внутри `apps/{app}/src/domains` и пока не определяет packaged domain как conforming SLM Domain.

**SLM-MONO-007 - ОБЯЗАН.** До принятия отдельной package-модели Domain должен оставаться внутри владеющего приложения.

**SLM-MONO-008 - ЗАПРЕЩЕНО.** Package не может называться Domain для целей этой версии Specification, если он не соответствует определённому application path и ownership.

## Dependency direction

**SLM-MONO-009 - ОБЯЗАН.** Package dependency graph должен оставаться ацикличным и соответствовать заявленной ответственности packages.

**SLM-MONO-010 - ЗАПРЕЩЕНО.** Shared package не может импортировать domain, composition или app-specific infra package.
