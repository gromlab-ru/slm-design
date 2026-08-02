# Открытые вопросы Level 2

> Эти вопросы не являются правилами и не отменяют зафиксированные границы.

## Зафиксированные решения

- Level 1 является общей базой, а Level 2 применяется отдельно к выбранным предметным областям.
- Доменный модуль Level 1 и доменный пакет Level 2 могут постоянно сосуществовать в одном SLM root.
- Одна предметная область имеет только одну форму.
- Корень package содержит только metadata, модуль `api` и допустимые Groups и не имеет executable API.
- Модуль `api` является единственным семантическим шлюзом данных и операций домена.
- Публичные фасеты разделяют consumer types, implementer ports, factories и optional deterministic runtime.
- Каждый Domain API имеет одну factory; production factories импортируют только assemblies своего домена.
- Dependency ports принадлежат `api`, а production adapters являются отдельными modules Group `adapters`.
- Provider errors проходят через closed port failures и преобразуются в stable domain errors.
- Каждый package содержит `assemblies/default` для одного baseline production context.
- Имя `default` не определяет environment или isomorphic compatibility.
- Дополнительная assembly появляется только для отличающегося graph, dependencies, trust, capabilities или lifecycle.
- Framework bindings владеют state, cache, reactivity и hydration и не обращаются к предметному external source в обход Domain API.
- Server и client используют разные API instances и caches; через RSC boundary проходят только serializable values.
- Realtime transport скрыт adapter, а messages и subscriptions доступны через Domain API.
- Realtime port объявляет correlation, ACK, ordering, duplicate, reconnect, resync, cancellation и cleanup semantics.
- Assembly rollback выполняет cleanup собственных resources и полученных adapter lifecycle handles; successful aggregate cleanup идемпотентен и прекращает callbacks.
- Cross-domain Domain API является отдельной runtime dependency, а не автоматически local port.
- Runtime assembly graph остаётся ацикличным.

## Канал ошибок

Нужно выбрать project-wide recommendation между exceptions и discriminated `Result`, определить форму cancellation и unexpected failures, а также сериализацию domain errors через RPC и Server Actions.

Архитектурная цепочка provider failure → port failure → domain error от выбора канала не зависит.

## Port semantics

Нужно определить минимальный machine-readable способ объявлять behavioral guarantees ports: timeout, retry, cancellation, idempotency, ordering, concurrency и subscription cleanup.

Не все ports требуют все поля, но существенная для корректности semantics не должна существовать только в комментарии adapter implementation.

## Environment metadata

Нужно выбрать формат для capability sets, resolver conditions, executable edges, framework reference edges, dynamic imports и API-safe package declarations.

Особенно требуется проверить Next.js RSC, Server Actions, edge runtime, workers и conditional exports внешних packages.

## Runtime dependency graph

Нужно выбрать machine-readable формат assembly inputs и создаваемых API, чтобы автоматически обнаруживать runtime cycles, скрытые static structural ports и неверный cleanup order.

До появления формата runtime graph остаётся обязательной review boundary.

## Lifecycle

Гарантии rollback, reverse cleanup, idempotence и отсутствия callbacks после disposal зафиксированы. Ещё нужно определить aggregate cleanup errors, retry failed cleanup, request abort, deadline disposal и поведение API после завершения scope.

## Hydration payload

Нужно выбрать рекомендации по versioning, schema validation, stale persisted cache, partial hydration и защите request-specific или sensitive values.

Hydration payload остаётся framework-owned и не может содержать API instance или mutable client.

## Multiple APIs и shared capabilities

Нужно проверить рекомендуемую форму для нескольких Domain API, которые используют один shared connection, transaction coordinator или framework-neutral operation context, не перенося предметную семантику в adapter или assembly.

Если independent factories не сохраняют atomicity, APIs должны объединяться; точный критерий требует дополнительных примеров.

## Framework-only SDK

Нужно проверить React/Vue SDK, которые предоставляют capability только через Provider, hook или component: payment elements, CAPTCHA, maps и identity widgets.

Зафиксировано, что binding может передать Domain API только opaque operation input и не выполняет предметную provider operation напрямую. Требуются проверочные примеры для `infra` + `ui` + composition.

## Масштаб production graph

Нужно проверить lazy и route-scoped сборку на SLM root с десятками Level 2 packages. Импорт assemblies остаётся side-effect-free, а graph owner создаёт только dependency-connected часть graph; конкретный registry или lazy-loading mechanism пока не нормирован.
