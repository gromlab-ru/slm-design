# Домены Level 3

> Пояснение строгой внутренней архитектуры Domain.

Level 3 превращает доменный module Level 2 в Domain: немодульную предметную границу с несколькими modules разных технических ролей. Это не новый слой и не обязательный scaffold для каждого проекта.

## Связанные правила

- [`SLM-L3-DOMAIN-R001`](../../rules/level-3.md#slm-l3-domain-r001)
- [`SLM-L3-DOMAIN-A002`](../../rules/level-3.md#slm-l3-domain-a002)
- [`SLM-L3-BUSINESS-R003`](../../rules/level-3.md#slm-l3-business-r003)
- [`SLM-L1-MODULE-A004`](../../rules/level-1.md#slm-l1-module-a004)

## Роли внутри Domain

```text
Business определяет поведение и contract.
Ports описывают runtime capabilities business.
Adapters реализуют ports поверх concrete runtime.
Presets собирают API для execution context.
React module адаптирует готовый API к React.
Graph owner удерживает конкретный instance и выполняет lifecycle contract module-владельца.
```

| Роль | Структурный вид | Когда появляется |
|---|---|---|
| `business` | Обязательный module | Всегда |
| Preset | Module внутри `presets` | Нужна повторяемая assembly |
| Adapter | Private segment preset или module внутри `adapters` | Нужна concrete integration |
| `react` | Framework module непосредственно в Domain | Domain имеет React integration |

## Форма Domain

```text
domains/auth/
├── business/
│   ├── errors/
│   ├── lib/
│   ├── ports/
│   ├── services/
│   ├── types/
│   └── index.ts
├── presets/
│   └── application/
│       ├── adapters/
│       └── index.ts
├── adapters/
│   └── identity-provider/
│       └── index.ts
└── react/
    ├── hooks/
    ├── providers/
    └── index.ts
```

`business` обязателен; остальные ветки появляются по необходимости. `presets` и `adapters` являются Groups без собственного runtime/API. `errors`, `lib`, `ports`, `services`, `types`, `hooks` и `providers` являются segments соответствующих module-владельцев.

Navigation Groups в слое `domains` допустимы, но не являются Domain и не изменяют его import boundary. Основные примеры Level 3 намеренно показывают Domain непосредственно в `domains`.

## Public API modules

Domain root не имеет `index.ts` и не реэкспортирует роли. Внешний consumer использует только public entrypoint нужного module:

```ts
import { authFactory, type AuthApi } from '@/domains/auth/business'
import { createApplicationAuth } from '@/domains/auth/presets/application'
import { AuthProvider, useAuth } from '@/domains/auth/react'
```

Private adapter внутри `presets/application/adapters` не получает external entrypoint. Promoted adapter module получает собственный API для modules Domain; доступ за пределами Domain допускается только как явно объявленная integration extension point.

## Карта раздела

- [Граница Domain](./domain.md)
- [Business module](./business.md)
- [Factory, ports и adapters](./factory-ports-adapters.md)
- [Presets и SSR](./presets.md)
- [React module](./framework-bindings.md)
- [Тестирование](./testing.md)
- [Auth как пример миграции](./auth-example.md)
- [Открытые вопросы](./open-questions.md)
