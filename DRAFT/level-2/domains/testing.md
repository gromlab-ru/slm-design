# Тестирование доменного пакета

> Проверка владельцев и публичных границ Level 2.

## Связанные правила

- [`SLM-L2-TEST-R016`](../../rules/level-2.md#slm-l2-test-r016)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-PRESET-A020`](../../rules/level-2.md#slm-l2-preset-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)

## Размещение

Тест находится рядом с модулем-владельцем проверяемой ответственности. У доменного пакета нет общей корневой папки `tests`.

| Проверяемая граница | Владелец теста |
|---|---|
| Предметные сценарии, `DomainApi`, данные и ошибки | `business` |
| Техническое преобразование | Adapter |
| Выбор зависимостей и environment boundary | Preset |
| Provider, hook, form или guard | Соответствующий framework binding module |
| Граф нескольких доменов | Модуль `composition`, точка входа `app` или другое место сборки |

## Business через фабрику

Каждый публичный предметный сценарий проверяется через единственную фабрику с управляемыми зависимостями:

```ts
import type { AuthApi } from '@/domains/auth/business'
import { authFactory } from '@/domains/auth/business/factory'
import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/error'

const api: AuthApi = authFactory(createAuthTestDeps({
  requestCode: async () => ({ ok: true }),
}))

await api.requestPhoneOtp('+79991112233')
```

Набор проверяет успешные и ожидаемые ошибочные результаты, validation, преобразование внешних данных и публичные изменения состояния. Способ assertion для ошибки зависит от будущего решения `throw` или `Result`, но наружу всегда проверяется только AuthErrorCode.

Business-тест не использует React, реальный SDK, database или production preset. Локальная fake implementation допустима в тесте и не становится adapter-модулем, потому что не входит в production graph.

## Остальные модули

Тест каждого adapter-модуля проверяет технический вызов, аргументы, преобразование результата и передачу исходного сбоя business-слою. Он не повторяет mapping в доменные ошибки.

Тест обязательного preset проверяет вызов `business/factory`, контракт возвращённого `DomainApi` и отсутствие несовместимого environment-кода. Если фабрика имеет технические зависимости, тест также проверяет выбранные публичные adapter-модули; adapterless preset проверяет корректную сборку без Group `adapters`.

Framework-тест импортирует только конкретный модуль, например `auth/react/session`, передаёт тестовый `AuthApi` и проверяет Provider, hook или component. `login-form` не повторяет полный набор business-сценариев.

## Автоматические структурные проверки

Проверка файлов, exports и import-графа подтверждает:

- отсутствие root API доменного пакета и Framework Groups;
- наличие ровно трёх фасетов `business`, type-only exports в корневом barrel и отсутствие type exports в runtime-фасетах;
- соблюдение матрицы потребителей `business`, `business/factory` и `business/error`;
- наличие непосредственно в корне пакета непустой Group `presets` с объявленными модульными границами;
- отсутствие runtime cross-domain imports;
- отсутствие type-only импортов из чужих presets, adapters и framework-модулей;
- отсутствие cross-domain framework hooks, contexts и components;
- отсутствие server-only достижимости из client modules;
- отсутствие runtime- и type-only циклов.

## Архитектурное ревью

На ревью проверяется, что `business/factory` экспортирует только фабрику, а `business/error` только error codes и guards. Для каждой технической зависимости рассматриваются все production implementations: каждая должна принадлежать отдельному модулю Group `adapters`, даже если используется один раз. Inline implementations во всём production-графе запрещены, а test-only fakes из этой проверки исключены.

Runtime-тест не заменяет автоматическую проверку или архитектурное ревью.
