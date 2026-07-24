---
title: Слои
status: draft
normative: true
---

# Слои

Слой определяет вид ответственности, допустимые зависимости и типы modules внутри верхнеуровневой папки `src`.

## Матрица ответственности

| Слой | Владеет | Не владеет |
|---|---|---|
| [`app`](./app.md) | Framework routes, bootstrap, глобальные framework boundaries | Product UI, domain logic, page state, graph assembly |
| [`compositions`](./compositions.md) | Pages, layouts, screens, widgets, cross-domain graph, scope | Domain model, domain adapters, universal UI primitives |
| [`domains`](./domains/index.md) | Product model, scenarios, ports, adapters, runtime surfaces | Route/page composition и UI нескольких domains |
| [`infra`](./infra.md) | Technical services, transports, platform integrations | Product semantics и domain graph |
| [`ui`](./ui.md) | Product-agnostic UI modules | Product scenarios и data sources |
| [`shared`](./shared.md) | Детерминированные общие resources | Runtime state, I/O и product knowledge |

## Общие правила

**SLM-LAY-001 - ОБЯЗАН.** Модуль должен располагаться в слое, который владеет его основной ответственностью.

**SLM-LAY-002 - ЗАПРЕЩЕНО.** Нельзя выбирать слой по техническому типу файла без определения владельца поведения и данных.

**SLM-LAY-003 - ОБЯЗАН.** Межслойный import должен одновременно соответствовать общей dependency direction и public API импортируемого module.

**SLM-LAY-004 - ЗАПРЕЩЕНО.** Нельзя создавать proxy module в разрешённом слое только для обхода запрещённого направления import.

**SLM-LAY-005 - СЛЕДУЕТ.** При смешанной ответственности module следует разделить по реальным владельцам. Cross-module и cross-domain orchestration следует выполнить в `compositions`; связь business с собственными adapters выполняется assembly соответствующего domain.

## Выбор слоя

| Вопрос | Слой |
|---|---|
| Код существует только из-за framework route/bootstrap? | `app` |
| Код собирает page, route, несколько modules или domains? | `compositions` |
| Код выражает продуктовую модель, сценарий или domain UI? | `domains` |
| Код предоставляет техническую capability приложения? | `infra` |
| Компонент не содержит product semantics и сценария? | `ui` |
| Код детерминирован, не знает продукт и не имеет runtime state? | `shared` |
