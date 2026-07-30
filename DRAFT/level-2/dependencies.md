# Зависимости Level 2

> Уточнение графа зависимостей внутри и между доменными пакетами.

## Связанные правила

- [`SLM-L2-BUSINESS-A007`](../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-BUSINESS-A019`](../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ADAPTER-R021`](../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

## Направление внутри пакета

| Исходный модуль | Допустимые зависимости |
|---|---|
| `business` | Собственные файлы, объявленный нейтральный `shared`, business-safe внешние пакеты, type-only `business` других доменов |
| Adapter module | Type-only barrel собственного `business`, `infra`, конкретная техническая реализация, `shared` |
| Preset | Type-only barrel и `factory` собственного `business`, публичные adapter-модули своего домена, type-only API других доменов |
| Framework binding module | Type-only barrel и `error` собственного `business`, публичные framework-модули своего домена, фреймворк, `ui`, `shared` |
| Место сборки графа | Presets либо `business/factory` и adapter-модули, `business/error`, framework-модули входящих в граф доменов |

`business` не достигает adapters, presets, framework-модулей, product SDK, storage, API браузера или Node.js. Проверяется весь транзитивный import-граф трёх публичных фасетов.

Adapter module импортирует из собственного `business` только типы технических зависимостей. Он не импортирует `business/factory` или `business/error`, потому что не собирает API и не создаёт доменные ошибки.

Preset не содержит inline adapters. Он импортирует production implementations через публичные API конкретных модулей `adapters/*`.

## Междоменные импорты

Модуль одного доменного пакета не импортирует runtime-экспорты другого доменного пакета. Разрешён только type-only импорт корневого barrel его `business`, по возможности суженный через `Pick`. Чужие `business/factory` и `business/error` являются runtime entry points и запрещены.

```ts
import type { AuthApi } from '@/domains/auth/business'

export type UserDeps = {
  auth: Pick<AuthApi, 'getSession'>
}
```

Type-only импорт остаётся архитектурным ребром. Runtime- и type-only зависимости образуют единый DAG и не могут создавать цикл.

Pure function, hook, Provider, context, component или framework state другого домена являются runtime-экспортами и не образуют исключение. Независимая общая функция переносится в `shared`, а UI нескольких доменов собирается в `compositions`.

## Runtime-инъекция API

Готовый API другого домена передаётся preset-модулю или одноразовому месту сборки аргументом. Код зависимого доменного пакета не импортирует его runtime-фабрику или сборку:

```text
createAuthForRequest()
  → AuthApi
  → createUserForRequest({ authApi })
  → UserApi
```

Место сборки графа создаёт независимые домены раньше зависимых. Если сбой `AuthApi` становится результатом публичного сценария `UserApi`, приложению доступна только собственная доменная ошибка User. Точный механизм различения ошибок при exception-модели остаётся открытым вопросом.

## Framework-состояние

Framework binding module использует framework API только своего доменного пакета:

```ts
// Допустимо внутри domains/auth/react/login-form
import { useAuthSession } from '@/domains/auth/react/session'

// Недопустимо внутри domains/user/react/profile
import { useAuthSession } from '@/domains/auth/react/session'
```

Во втором случае композиционный модуль читает состояния обоих доменов и передаёт необходимые данные или callbacks через публичные свойства компонентов.

## Границы сред

Каждый client-, server- или shared-entry point имеет совместимый транзитивный import-граф. Серверный preset или adapter не реэкспортируется через `business`, Framework Group или клиентский preset.

Tree shaking не является доказательством изоляции. Проверка выполняется до удаления неиспользуемого кода.
