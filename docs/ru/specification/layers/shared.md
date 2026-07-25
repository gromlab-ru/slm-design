---
title: Слой Shared
status: draft
normative: true
---

# Слой Shared

`shared` является детерминированным фундаментом приложения и не знает о SLM-модулях верхних слоёв.

## Допустимое содержимое

- pure utilities;
- value predicates;
- product-agnostic types;
- styling foundation и tokens;
- static resources;
- compile-time constants без product ownership;
- deterministic formatting primitives.

## Правила

**SLM-BASE-SHR-001 - ОБЯЗАН.** Результат shared utility должен определяться явными аргументами и не зависеть от скрытого runtime environment.

**SLM-BASE-SHR-002 - ЗАПРЕЩЕНО.** `shared` не может импортировать `app`, `compositions`, `infra` или `ui`.

**SLM-BASE-SHR-003 - ЗАПРЕЩЕНО.** `shared` не может владеть product types, product rules, runtime state, I/O, storage access или event subscriptions.

**SLM-BASE-SHR-004 - ЗАПРЕЩЕНО.** Нельзя переносить product helper, DTO, integration contract или product config в `shared` для обхода import boundary.

**SLM-BASE-SHR-005 - СЛЕДУЕТ.** Код следует поднимать в `shared` только при подтверждённой product-agnostic semantics, а не из-за повторения нескольких строк.

## Отличие от других слоёв

| Код | Владелец |
|---|---|
| Email validator с product rules | Владеющий product module |
| Generic string trim utility | `shared` |
| Browser storage wrapper | `infra` |
| Product storage integration | Product owner; storage primitive - `infra` |
| UI spacing tokens | `shared` |
| Button consuming spacing tokens | `ui` |
