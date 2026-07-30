# Зависимости Level 2

> Уточнение графа зависимостей внутри и между доменными пакетами.

## Связанные правила

- [`SLM-L2-BUSINESS-A007`](../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

## Направление внутри пакета

| Исходный модуль | Допустимые зависимости |
|---|---|
| `business` | Собственные сегменты, объявленный нейтральный `shared`, объявленные business-safe внешние пакеты, type-only публичные business-контракты других доменов |
| Adapter | Собственный `business`, `infra`, конкретная техническая реализация, `shared` |
| Preset | Собственный `business`, закрытые или самостоятельные adapters, type-only API других доменов |
| Framework binding module | Собственный `business`, публичные API framework-модулей своего домена, фреймворк, `ui`, `shared` |
| Место сборки графа | Публичные API presets и framework-модулей всех входящих в граф доменов |

`business` не достигает adapters, presets, framework-модулей, product SDK, storage, API браузера или Node.js. Проверяется весь транзитивный import-граф его публичной точки входа.

## Междоменные импорты

Модуль одного доменного пакета не импортирует runtime-экспорты другого доменного пакета. Разрешён только type-only импорт публичного контракта его `business`, по возможности суженный через `Pick`.

```ts
import type { AuthApi } from '@/domains/auth/business'

export type UserDeps = {
  auth: Pick<AuthApi, 'getSession'>
}
```

Type-only импорт остаётся архитектурным ребром. Runtime- и type-only зависимости образуют единый DAG и не могут создавать цикл.

Pure function, hook, Provider, context, component или framework state другого домена являются runtime-экспортами и не образуют исключение. Независимая общая функция переносится в `shared`, а UI нескольких доменов собирается в `compositions`.

## Runtime-инъекция API

Готовый API другого домена передаётся preset-модулю аргументом. Preset не импортирует его runtime-фабрику или сборку:

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
