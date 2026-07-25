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
| [`app`](./app.md) | Framework routes, bootstrap, глобальные framework boundaries | Product UI, product logic, page state, application wiring |
| [`compositions`](./compositions.md) | Pages, layouts, screens, widgets, product flows, application wiring и scope | Universal UI primitives, technical transports |
| [`infra`](./infra.md) | Technical services, transports, platform integrations | Product semantics и application wiring |
| [`ui`](./ui.md) | Product-agnostic UI modules | Product scenarios и data sources |
| [`shared`](./shared.md) | Детерминированные общие resources | Runtime state, I/O и product knowledge |

## Общие правила

**SLM-BASE-LAY-001 - ОБЯЗАН.** Module должен располагаться в слое, который владеет его основной ответственностью.

**SLM-BASE-LAY-002 - ЗАПРЕЩЕНО.** Нельзя выбирать слой по техническому типу файла без определения владельца поведения и данных.

**SLM-BASE-LAY-003 - ОБЯЗАН.** Межслойный import должен одновременно соответствовать общей dependency direction и public API импортируемого module.

**SLM-BASE-LAY-004 - ЗАПРЕЩЕНО.** Нельзя создавать proxy module в разрешённом слое только для обхода запрещённого направления import.

**SLM-BASE-LAY-005 - СЛЕДУЕТ.** При смешанной ответственности module следует разделить по реальным владельцам. Application flow и UI нескольких самостоятельных modules следует собирать в `compositions`.

## Выбор слоя

| Вопрос | Слой |
|---|---|
| Код существует только из-за framework route/bootstrap? | `app` |
| Код собирает page, route или несколько самостоятельных modules? | `compositions` |
| Код выражает product flow или product responsibility без owner, введённого overlay? | `compositions` |
| Код предоставляет technical capability приложения? | `infra` |
| Компонент не содержит product semantics и scenario? | `ui` |
| Код детерминирован, не знает продукт и не имеет runtime state? | `shared` |

Overlay может добавлять собственный слой и изменять ownership только в явно объявленном delta.
