---
title: Модули и группы
status: draft
normative: true
---

# Модули и Группы

## Module

Module является минимальным самостоятельным владельцем ответственности и предоставляет public boundary внешнему коду.

**SLM-MOD-001 - ОБЯЗАН.** Module должен иметь одну сформулированную ответственность и одного архитектурного owner.

**SLM-MOD-002 - ОБЯЗАН.** Внешний consumer взаимодействует с module только через его public API.

**SLM-MOD-003 - СЛЕДУЕТ.** Module следует ограничивать только теми внутренними parts и segments, которые необходимы текущей ответственности.

Типичные modules:

- page, layout, screen или widget в `compositions`;
- конечный domain в `domains`;
- technical service в `infra`;
- reusable UI module в `ui`.

`app` содержит framework entries и не обязан организовываться как SLM modules. `shared` может содержать небольшие public units, но не runtime modules.

## Group

Group классифицирует modules и другие groups, но не владеет поведением.

**SLM-MOD-004 - ЗАПРЕЩЕНО.** Group не может иметь `index.ts`, public API, state, runtime, dependencies или assembly.

**SLM-MOD-005 - ЗАПРЕЩЕНО.** Внешний код не может импортировать group path.

**SLM-MOD-006 - МОЖЕТ.** Group может содержать другие groups и конечные modules.

```text
domains/
└── knv/                 # group
    ├── auth/            # domain module
    └── orders/          # domain module
```

```text
compositions/
└── pages/               # group
    ├── home/            # composition module
    └── profile/         # composition module
```

## Domain zones

**SLM-MOD-007 - ОБЯЗАН.** `business`, `react`, `adapters`, `client` и `server` внутри конечного domain являются внутренними zones одного domain, а не самостоятельными верхнеуровневыми modules.

Zones могут иметь собственные entrypoints, но domain остаётся единым владельцем product responsibility.

## Component

Component является presentation unit внутри module и не считается самостоятельным архитектурным owner.

**SLM-MOD-008 - ЗАПРЕЩЕНО.** Component не может самостоятельно выбирать product source, собирать domain runtime или оркестрировать несколько modules.

**SLM-MOD-009 - МОЖЕТ.** Component может владеть локальной presentation mechanics и рендерить другие components, разрешённые слоем владельца.

**SLM-MOD-010 - ОБЯЗАН.** Presentation unit с самостоятельной ответственностью, внешними архитектурными dependencies или внутренней modular structure должна оформляться как module или nested module. Сам факт локального hook/state не делает component модулем.

## Nested module

Самостоятельная часть родительского module может быть оформлена nested module, если имеет собственную ответственность и public boundary только внутри родителя.

```text
compositions/pages/home/
└── parts/
    └── hero-section/
        ├── hero-section.tsx
        └── index.ts
```

**SLM-MOD-011 - ЗАПРЕЩЕНО.** Nested module не может использоваться для сокрытия ответственности, которой фактически владеет другой слой или domain.

## Scope evolution

**SLM-MOD-012 - СЛЕДУЕТ.** Код следует поднимать из локального owner в более широкий module только после появления реального совместного consumer или общей ответственности.

**SLM-MOD-013 - ЗАПРЕЩЕНО.** Физическое повторение само по себе не доказывает общий ownership.
