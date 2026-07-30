# Открытые вопросы Level 2

> Эти вопросы не являются правилами и не отменяют зафиксированные границы.

## Зафиксированные решения

- Level 1 включает слой `domains` и простые доменные модули.
- Level 2 заменяет доменный модуль доменным пакетом.
- Корень пакета содержит только metadata, модули и Groups и не имеет executable API.
- `business` предоставляет одну фабрику и один `DomainApi`.
- Приложение получает доменные данные, состояние и результаты только через `DomainApi`.
- Каждый `business` экспортирует коды, тип и runtime guard доменных ошибок.
- Ожидаемые ошибки adapters и других доменов не пересекают API текущего домена.
- Количество presets определяется реальными окружениями; универсальный preset не обязателен.
- Runtime cross-domain imports запрещены; type-only business contracts разрешены и входят в DAG.
- Framework Group называется по фреймворку и содержит самостоятельные SLM-модули.
- Cross-domain framework state, hooks, contexts и components не импортируются.

## Владение состоянием

Нужно определить создание initial state, применение transitions, persistence и внешний event input. Нормативным уже является только то, что приложение читает состояние через `DomainApi`, но точная граница между business state machine и storage adapter пока не выбрана.

Отдельно требуется проверить SSR snapshot, hydration, concurrent rendering, reset и поведение после завершения request scope.

## Передача ошибок

Нужно выбрать общую политику exception или discriminated `Result`, определить cancellation и unexpected failures, а также сериализацию ошибок через RPC и server actions.

Для exception-модели отдельно нужно определить, как зависимый business отличает ожидаемую ошибку другого домена без runtime-импорта его guard: через переданный discriminator, wrapper места сборки или другой явный контракт.

## Технические порты

Нужно определить, является ли consumer-owned port обязательной формой каждой технической зависимости и какие behavioral guarantees он обязан описывать: timeout, retry, cancellation, idempotency, ordering, concurrency и subscription cleanup.

Cross-domain `Pick<OtherDomainApi>` уже зафиксирован как отдельный вид API dependency и не зависит от этого решения.

## Lifecycle сборки

Нужно определить контракты `start` и `dispose`, async cleanup, rollback частичного старта, repeated disposal, request abort и поведение API после завершения scope. До решения применяется только общее владение lifecycle Level 1.

## Автоматическая проверка

Нужно выбрать machine-readable формат для domain packages, metadata, модулей, Groups, entry points, environment labels и запрещённых транзитивных импортов.
