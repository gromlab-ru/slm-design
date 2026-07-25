---
title: Domains в SLM Advanced
status: draft
normative: true
overlay: advanced
base: slm
---

# Domains в SLM Advanced

> Overlay: `SLM Advanced`. Base: [SLM](../../index.md).

Domain является законченным вертикальным product module с одной предметной ответственностью и явным public boundary. Кроме base-правил modules и segments, Advanced не предписывает обязательную внутреннюю архитектуру domain.

## Domain и group

**SLM-ADV-DOM-001 - ОБЯЗАН.** Конечный domain должен располагаться непосредственно в `domains` или внутри одной или нескольких навигационных groups.

```text
domains/{domain}
domains/{group}/{domain}
domains/{group}/{nested-group}/{domain}
```

**SLM-ADV-DOM-002 - ОБЯЗАН.** Узел domain tree с собственным public API, state, integration или runtime должен классифицироваться как конечный domain, а не domain group.

```text
domains/
├── navigation/               # domain
└── knv/                      # group
    ├── auth/                 # domain
    ├── user/                 # domain
    └── orders/               # domain
```

**SLM-ADV-DOM-003 - ОБЯЗАН.** Первой архитектурной единицей в group tree является конечная папка, владеющая самостоятельной product responsibility.

## Ownership

**SLM-ADV-DOM-004 - ОБЯЗАН.** Domain должен владеть одной сформулированной product responsibility и предоставлять её внешним consumers через собственный public API.

Domain может владеть:

- product model и value objects;
- scenarios и operations;
- domain state и transitions;
- normalization и product errors;
- product source integration;
- framework hooks и UI одного domain;
- runtime-specific setup.

**SLM-ADV-DOM-005 - ЗАПРЕЩЕНО.** Domain не может владеть framework route entry, page/layout composition, UI нескольких самостоятельных product responsibilities, universal technical capability или product-agnostic UI primitive.

## Структура

```text
domains/knv/auth/
├── hooks/
├── providers/
├── services/
├── stores/
├── mappers/
├── types/
├── ui/
├── parts/
└── index.ts
```

Это пример, а не обязательный scaffold. Небольшой domain может состоять из одного файла и public entrypoint.

Domain может хранить файлы в корне и использовать любые необходимые segments согласно base-правилам [SLM-SEG-001 - SLM-SEG-003](../../segments.md#правила).

**SLM-ADV-DOM-006 - ЗАПРЕЩЕНО.** Нельзя создавать пустые segments или копировать полную структуру другого domain без текущей ответственности.

**SLM-ADV-DOM-007 - МОЖЕТ.** Domain может владеть hooks, Providers, Context, services, stores, mappers, types, product UI и другими implementation units своей ответственности.

## Public API

Public boundary Advanced domain следует base-правилам `SLM-API-001` и `SLM-API-002`.

**SLM-ADV-DOM-009 - МОЖЕТ.** Public API domain может экспортировать выбранные командой hooks, Providers, Context, components, service APIs, store access APIs и types как стабильный contract.

**SLM-ADV-DOM-010 - ЗАПРЕЩЕНО.** Если product responsibility получила domain owner, app, composition или infra не могут создавать параллельную модель этой ответственности либо обходить её public boundary.

## Dependencies

```text
composition -> domain
domain -> domain | infra | ui | shared
```

**SLM-ADV-DOM-011 - МОЖЕТ.** Domain может runtime-импортировать public API другого Advanced domain.

**SLM-ADV-DOM-012 - МОЖЕТ.** Domain может напрямую использовать public API `infra`, `ui` и `shared` без обязательной промежуточной abstraction.

Runtime cycles запрещены base-правилом `SLM-API-016`.

**SLM-ADV-DOM-013 - ЗАПРЕЩЕНО.** Type-only dependency cycle между domains запрещён, даже если runtime graph остаётся ацикличным.

## Data flow

```text
composition
  -> domain public API
  -> domain hook/service
  -> infra
  -> external source
```

**SLM-ADV-DOM-014 - ОБЯЗАН.** Product consumers за пределами domain должны получать его данные и поведение через public API domain, а не повторять тот же integration flow напрямую через `infra`.

## Product UI

**SLM-ADV-DOM-015 - МОЖЕТ.** Product UI одной domain responsibility может принадлежать этому domain.

UI нескольких самостоятельных responsibilities остаётся в `compositions` согласно base-правилу `SLM-CMP-006`.

## Monorepo boundary

**SLM-ADV-DOM-016 - ОБЯЗАН.** Advanced domain должен оставаться внутри `apps/{app}/src/domains` до принятия отдельной package-модели.

**SLM-ADV-DOM-017 - ЗАПРЕЩЕНО.** Workspace package не может называться Advanced Domain для целей Specification, если он не соответствует application path и ownership этой главы.
