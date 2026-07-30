# Открытые вопросы Level 2

> Эти вопросы не являются правилами и не отменяют зафиксированные границы.

## Зафиксированные решения

- Level 1 является общей базой, а Level 2 применяется отдельно к выбранным предметным областям.
- Доменный модуль Level 1 и доменный пакет Level 2 могут постоянно сосуществовать в одном SLM root.
- Одна предметная область имеет только одну форму.
- Корень пакета содержит только metadata, модуль `business` и допустимые Groups и не имеет executable API.
- `business` может объявлять несколько независимо собираемых Domain API и одну фабрику для каждого API.
- Публичный API `business` имеет обязательные type-only `business` и runtime `business/factory`, а также необязательный deterministic `business/runtime`.
- Приложение получает предметную модель, transitions и результаты через Domain API; technical и framework cache могут хранить и проецировать эти значения.
- Ожидаемые ошибки adapters и других доменов не пересекают API текущего домена в исходной форме.
- Каждый доменный пакет содержит минимум одну assembly; универсальная изоморфная assembly не обязательна.
- Assembly может создавать именованный граф нескольких API и не добавляет к ним сценарии.
- При наличии технических зависимостей Group `adapters` обязательна, а каждая связная production implementation принадлежит adapter-модулю.
- Runtime cross-domain imports через пакетную границу разрешены только из `business/runtime`; type-only public contracts разрешены и входят в DAG.
- Framework Group называется по фреймворку и содержит самостоятельные SLM-модули.
- Cross-domain framework state, hooks, contexts и components не импортируются.
- Clock, timer, random, ID generator и environment являются явными dependencies business.
- Assembly без собственного lifecycle-ресурса не обязана возвращать пустой `dispose`.

## Владение состоянием

Нужно подробнее определить создание initial state, применение transitions, persistence и внешний event input. Нормативным уже является то, что предметную модель и переходы определяет `business`, а concrete state manager реализует business-owned port либо framework projection.

Отдельно требуется проверить SSR snapshot, hydration, concurrent rendering, reset и поведение после завершения request scope.

## Передача ошибок

Нужно выбрать общую рекомендацию exception или discriminated `Result`, определить cancellation и unexpected failures, а также сериализацию ошибок через RPC и server actions.

Структура публичных фасетов от этого решения больше не зависит: type errors публикуются через `business`, а необходимые runtime codes и guards через опциональный `business/runtime`.

## Технические порты

Нужно определить, является ли consumer-owned port обязательной формой каждой технической зависимости и какие behavioral guarantees он описывает: timeout, retry, cancellation, idempotency, ordering, concurrency и subscription cleanup.

Cross-domain API dependency уже зафиксирована как отдельный вид зависимости и не зависит от этого решения.

## Lifecycle сборки

Уже зафиксировано, что явная операция, запускающая ресурс, возвращает cleanup, а assembly с собственным ресурсом предоставляет cleanup handle результата. Ещё нужно определить async cleanup, rollback частичной сборки, repeated disposal, request abort и поведение API после завершения scope.

## Cache hydration

Нужно проверить единый способ разделять framework-neutral cache policy, client hooks, server prefetch и serialization boundary без утечки query-library types в Domain API.

## Автоматическая проверка

Нужно выбрать machine-readable формат для форм домена, metadata, модулей, Groups, entry points, environment labels и запрещённых транзитивных импортов.
