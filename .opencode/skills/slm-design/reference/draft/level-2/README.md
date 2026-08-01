# SLM Level 2

> Статус: рабочий черновик. Документы в этой папке не являются спецификацией.

Level 2 предназначен для отдельных предметных областей с устойчивыми API, несколькими способами сборки или самостоятельными framework-модулями. Он сохраняет структурную базу Level 1, но заменяет выбранный доменный модуль доменным пакетом с явными владельцами ролей.

## Наследование Level 1

Доменный пакет Level 2 соблюдает определения и правила Level 1, кроме явно заменённых положений:

| Положение Level 1 | Статус в Level 2 |
|---|---|
| Матрица `app → compositions → domains → { infra, ui } → shared` | Сохраняется |
| Модуль, Group, сегмент, компонент, публичный API и граф зависимостей | Сохраняют смысл |
| Доменный модуль и [`SLM-L1-DOMAIN-R015`](../rules/level-1.md#slm-l1-domain-r015) | Заменяются только для предметной области в пакетной форме |
| Единый публичный API модуля `business` | Представлен обязательными type-only и factory-фасетами и необязательным runtime-фасетом |
| Навигационная Group слоя `domains` | Может одновременно содержать доменные модули и пакеты |
| Group внутри доменного пакета | Содержит обычные SLM-модули и Groups |

Канонический набор требований образуют [правила Level 1](../rules/level-1.md) и [правила Level 2](../rules/level-2.md).

## Когда выбирать Level 2

Level 2 оправдан, когда одной предметной области нужны несколько независимо собираемых Domain API, разные browser/server assemblies, несколько технических интеграций или самостоятельные domain-specific модули React, Vue либо другого фреймворка.

Level 2 выбирается для конкретной предметной области. Один SLM root может корректно содержать простые доменные модули Level 1 и доменные пакеты Level 2. Размер каталога сам по себе не требует перехода.

## Цена Level 2

Пакетная форма намеренно дороже простого доменного модуля. Она добавляет отдельные business-фасеты, минимум одну assembly, явную runtime-инъекцию cross-domain API и adapter-модули для production capabilities. Concrete state/query runtime, SDK и недетерминизм не импортируются напрямую в `business`.

Эта цена оправдана независимой сборкой API, несколькими средами, строгой environment boundary или самостоятельными framework bindings. Если домену не нужны такие свойства, он остаётся модулем Level 1.

## Базовая форма

```text
src/domains/
├── catalog/                      # Доменный модуль Level 1
└── auth/                         # Доменный пакет Level 2
    ├── README.md                 # Необязательная metadata
    ├── business/                 # Обязательный SLM-модуль
    │   ├── index.ts              # Только public types
    │   ├── factory.ts            # Public factories entry
    │   └── runtime.ts            # Необязательный deterministic runtime
    ├── assemblies/               # Обязательная непустая Group
    │   ├── browser/              # SLM-модуль
    │   └── request/              # SLM-модуль
    ├── adapters/                 # При наличии technical dependencies
    │   └── identity-provider/    # SLM-модуль
    └── react/                    # Необязательная framework Group
        ├── session/              # SLM-модуль
        └── login-form/           # SLM-модуль
```

Корень пакета не является модулем и не имеет `index.ts`. Каждый исполняемый владелец внутри пакета остаётся обычным SLM-модулем со своим публичным API.

## Публичные границы

`business` может объявить несколько API и соответствующих фабрик. Assembly создаёт только нужный для своего контекста именованный граф:

```ts
import type {
  AuthAdministrationApi,
  AuthSessionApi,
} from '@/domains/auth/business'

import {
  authAdministrationFactory,
  authSessionFactory,
} from '@/domains/auth/business/factory'

import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/runtime'

import { createBrowserAuth } from '@/domains/auth/assemblies/browser'
import { AuthSessionProvider } from '@/domains/auth/react/session'
```

`business/runtime` существует только при наличии реальных внешних потребителей детерминированных runtime-экспортов. Общие импорты `@/domains/auth` и `@/domains/auth/react` запрещены: пакет и Groups не имеют агрегирующих API.

## Совместное применение форм

Простой доменный модуль и доменный пакет могут постоянно сосуществовать в одном SLM root, но одна предметная область имеет только одну форму. При связи, пересекающей границу пакета Level 2, доменный код использует type-only публичный контракт либо детерминированный `business/runtime`; готовые API передаются runtime-аргументами в месте сборки графа.

Если доменному модулю Level 1 нужна runtime-инъекция, которой его текущий публичный API не поддерживает, этот потребитель рефакторится или сам переводится в пакетную форму. Level 2 не создаёт скрытый механизм внедрения в старый модуль.

## Карта черновика

- [Терминология](./terminology.md)
- [Доменный пакет](./domains/domain-package.md)
- [Модуль business](./domains/business.md)
- [Фабрики, зависимости и adapters](./domains/factory-ports-adapters.md)
- [Assemblies и среды выполнения](./domains/assemblies.md)
- [Состояние и кэш](./domains/state-cache.md)
- [Framework Groups и модули](./domains/framework-bindings.md)
- [Зависимости](./dependencies.md)
- [Тестирование](./domains/testing.md)
- [Проверка](./validation.md)
- [Переход auth](./domains/auth-example.md)
- [Открытые вопросы](./domains/open-questions.md)
