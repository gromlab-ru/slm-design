# Граница Domain

> Пояснение предметной и структурной границы Level 3.

## Связанные правила

- [`SLM-L3-DOMAIN-R001`](../../rules/level-3.md#slm-l3-domain-r001)
- [`SLM-L3-DOMAIN-A002`](../../rules/level-3.md#slm-l3-domain-a002)
- [`SLM-L3-BUSINESS-R003`](../../rules/level-3.md#slm-l3-business-r003)
- [`SLM-L1-MODULE-R011`](../../rules/level-1.md#slm-l1-module-r011)
- [`SLM-L1-GROUP-R007`](../../rules/level-1.md#slm-l1-group-r007)

## Предметная граница

Domain представляет одну связную предметную область: `auth`, `catalog`, `orders` или `checkout`. Он собирает её business contract, concrete integrations, повторяемые assemblies и framework bindings, но не становится большим module со смешанными ролями.

Domain является предметной границей, а не владельцем runtime-кода в смысле Level 1. Каждый scenario, adapter, preset и framework binding остаётся ответственностью конкретного module. Такое разделение позволяет одной области иметь несколько public module APIs без нарушения правила о единственном владельце ответственности.

## Структурные виды и роли

| Путь | Роль | Структурный вид |
|---|---|---|
| `domains/auth` | Предметная область Auth | Domain |
| `domains/auth/business` | Business | Module |
| `domains/auth/business/ports` | Business capabilities | Segment |
| `domains/auth/presets` | Навигация assemblies | Group |
| `domains/auth/presets/application` | Application preset | Module |
| `domains/auth/presets/application/adapters` | Private integrations preset | Segment |
| `domains/auth/adapters` | Навигация promoted adapters | Group |
| `domains/auth/adapters/identity-provider` | Reusable adapter | Module |
| `domains/auth/react` | React binding | Module |

Role отвечает на вопрос, что делает код. Structural kind отвечает на вопрос, какую архитектурную границу он образует. Имя папки само по себе не доказывает ни роль, ни structural kind.

## Корень Domain

Корень Domain не содержит реализацию, state, lifecycle resources, `index.ts` или общий barrel. Его прямыми детьми могут быть `business`, Groups `presets` и `adapters`, а также framework modules с именем framework, например `react`.

Не создаются автоматически корневые ветки `model`, `types`, `errors`, `lib`, `ui`, `client`, `server` или `tests`. Такая ветка должна либо быть segment module-владельца, либо иметь самостоятельную module responsibility, выраженную одной из ролей Domain.

## Публичная граница

```text
@/domains/auth/business
@/domains/auth/presets/application
@/domains/auth/react
```

Эти пути являются public API role modules. Root path `@/domains/auth` не существует как runtime boundary. Он не должен объединять isomorphic business, client React и server-only preset через `export *`.

## Граница с другими слоями

| Ответственность | Владелец |
|---|---|
| Business scenarios, contracts, state semantics и errors | `domains/auth/business` |
| Concrete adapter одной assembly | Segment соответствующего preset |
| Reusable auth integration | Promoted adapter module |
| Повторяемая assembly `AuthApi` | Preset module |
| React provider, hook и domain-specific React UI | `domains/auth/react` |
| Page, route, redirect, screen и конкретный visual outcome | Module `compositions` |
| SDK wrapper или технический сервис без Auth semantics | Module `infra` |

Framework dependency сама по себе не делает UI частью Domain. Component принадлежит `react` только когда он работает с domain contract и не определяет page, route или product composition.
