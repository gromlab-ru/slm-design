# Тестирование доменного пакета

> Проверка владельцев и публичных границ Level 2.

## Связанное правило

- [`SLM-L2-TEST-R016`](../../rules/level-2.md#slm-l2-test-r016)

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
const api = authFactory(createAuthTestDeps({
  requestCode: async () => ({ ok: true }),
}))

await api.requestPhoneOtp('+79991112233')
```

Набор проверяет успешные и ожидаемые ошибочные результаты, validation, преобразование внешних данных и публичные изменения состояния. Способ assertion для ошибки зависит от будущего решения `throw` или `Result`, но наружу всегда проверяется только AuthErrorCode.

Business-тест не использует React, реальный SDK, database или production preset.

## Остальные модули

Adapter-тест проверяет технический вызов, аргументы, преобразование результата и передачу исходного сбоя business-слою. Он не повторяет mapping в доменные ошибки.

Preset-тест проверяет выбранные реализации, вызов одной фабрики, контракт возвращённого `DomainApi` и отсутствие несовместимого environment-кода.

Framework-тест импортирует только конкретный модуль, например `auth/react/session`, передаёт тестовый `AuthApi` и проверяет Provider, hook или component. `login-form` не повторяет полный набор business-сценариев.

## Архитектурные проверки

Отдельная import-graph проверка подтверждает:

- отсутствие root API доменного пакета и Framework Groups;
- отсутствие runtime cross-domain imports;
- отсутствие type-only импортов из чужих presets, adapters и framework-модулей;
- отсутствие cross-domain framework hooks, contexts и components;
- отсутствие server-only достижимости из client modules;
- отсутствие runtime- и type-only циклов.

Runtime-тест не заменяет эти проверки.
