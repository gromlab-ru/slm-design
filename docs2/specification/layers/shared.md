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

**SLM-SHR-001 - ОБЯЗАН.** Результат shared utility должен определяться явными аргументами и не зависеть от скрытого runtime environment.

**SLM-SHR-002 - ЗАПРЕЩЕНО.** `shared` не может импортировать `app`, `compositions`, `domains`, `infra` или `ui`.

**SLM-SHR-003 - ЗАПРЕЩЕНО.** `shared` не может владеть product types, domain rules, runtime state, I/O, storage access или event subscriptions.

**SLM-SHR-004 - ЗАПРЕЩЕНО.** Нельзя переносить domain helper, DTO, adapter contract или product config в `shared` для обхода import boundary.

**SLM-SHR-005 - СЛЕДУЕТ.** Код следует поднимать в `shared` только при подтверждённой product-agnostic semantics, а не из-за повторения нескольких строк.

## Отличие от других слоёв

| Код | Владелец |
|---|---|
| Domain email validator с product rules | `domains/{domain}/business` |
| Generic string trim utility | `shared` |
| Browser storage wrapper | `infra` |
| Domain storage adapter | `domains/{domain}/adapters` |
| UI spacing tokens | `shared` |
| Button consuming spacing tokens | `ui` |
