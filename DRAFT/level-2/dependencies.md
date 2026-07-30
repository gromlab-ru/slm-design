# Зависимости Level 2

> Уточнение графа зависимостей внутри и между доменными границами.

## Связанные правила

- [`SLM-L2-BUSINESS-A007`](../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-DOMAIN-A026`](../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-BUSINESS-A019`](../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ADAPTER-R021`](../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

## Матрица внутри пакета

| Исходный модуль | Допустимые зависимости |
|---|---|
| `business` | Собственные файлы, объявленные environment-neutral ресурсы `shared`, business-safe packages, type-only контракты и `business/runtime` других доменов |
| Adapter module | Type-only barrel собственного `business`, `infra`, concrete technical runtime, `shared` |
| Assembly | Type-only barrel, `factory` и при необходимости `runtime` собственного `business`, публичные adapters своего домена, type-only API других доменов, `shared` |
| Framework binding module | Type-only barrel и `runtime` собственного `business`, публичные framework-модули своего домена, framework/state/query runtime, `ui`, `shared` |
| Место сборки графа | Assemblies либо `business/factory` и adapter-модули, `business/runtime`, framework-модули входящих в граф доменов, а также разрешённые матрицей `infra`, `ui` и `shared` |

`business` не достигает adapters, assemblies, framework-модулей, product SDK, storage, state/query manager, API браузера или Node.js. Проверяется весь транзитивный import-граф публичных фасетов.

Adapter module импортирует из собственного `business` только типы технических зависимостей. Он не импортирует `business/factory`, потому что не собирает API. Публичный deterministic runtime обычно также не нужен adapter: внешний результат возвращается business для проверки и error mapping.

Assembly не содержит inline adapters. Она импортирует production implementations через публичные API конкретных модулей `adapters/*`.

## Междоменные импорты

При связи, пересекающей границу пакета Level 2, разрешены два вида статического импорта из другого домена:

```ts
import type { AuthSessionApi } from '@/domains/auth/business'
import { isAuthError } from '@/domains/auth/business/runtime'
```

Первый импорт предоставляет type-only контракт для runtime-инъекции. Второй предоставляет только публичную детерминированную функцию или значение. Оба импорта являются рёбрами общего DAG.

Запрещено импортировать из другого домена:

- `business/factory`;
- готовый API instance или singleton;
- assembly;
- adapter;
- framework state, hook, context, Provider или component;
- любой внутренний путь `business`.

Такая модель действует и между двумя пакетами Level 2, и между модулем Level 1 и пакетом Level 2. Между двумя простыми доменными модулями продолжают действовать правила Level 1.

## Детерминированный runtime

`business/runtime` закрывает случай общей продуктовой pure-функции, которую нельзя переносить в `shared` из-за знания о предметной области:

```ts
import {
  normalizeAuthIdentifier,
} from '@/domains/auth/business/runtime'
```

Функция остаётся собственностью Auth, а зависимый домен получает явное runtime-ребро к её публичному контракту. Если связь создаёт цикл, границы доменов или владелец общего понятия пересматриваются.

Перенос в `shared` допустим только после устранения продуктового знания, а не как обход cross-domain правила.

## Runtime-инъекция API

Готовый API другого домена передаётся assembly или одноразовому месту сборки аргументом. Код зависимого домена не импортирует его runtime-фабрику или сборку:

```text
createAuthForRequest()
  → AuthSessionApi
  → createUserForRequest({ auth })
  → UserProfileApi
```

Место сборки графа создаёт независимые домены раньше зависимых. Если сбой Auth становится результатом публичного сценария User, наружу выходит только собственная ошибка User. При exception-модели User может распознать ожидаемый Auth error через публичный guard из `auth/business/runtime`.

## Совместное применение Level 1 и Level 2

Один SLM root может постоянно содержать обе формы. Каждая предметная область объявляется либо модулем, либо пакетом, поэтому checker однозначно определяет применимые правила.

Runtime-взаимодействие с пакетом Level 2 собирается за пределами доменного кода. Если существующий модуль Level 1 должен принимать готовый API, его собственный публичный контракт явно предоставляет такую точку инъекции. Если это невозможно без скрытого singleton или обратного импорта, зависимый модуль рефакторится либо переводится на Level 2.

Runtime-значение из модуля Level 1, необходимое пакету Level 2, также передаётся внешним graph owner как API, callback или другой явно типизированный аргумент. Код пакета не импортирует executable API модуля Level 1 напрямую.

## Framework-состояние

Framework binding module использует framework API только своего доменного пакета:

```ts
// Допустимо внутри domains/auth/react/login-form
import { useAuthSession } from '@/domains/auth/react/session'

// Недопустимо внутри domains/user/react/profile
import { useAuthSession } from '@/domains/auth/react/session'
```

Во втором случае composition читает состояния обоих доменов и передаёт необходимые данные или callbacks через публичные свойства компонентов.

State/query cache внутри framework binding не создаёт исключение для cross-domain imports. Он работает поверх переданного API своего домена.

## Границы сред

Каждый client-, server- или shared-entry point имеет совместимый транзитивный import-граф. Серверная assembly или adapter не реэкспортируется через `business`, Framework Group или клиентскую assembly.

Tree shaking не является доказательством изоляции. Проверка выполняется до удаления неиспользуемого кода.
