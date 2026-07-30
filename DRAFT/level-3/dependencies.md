# Зависимости Level 3

> Уточнение графа зависимостей Level 2 внутри Domain.

## Связанные правила

- [`SLM-L3-BUSINESS-A004`](../rules/level-3.md#slm-l3-business-a004)
- [`SLM-L3-DEPENDENCY-R011`](../rules/level-3.md#slm-l3-dependency-r011)
- [`SLM-L3-ENVIRONMENT-A012`](../rules/level-3.md#slm-l3-environment-a012)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

## Направление внутри Domain

| Исходный role module | Допустимые зависимости |
|---|---|
| `business` | Собственные segments, нейтральный `shared`, ограниченные type-only contracts другого business module |
| Adapter | Business contracts, `infra`, concrete runtime и neutral `shared` |
| Preset | Business factory/contracts, private или promoted adapters |
| `react` | Business contracts, готовый business API и React runtime |
| Composition graph owner | Public preset, framework module и готовые API instances |

Business не импортирует adapters, presets, framework modules, `infra`, product SDK, storage, framework runtime, browser/Node API или environment configuration. Adapter не импортирует preset или framework module. Preset не импортирует framework module.

## Междоменные зависимости

Business одного Domain не создаёт factory другого Domain и не вызывает другой Domain runtime API напрямую. Если `orders` нужна capability авторизации, `orders/business` описывает собственный минимальный port, а graph owner передаёт реализацию над уже собранным `AuthApi`.

```text
Auth preset
  → AuthApi
  → orders assembly
  → OrdersApi
```

Type-only import public business contract другого Domain допустим только при реальной ацикличной зависимости. Он не даёт права вызвать другой Domain runtime API. Direct runtime import даже pure function не является обходом port boundary: независимое общее правило должно принадлежать `shared`, а предметная capability передаётся через port.

## Environment boundaries

Server-only preset или adapter получает отдельный public entrypoint и framework/build marker. Он не реэкспортируется через `business`, `react`, client-compatible preset или root Domain.

```text
business               # isomorphic
presets/application    # client-compatible, если выбранные adapters совместимы
presets/request        # server-only
react                  # client framework module
```

Путь `server/` или `client/` сам по себе ничего не доказывает. Проверяется transitive import graph entrypoint.
