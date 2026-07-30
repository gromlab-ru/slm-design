# Тестирование доменного пакета

> Проверка владельцев и публичных границ Level 2.

## Связанные правила

- [`SLM-L2-TEST-R016`](../../rules/level-2.md#slm-l2-test-r016)
- [`SLM-L2-BUSINESS-A019`](../../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L2-ASSEMBLY-R023`](../../rules/level-2.md#slm-l2-assembly-r023)
- [`SLM-L2-BUSINESS-R024`](../../rules/level-2.md#slm-l2-business-r024)

## Размещение

Тест находится рядом с модулем-владельцем проверяемой ответственности. У доменного пакета нет общей корневой папки `tests`.

| Проверяемая граница | Владелец теста |
|---|---|
| Сценарии, Domain API, данные и ошибки | `business` |
| Публичная pure-функция или guard | `business/runtime` внутри тестов модуля business |
| Техническое преобразование | Adapter |
| Выбор API, dependencies и environment boundary | Assembly |
| Provider, hook, query integration, form или guard | Соответствующий framework binding module |
| Граф нескольких доменов | Модуль `composition`, точка входа `app` или другое место сборки |

## Business через фабрику

Каждый публичный сценарий проверяется через фабрику владеющего им API с управляемыми dependencies:

```ts
import type { AuthSessionApi } from '@/domains/auth/business'
import { authSessionFactory } from '@/domains/auth/business/factory'
import {
  AUTH_ERROR_CODES,
  isAuthError,
} from '@/domains/auth/business/runtime'

const api: AuthSessionApi = authSessionFactory(createAuthSessionTestDeps({
  clock: { now: () => 1_700_000_000_000 },
  phone: { requestCode: async () => ({ ok: true }) },
}))

await api.requestPhoneOtp('+79991112233')
```

Набор проверяет успешные и ожидаемые ошибочные результаты, validation, преобразование внешних данных и публичные изменения состояния. Способ assertion для ошибки зависит от `throw` или `Result`, но наружу проверяется только собственный AuthErrorCode.

Business-тест не использует React, реальный SDK, database, production assembly или системные clock/random. Локальная fake implementation допустима в тесте и не становится adapter-модулем, потому что не входит в production graph.

Если `business` объявляет несколько API, каждый тестируется через свою фабрику. Общая внутренняя pure-логика не требует повторять одинаковые cases на уровне всех API.

## Остальные модули

Тест adapter-модуля проверяет технический вызов, аргументы, преобразование результата и передачу исходного сбоя business-слою. Он не повторяет mapping в доменные ошибки.

Тест обязательной assembly проверяет:

- вызов только нужных business-фабрик;
- точный именованный состав возвращённого графа;
- выбор публичных adapter-модулей;
- отсутствие несовместимого environment-кода;
- передачу cross-domain API аргументом, а не импортом;
- cleanup handle, если assembly создаёт ресурс жизненного цикла.

Assembly без собственного lifecycle-ресурса не тестирует пустой `dispose`, потому что не обязана его предоставлять.

Framework-тест импортирует только конкретный модуль, например `auth/react/session`, передаёт тестовый `AuthSessionApi` и проверяет Provider, hook или component. Query binding дополнительно проверяет keys, invalidation и отсутствие raw DTO в публичном результате, но не повторяет полный набор business-сценариев.

## Автоматические структурные проверки

Проверка файлов, exports и import-графа подтверждает:

- отсутствие root API доменного пакета и Framework Groups;
- обязательные `business` и `business/factory`, type-only exports в корневом barrel и допустимый опциональный `business/runtime`;
- соблюдение матрицы потребителей фасетов business;
- наличие непосредственно в корне пакета непустой Group `assemblies` с объявленными модульными границами;
- отсутствие запрещённых runtime cross-domain imports;
- отсутствие type-only импортов из чужих assemblies, adapters и framework-модулей;
- отсутствие cross-domain framework hooks, contexts и components;
- отсутствие server-only достижимости из client modules;
- отсутствие runtime- и type-only циклов.

## Архитектурное ревью

На ревью проверяется, что `business/factory` экспортирует только объявленные фабрики, а `business/runtime` при наличии содержит только публичный deterministic runtime. Для каждой технической зависимости рассматриваются все production implementations: каждая связная implementation должна принадлежать одному модулю Group `adapters`, но один такой модуль может реализовать несколько тесно связанных capabilities одного provider.

Отдельно проверяются прямые обращения business к `Date.now`, `Math.random`, `crypto.randomUUID`, timers, env и другим скрытым runtime-capabilities.

Runtime-тест не заменяет автоматическую проверку или архитектурное ревью.
