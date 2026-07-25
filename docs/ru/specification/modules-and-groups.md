---
title: Модули и группы
status: draft
normative: true
---

# Модули и Группы

## Module

Module является минимальным самостоятельным владельцем ответственности и предоставляет public boundary внешнему коду.

**SLM-BASE-MOD-001 - ОБЯЗАН.** Module должен иметь одну сформулированную ответственность и одного архитектурного owner.

**SLM-BASE-MOD-002 - ОБЯЗАН.** Внешний consumer взаимодействует с module только через его public API.

**SLM-BASE-MOD-003 - СЛЕДУЕТ.** Module следует ограничивать только теми внутренними parts и segments, которые необходимы текущей ответственности.

Типичные modules:

- page, layout, screen или widget в `compositions`;
- technical service в `infra`;
- reusable UI module в `ui`.

`app` содержит framework entries и не обязан организовываться как SLM modules. `shared` может содержать небольшие public units, но не runtime modules.

## Group

Group классифицирует modules и другие groups, но не владеет поведением.

**SLM-BASE-MOD-004 - ЗАПРЕЩЕНО.** Group не может иметь `index.ts`, public API, state, runtime, dependencies или assembly.

**SLM-BASE-MOD-005 - ЗАПРЕЩЕНО.** Внешний код не может импортировать group path.

**SLM-BASE-MOD-006 - МОЖЕТ.** Group может содержать другие groups и конечные modules.

```text
compositions/
└── pages/               # group
    ├── home/            # composition module
    └── profile/         # composition module
```

## Component

Component является presentation unit внутри module и не считается самостоятельным архитектурным owner.

**SLM-BASE-MOD-008 - ЗАПРЕЩЕНО.** Component не может самостоятельно выбирать application-level product source, выполнять module wiring или оркестрировать несколько самостоятельных modules.

**SLM-BASE-MOD-009 - МОЖЕТ.** Component может владеть локальной presentation mechanics и рендерить другие components, разрешённые слоем владельца.

**SLM-BASE-MOD-010 - ОБЯЗАН.** Presentation unit с самостоятельной ответственностью, внешними архитектурными dependencies или внутренней modular structure должна оформляться как module или nested module. Сам факт локального hook/state не делает component модулем.

## Nested module

Самостоятельная часть родительского module может быть оформлена nested module, если имеет собственную ответственность и public boundary только внутри родителя.

```text
compositions/pages/home/
└── parts/
    └── hero-section/
        ├── hero-section.tsx
        └── index.ts
```

**SLM-BASE-MOD-011 - ЗАПРЕЩЕНО.** Nested module не может использоваться для сокрытия ответственности, которой фактически владеет другой module или layer.

## Scope evolution

**SLM-BASE-MOD-012 - СЛЕДУЕТ.** Код следует поднимать из локального owner в более широкий module только после появления реального совместного consumer или общей ответственности.

**SLM-BASE-MOD-013 - ЗАПРЕЩЕНО.** Физическое повторение само по себе не доказывает общий ownership.
