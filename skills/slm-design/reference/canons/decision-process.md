---
title: Процесс архитектурного решения
description: Обязательный порядок классификации задачи, выбора владельца, слоя, scope и стратегии изменений
---

# Процесс архитектурного решения

Не изменяй файлы, пока не принято архитектурное решение. Название папки, существующий похожий код и удобный импорт не доказывают правильность размещения.

## Карточка решения

Перед реализацией определи:

| Вопрос | Что зафиксировать |
|---|---|
| Роль изменения | Framework wiring, продуктовый сценарий, интеграция, композиция интерфейса, технический сервис, UI или чистый фундамент |
| Владелец | Домен, route/page scope, composition module, infra-модуль, UI-модуль или локальный consumer |
| Данные | Продуктовые данные, техническое состояние, framework input, локальное UI-state или отсутствуют |
| Runtime-возможности | Источники данных, hooks, stores, SDK, browser API, events, clock, random, env и другие внешние capabilities |
| Место | Приложение или package, слой, модуль, вложенный модуль и сегмент |
| Публичная граница | Что действительно нужно экспортировать и кто будет consumer |
| Путь данных | От consumer до business API, dependency adapter и конкретного источника |
| Lifecycle | Кто создаёт instance, сколько instances допустимо и кто выполняет cleanup |
| Стратегия | Локальная правка, новый модуль, новый business-контракт, adapter, перенос или исправление public API |
| Проверки | Typecheck, тесты, import graph, public API, lifecycle и архитектурные инварианты |

Карточку не обязательно выводить пользователю, если решение очевидно. Но агент обязан уметь обосновать каждый пункт до изменения файлов.

## Сбор контекста

Перед выбором места:

1. Прочитай локальные инструкции приложения или package.
2. Найди фактическую границу SLM: `src/`, `apps/{app}/src` или другой локальный root.
3. Проверь существующие слои, группы и соседние модули. Не создавай новую параллельную структуру без необходимости.
4. Проверь aliases, package exports и реальную разрешимость импортов.
5. Найди текущих consumers, public API и runtime import graph изменяемой ответственности.
6. Проверь существующие templates или generators после архитектурного выбора. Шаблон не принимает решение за SLM.
7. Отдельно найди product I/O, hooks, stores, subscriptions, browser API и другие runtime-возможности.
8. Проверь, нет ли уже business-домена, которому принадлежит сценарий.

Не считай неиспользуемый provider, пустой context, тип будущего graph или ссылку на несуществующий домен готовой архитектурой. Решение должно быть достижимо из runtime entry point и иметь реальных consumers.

## Выбор роли

Классифицируй ответственность в следующем порядке.

### Framework wiring

Если код существует только из-за фреймворка, размести его в `app`:

- route-файл;
- bootstrap;
- framework error entry;
- подключение глобальных ресурсов;
- тонкое подключение готового composition module.

`app` не реализует продуктовую композицию, business graph, store, provider или экран.

### Продуктовый сценарий

Если код определяет пользовательский сценарий, доменную модель, продуктовый state, бизнес-правило, нормализацию внешних данных, error mapping или доменный переход после ошибки, владелец находится в `business/{domain}`.

Визуальная реакция на готовый domain error принадлежит consumer composition: сообщение, error screen, redirect, retry control и UI fallback выбираются по стабильному доменному `code`.

Любой новый внешний источник продуктовых данных требует business-контракта. Колокация внешних вызовов в page/screen/widget services не является допустимым упрощением.

### Интеграция business-домена

Если код реализует `{Domain}Deps` через SDK, HTTP, storage, browser API, state/query runtime, event bus или другой concrete runtime, размести его в `compositions/business/{domain}`.

Это интеграционный composition module, а не business-домен и не обычная page/screen/widget composition.

### Продуктовая композиция

Если код собирает route/page/layout/screen/widget, управляет UI-state, provider scope или lifecycle готового business graph, размести его в соответствующем composition module.

Потребительский composition module получает продуктовые данные только через `{Domain}Api`. Он не импортирует product SDK, generated operations, product storage adapter или конкретный источник.

### Технический сервис

Если код предоставляет техническую возможность без продуктовой модели и сценариев, размести его в `infra`:

- HTTP client;
- SDK wrapper;
- logger;
- theme engine;
- i18n engine;
- telemetry transport;
- технический realtime client.

Composition может использовать технический infra-сервис напрямую, если сервис не становится обходным путём к продуктовым данным. Если capability нужна business, она всё равно передаётся через business-owned `deps` и adapter.

### Универсальный UI

Если сущность отображает интерфейс, не знает продуктовый сценарий и применима независимо от конкретной composition, размести её в `ui`.

### Чистый фундамент

Если код детерминирован, не имеет runtime-state, не знает продукт и переиспользуется несколькими владельцами, рассмотри `shared`. По умолчанию оставляй код рядом с первым владельцем.

## Выбор scope

Выбирай минимальный scope, который полностью владеет ответственностью:

1. Нужен одному component/module и не имеет самостоятельной ответственности: оставь внутри владельца.
2. Нужен как самостоятельная часть одного module: создай nested module в `parts/`.
3. Нужен нескольким частям одной page/route ветки: подними в общий composition scope этой ветки.
4. Нужен нескольким composition modules и остаётся продуктовой композицией: создай отдельный composition module.
5. Является доменным сценарием или product data boundary: создай или расширь `business/{domain}`.
6. Является техническим сервисом: создай или расширь `infra/{service}`.
7. Является универсальным UI: создай или расширь `ui/{module}`.
8. Выноси в package только `ui`, `infra` или `shared` код с реальным вторым consumer либо явно зафиксированным межприложенческим ownership/reuse-контрактом.

Не поднимай код выше ради короткого импорта. Не создавай `shared`, общий provider, generic business context или package «на будущее».

## Component, module и group

Применяй решение последовательно:

1. Только отображает готовые props и не владеет зависимостями: component в `ui/` родительского module.
2. Владеет сценарием, данными, state, dependency, lifecycle или внутренней декомпозицией: самостоятельный module.
3. Самостоятельный module, локальный для владельца: nested module в `parts/`.
4. Папка только классифицирует конечные modules: group без `index.ts`, state и runtime logic.
5. `ui/`, `parts/`, `hooks/`, `types/`, `services/` и другие служебные папки внутри module: segments, а не modules.

Если component начинает получать данные, выбирать источник, вызывать сценарный hook или управлять процессом, не добавляй логику в component. Измени архитектурную форму сущности.

## Выбор стратегии

### Новый продуктовый сценарий

1. Найди домен-владелец.
2. Спроектируй `{Domain}Api`, доменные типы и доменные ошибки.
3. Опиши минимальные runtime-capabilities в `{Domain}Deps`.
4. Реализуй детерминированную доменную логику.
5. Создай отдельные adapters в `compositions/business/{domain}`.
6. Собери фабрику чистым builder.
7. Подключи API во владельце lifecycle graph.
8. Используй API из потребительских compositions.
9. Добавь factory-level и assembly tests.

### Прямой product I/O вне business boundary

Не расширяй существующее нарушение.

1. Определи сценарий и домен.
2. Перенеси контракт данных в business-owned `Deps`.
3. Перенеси нормализацию, fallback и error mapping в business.
4. Оставь concrete source call в dependency adapter.
5. Замени прямой вызов на `{Domain}Api`.
6. Закрой adapter и source details из public API.

### Новый store или dependency hook

Сначала определи, является state локальным UI-state или доменным state.

- State является локальным UI-state, если сбрасывается вместе с UI scope, управляет только представлением и не хранит продуктовый факт или product data cache. Такой state может принадлежать composition module и использовать выбранный state manager внутри владельца.
- State является доменным, если выражает продуктовый факт, инвариант, доступен через business API или участвует в бизнес-сценарии.
- Доменный state принадлежит business-контракту. Фабрика получает state adapter factory через `deps`, выбирает initial domain state и создаёт concrete port через adapter.
- Source/query hook реализуется adapter-ом; business вызывает только dependency hook и возвращает собственный доменный hook/result.

### Сборка graph

1. Собери каждый домен отдельным `compositions/business/{domain}` builder.
2. Определи DAG cross-domain зависимостей.
3. Выбери один явный lifecycle scope: application-lifetime composition, route, page, request или test. Слой `app` только подключает application composition.
4. Создавай graph у владельца scope, а не в случайном screen/widget или на module scope без обоснования.
5. Передавай consumers точный graph type. Не используй `Partial<Graph>` с приведением к полному типу.
6. Для subscriptions, timers и resources зафиксируй cleanup/dispose.

### Архитектурное ревью

Проверяй не только пути файлов, но и семантику:

- business-shaped код вне `business`;
- product graph в `infra`;
- type-only imports, которые фактически переносят ownership;
- provider, который не создаёт и не получает instance от явного владельца;
- orphan modules и providers, недостижимые из entry point;
- public API, раскрывающий raw store, context, adapter или generated types;
- отсутствующие tests обязательного business-контракта.

## Условия остановки

Останови реализацию и сначала исправь решение, если:

- владелец ответственности не определён;
- один state или source имеет несколько конкурирующих владельцев;
- business требует прямого runtime или type-only import concrete runtime;
- graph создаёт runtime-цикл;
- lifecycle instance или cleanup не определён;
- public API нужен только для обхода границы;
- шаблон генерирует архитектуру, противоречащую принятому решению;
- изменение требует незапрошенной миграции нескольких независимых областей.

## Локальные материалы

Основной процесс достаточен для типового решения. Открывай только материал, который нужен текущей ветке задачи.

| Ситуация | Материал |
|---|---|
| Нужна полная карта допустимых файлов, root entries, segments и tests | [Атлас файлов SLM](./file-atlas.md) |
| Задача затрагивает product I/O, source hook, domain store, event, lifecycle или external errors | [Runtime-граница business](./business-runtime-boundary.md) |
| Выполняется архитектурное ревью или финальная проверка реализации | [Архитектурная проверка](./validation.md) |
| Неясен layer, направление import или роль `app/compositions/business/infra/ui/shared` | [Слои](./layers.md) |
| Нужно отличить module, component, group, nested module или спроектировать public API | [Модули](./modules.md) |
| Проектируется factory, Api, Deps, domain error или сборка домена | [Business-фабрика](./business-factory.md) |
| Неясно размещение hook/store/service/mapper/provider/type/style | [Сегменты](./segments.md) |
| Решается вынос из `apps/*/src` в `packages/*` | [Монорепозитории](./monorepo.md) |
| Нужен полный пример adapters, builder, state runtime и graph lifecycle | [Business composition](../examples/business-composition.md) |
| Нужна матрица factory-level, assembly и colocated tests | [Тестирование business-модулей](../examples/business-testing.md) |
| Нужен page/route provider, локальный UI store и доступ к готовому graph | [Композиция через Provider](../examples/react/composition-provider.md) |
| Команда выбирает организацию groups внутри `compositions` | [Структуры compositions](../examples/react/composition-structures.md) |

Не используй карту как scaffold checklist. Наличие возможной папки не означает, что её нужно создать.
