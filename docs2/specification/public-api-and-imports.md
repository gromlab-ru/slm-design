---
title: Public API и импорты
status: draft
normative: true
---

# Public API и Импорты

Public API ограничивает знание consumers о внутренней структуре module. Точная форма entrypoint определяется владельцем и не требует обязательного `index.ts`.

## Общие правила

**SLM-API-001 - ОБЯЗАН.** Межмодульный import должен использовать объявленный public entrypoint импортируемого module.

**SLM-API-002 - ЗАПРЕЩЕНО.** Deep imports во внутренние segments, files и иные private paths другого module запрещены.

**SLM-API-003 - ОБЯЗАН.** Каждый runtime export должен иметь реального consumer за пределами владеющего entrypoint и стабильную ответственность.

**SLM-API-004 - ЗАПРЕЩЕНО.** Public API не может случайно раскрывать implementation unit, который владелец считает private или lifecycle которого не является частью public contract.

**SLM-API-005 - ОБЯЗАН.** Alias или package subpath должен физически разрешаться TypeScript, tests и production build.

**SLM-API-009 - МОЖЕТ.** Public entrypoint может быть root `index.ts`, отдельным named entry, package export или другим явно объявленным path.

**SLM-API-010 - ОБЯЗАН.** Public и private paths module должны быть различимы consumers и repository tooling.

## Layer matrix

| Importer | Runtime imports |
|---|---|
| `app` | Public composition entries, shared static/global resources |
| `compositions` | Compositions, infra, ui, shared |
| `infra` | Infra, shared |
| `ui` | UI, shared |
| `shared` | External pure libraries only |

## Type-only imports

**SLM-API-006 - МОЖЕТ.** `import type` может использоваться для разрешённого contract dependency без создания runtime edge.

**SLM-API-007 - ЗАПРЕЩЕНО.** Type-only import не разрешает перенос ownership, импорт private concrete runtime type или обход layer boundary.

## Groups

Отсутствие public entrypoint у group определяется base-правилом `SLM-MOD-004`.

**SLM-API-015 - ОБЯЗАН.** Composition public API экспортирует только entry components, access APIs, types и contracts, необходимые внешним composition consumers.

## Cycles

**SLM-API-016 - ЗАПРЕЩЕНО.** Runtime import cycle между modules запрещён независимо от того, способен ли bundler его выполнить.

**SLM-API-017 - ЗАПРЕЩЕНО.** Barrel не должен создавать скрытый cycle между ready composition и access API её children.

Дополнительные entrypoints и import restrictions принадлежат overlay, который их вводит.
