# Открытые вопросы Level 3

> Эти вопросы не являются правилами и не отменяют уже принятые границы.

## Зафиксированные решения

- Domain является сущностью только Level 3; в Level 2 предметная область остаётся одним domain module.
- Domain root не имеет общего runtime barrel.
- Framework module называется именем framework и размещается непосредственно в Domain: `domains/auth/react`.
- Framework module получает готовый API и не выполняет assembly.
- Runtime-взаимодействие business разных Domains проходит через consumer-owned port и graph owner.
- Navigation Groups допустимы в `domains`, но не являются частью базовых примеров.

## Failure transport

Level 3 требует stable domain failure contract, но не навязывает проекту единый transport: exception с domain-specific runtime guard или discriminated `Result`. Нужно проверить, нужна ли общая политика для всех Domain одного приложения и как она влияет на server actions/RPC serialization.

## Reactive state protocol

Нужно проверить на реальном SSR/hydration кейсе точную форму framework-neutral observation protocol: initial snapshot, concurrent rendering, invalidation, subscription cleanup и поведение после request boundary. `getSnapshot` и `subscribe` пока являются базовой иллюстрацией, а не обязательной файловой формой.

## Architecture lint

Нужно выбрать формат project configuration для автоматической проверки Domain roots, role modules, public entrypoints, environment labels и запрещённых transitive imports. Проверка должна опираться на graph и metadata, а не только на имена папок.
