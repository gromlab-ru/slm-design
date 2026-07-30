# SLM Level 3

> Статус: рабочий черновик. Документы в этой папке не являются спецификацией.

Level 3 предназначен для приложений с существенной доменной логикой, несколькими execution contexts или длительным сроком поддержки. Он не добавляет новый слой: он делает внутреннюю форму слоя `domains` явной и проверяемой.

## Когда выбирать Level 3

Level 3 оправдан, когда предметная область имеет устойчивый business contract, несколько concrete integrations, отдельные browser/request/server assemblies, сложный lifecycle или независимую долгую поддержку.

Количество файлов или размер проекта сами по себе не требуют перехода. Домен без такой сложности остаётся доменным модулем Level 2.

## Наследование предыдущих уровней

Проект Level 3 соблюдает определения и правила Levels 1-2, кроме явно заменённых положений.

| Положение | Статус в Level 3 |
|---|---|
| Порядок `app → compositions → domains → infra → ui → shared` | Сохраняется |
| Модуль, Group, segment, component, public API и lifecycle | Сохраняют смысл Level 1 |
| Доменный модуль Level 2 и [`SLM-L2-DOMAIN-R001`](../rules/level-2.md#slm-l2-domain-r001) | Заменяются Domain Level 3 |
| Group внутри `domains` | Может содержать Domain, оставаясь только навигационной папкой |
| Прямые дочерние modules Domain | Не являются вложенными modules, потому что Domain не является module |

Domain не содержит исполняемого кода, поэтому не отменяет правило Level 1 о модульном владельце. Он задаёт предметную границу; конкретной ответственностью, public API и lifecycle по-прежнему владеет module.

## Основная идея

```text
Domain задаёт предметную границу.
Business определяет contract и поведение.
Ports описывают нужные business capabilities.
Adapters связывают ports с concrete runtime.
Presets собирают API для execution scope.
Framework module адаптирует готовый API к framework.
Graph owner удерживает API instance и выполняет lifecycle contract module-владельца.
```

## Базовая форма Domain

```text
src/domains/
└── auth/                         # Domain
    ├── business/                 # обязательный module
    │   ├── errors/
    │   ├── lib/
    │   ├── ports/
    │   ├── services/
    │   ├── types/
    │   └── index.ts
    ├── presets/                  # optional Group
    │   └── application/          # preset module
    │       ├── adapters/
    │       └── index.ts
    ├── adapters/                 # optional Group
    │   └── identity-provider/    # promoted adapter module
    │       └── index.ts
    └── react/                    # framework module
        ├── hooks/
        ├── providers/
        └── index.ts
```

`business` обязателен. `presets`, `adapters` и framework modules появляются только при реальной ответственности. `types`, `errors`, `lib`, `services`, `tests`, `ui`, `client` и `server` не являются самостоятельными корневыми ветками Domain.

Domain может быть размещён непосредственно в `domains` или внутри навигационной Group. Groups допустимы, но не участвуют в основных примерах и не меняют границы Domain, направление зависимостей или доступность его role modules.

## Публичные границы

Domain не имеет root runtime entrypoint. Внешний код импортирует public API конкретного role module:

```ts
import { authFactory, isAuthError } from '@/domains/auth/business'
import { createApplicationAuth } from '@/domains/auth/presets/application'
import { AuthProvider, useAuth } from '@/domains/auth/react'
```

`@/domains/auth/business` является public API отдельного module, а не deep import. Напротив, `@/domains/auth/business/services/...` и root import `@/domains/auth` нарушают границу.

## Карта черновика

- [Терминология](./terminology.md)
- [Граница Domain](./domains/domain.md)
- [Business module](./domains/business.md)
- [Factory, ports и adapters](./domains/factory-ports-adapters.md)
- [Presets и SSR](./domains/presets.md)
- [React module](./domains/framework-bindings.md)
- [Зависимости](./dependencies.md)
- [Тестирование](./domains/testing.md)
- [Проверка](./validation.md)
- [Auth как пример миграции](./domains/auth-example.md)
- [Открытые вопросы](./domains/open-questions.md)

## Канонические правила

Level 3 использует правила Levels 1-2 и [дополнительный реестр Level 3](../rules/level-3.md). Тематические документы объясняют правила, но не объявляют их повторно.
