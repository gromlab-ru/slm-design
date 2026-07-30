# SLM Level 2

> Статус: рабочий черновик. Документы в этой папке не являются спецификацией.

Level 2 предназначен для приложений с устойчивыми доменными API, несколькими способами сборки или самостоятельными framework-модулями домена. Он сохраняет слои Level 1, но заменяет простой доменный модуль доменным пакетом с явными владельцами ролей.

## Наследование Level 1

Level 2 соблюдает определения и правила Level 1, кроме явно заменённых положений:

| Положение Level 1 | Статус в Level 2 |
|---|---|
| Порядок `app → compositions → domains → infra → ui → shared` | Сохраняется |
| Модуль, Group, сегмент, компонент, публичный API и граф зависимостей | Сохраняют смысл |
| Доменный модуль и [`SLM-L1-DOMAIN-R015`](../rules/level-1.md#slm-l1-domain-r015) | Заменяются доменным пакетом |
| Единый публичный API модуля `business` | Представлен тремя объявленными фасетами одного логического API |
| Навигационная Group слоя `domains` | Может содержать доменные пакеты |
| Group внутри доменного пакета | Содержит обычные SLM-модули и Groups |

Канонический набор требований образуют [правила Level 1](../rules/level-1.md) и [правила Level 2](../rules/level-2.md).

## Когда выбирать Level 2

Level 2 оправдан, когда предметной области нужны один устойчивый `DomainApi`, разные сборки для браузера и сервера, несколько технических интеграций или самостоятельные domain-specific модули React, Vue либо другого фреймворка.

Уровень выбирается для всего SLM root. Проект, в котором всем предметным областям достаточно простых доменных модулей, остаётся на Level 1. После завершённого перехода на Level 2 каждая предметная область представлена доменным пакетом как минимум с `business` и одним preset.

Размер каталога сам по себе не требует перехода.

## Базовая форма

```text
src/domains/
└── auth/                         # Доменный пакет
    ├── README.md                 # Необязательная metadata
    ├── business/                 # Обязательный SLM-модуль
    │   ├── index.ts              # Только public types
    │   ├── factory.ts            # Public factory entry
    │   └── error.ts              # Public error runtime entry
    ├── presets/                  # Обязательная непустая Group
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

Приложение получает данные, состояние и результаты домена через готовый экземпляр `DomainApi`. Технический код импортирует только API конкретного модуля:

```ts
import type { AuthApi, AuthError } from '@/domains/auth/business'
import { authFactory } from '@/domains/auth/business/factory'
import { isAuthError } from '@/domains/auth/business/error'
import { createBrowserAuth } from '@/domains/auth/presets/browser'
import { AuthSessionProvider } from '@/domains/auth/react/session'
import { LoginForm } from '@/domains/auth/react/login-form'
```

Общие импорты `@/domains/auth` и `@/domains/auth/react` запрещены: пакет и Groups не имеют агрегирующих API. Другие пути внутри `business`, кроме `business`, `business/factory` и `business/error`, являются deep imports.

## Миграция

Доменные модули Level 1 могут временно сосуществовать с пакетами Level 2 только во время перехода. Такое состояние не является завершённым соответствием Level 2. По [`SLM-L2-MIGRATION-A017`](../rules/level-2.md#slm-l2-migration-a017) старые модули и новые пакеты не создают прямых runtime- или type-only зависимостей; связанные части графа мигрируют вместе.

## Карта черновика

- [Терминология](./terminology.md)
- [Доменный пакет](./domains/domain-package.md)
- [Модуль business](./domains/business.md)
- [Фабрика, зависимости и адаптеры](./domains/factory-ports-adapters.md)
- [Presets и среды выполнения](./domains/presets.md)
- [Framework Groups и модули](./domains/framework-bindings.md)
- [Зависимости](./dependencies.md)
- [Тестирование](./domains/testing.md)
- [Проверка](./validation.md)
- [Миграция auth](./domains/auth-example.md)
- [Открытые вопросы](./domains/open-questions.md)
