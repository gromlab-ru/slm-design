---
name: slm-design
description: "Используй при проектировании, реализации, миграции и архитектурном ревью по SLM: когда нужно определить SLM root, ответственность, владельца, слой, модульную границу, публичный API, форму домена Level 1 или Level 2, направление зависимостей, Domain API, business factory, adapter, assembly, framework binding, state/cache/error/lifecycle ownership или исправить deep import, цикл и environment leak. Не используй для локального coding, debugging, форматирования, framework- или SDK-механики, если архитектурная граница уже определена и не меняется."
---

# SLM Design

## Рабочий контракт

Применяй SLM как способ выполнить пользовательскую задачу, а не как тему для пересказа. После чтения этого файла ты должен уметь принять типовое архитектурное решение, реализовать его в запрошенном scope и проверить результат. Открывай references только для точной формулировки правила, редкого случая или неразрешённого вопроса.

Работай в таком порядке:

1. Исследуй существующий код и локальные правила проекта.
2. Определи ответственность, владельца и минимальный scope.
3. Выбери слой, архитектурную сущность и форму домена.
4. Спроектируй публичную границу, зависимости, runtime-сборку и lifecycle.
5. До редактирования проверь решение по применимым правилам.
6. Если пользователь запросил реализацию, внеси изменения до завершённого состояния.
7. Проверь импорты, exports, граф, среды, lifecycle и тесты.
8. Кратко сообщи решение, сделанные изменения, проверки, assumptions и остаточные риски.

Не начинай широкое перемещение кода или генерацию каркаса до шагов 1-5. Не расширяй задачу до полного аудита SLM root, если локальное изменение можно корректно выполнить в меньшем scope.

## Источники и обязательность

Bundled DRAFT является рабочим источником истины для этой версии skill, но остаётся черновиком архитектуры. Используй источники в следующем порядке:

1. [`rules/level-1.md`](./reference/draft/rules/level-1.md) и [`rules/level-2.md`](./reference/draft/rules/level-2.md) - единственный источник блокирующих правил.
2. [`level-1/terminology.md`](./reference/draft/level-1/terminology.md) и [`level-2/terminology.md`](./reference/draft/level-2/terminology.md) - обязательный смысл терминов.
3. README уровней - область применения, наследование и замены правил.
4. Тематические главы - объяснения, рекомендации и варианты проектирования.
5. Примеры - иллюстрации, а не обязательный каркас.
6. `open-questions.md` - нерешённые вопросы, а не требования.

Если тематическая глава строже реестра, не создавай из неё новое блокирующее правило. Предложи более строгую форму как рекомендацию или уточни локальную policy, если выбор влияет на API, ownership, стоимость или runtime. Если этот файл расходится с реестром или нормативной терминологией, следуй bundled DRAFT и отметь дефект skill.

При review различай:

- **Rule violation** - нарушено применимое правило с существующим кодом SLM.
- **Definition mismatch** - реализация не соответствует нормативному смыслу сущности.
- **Architectural risk** - есть доказуемый риск, но нет блокирующего правила.
- **Decision required** - DRAFT или проект оставляет значимый выбор открытым.
- **Recommendation** - улучшение, которое не является обязательным.
- **Assumption** - обратимое рабочее допущение, явно указанное в результате.

Не придумывай коды правил. Перед ссылкой на нарушение открой соответствующий реестр и проверь точную формулировку.

## Минимальная рабочая модель

### SLM root и уровни

SLM root - граница структурной архитектуры одного приложения. Сначала найди фактический root, path aliases, локальный стайлгайд и конфигурацию архитектурной проверки. Не считай `src` root автоматически и не выводи сущность только из имени папки.

Level 1 действует во всём SLM root и задаёт слои, модули, публичные API, общий dependency DAG и владение lifecycle.

Level 2 применяется отдельно к выбранной предметной области и заменяет только её доменный модуль пакетной формой. Остальные домены могут постоянно оставаться на Level 1. Одна предметная область имеет ровно одну итоговую форму.

### Слои

| Исходный слой | Может зависеть от |
|---|---|
| `app` | `app`, `compositions`, `domains`, `infra`, `ui`, `shared` |
| `compositions` | `compositions`, `domains`, `infra`, `ui`, `shared` |
| `domains` | `domains`, `infra`, `ui`, `shared` |
| `infra` | `infra`, `shared` |
| `ui` | `ui`, `shared` |
| `shared` | `shared` |

Матрица не требует проходить через каждый промежуточный слой. Разрешённый импорт не переносит владение ответственностью.

| Слой | Помещай сюда |
|---|---|
| `app` | Framework entry points: запуск, routes, преобразование внешнего input и подключение готовых API |
| `compositions` | Pages, layouts, screens, widgets, route outcomes и multi-domain UI |
| `domains` | Предметные модели, правила, сценарии и продуктовое состояние |
| `infra` | Универсальные технические capabilities без собственной предметной модели |
| `ui` | Универсальные UI-модули без зависимости от продуктовой композиции |
| `shared` | Детерминированный product-agnostic фундамент без I/O, mutable state и lifecycle |

### Архитектурные сущности

| Признак | Сущность |
|---|---|
| Самостоятельная ответственность со своим API, dependencies, state или lifecycle | Module |
| Только навигационно классифицирует modules и Groups | Group |
| Организует внутренности одного module | Segment |
| Framework UI entity, реализующая часть ответственности родителя | Component |
| Самостоятельный module, скрытый внутри parent module | Nested module |
| Framework bootstrap или route entry | Немодульная единица `app` |
| Малый deterministic product-agnostic файл без внутренней границы | Shared resource |

Module является узлом dependency graph, размещается в отдельной папке и имеет единый логический публичный API. Group, segment и component не владеют API, состоянием или lifecycle. Наличие локального `index.ts`, нескольких файлов, hook, data access или lifecycle-кода само по себе не превращает component или segment в module: всё это принадлежит ближайшему module-owner.

Nested module имеет собственную ответственность, API и узел графа, но внешний код получает его exports только через публичный API parent module.

### Пакетная форма Level 2

Минимальная структура доменного пакета:

```text
domains/<domain>/
├── metadata                 # optional, declarative only
├── business/                # required SLM module
├── assemblies/              # required non-empty Group
├── adapters/                # when factories have technical dependencies
└── react|vue|...            # when domain-specific bindings exist
```

Доменный пакет является policy boundary, но не module, Group, public API или graph node. В его корне нет executable files, state, lifecycle, barrel или реэкспортов. Исполняемыми владельцами являются модули внутри пакета.

`business` является единственным предметным владельцем пакета. Его публичный API состоит из фасетов:

| Путь | Содержимое |
|---|---|
| `business` | Только public types: Domain API, dependencies, factory types, error types |
| `business/factory` | Только именованные runtime factories, по одной на Domain API |
| `business/runtime` | Только реально нужные внешним consumers детерминированные runtime values/functions |

Другой публичный путь внутрь `business` является deep import. `business/runtime` не создавай для симметрии.

Роли Level 2:

- `business` определяет Domain API, модели, validation, transitions, scenario results, dependency contracts и expected domain errors.
- Adapter module реализует связанные technical dependencies поверх SDK, storage, platform API, state/query runtime или другого technical runtime.
- Assembly module выбирает adapters, вызывает factories и возвращает именованный graph готовых API для одного execution context.
- Framework binding module получает готовые Domain API и владеет одной domain-specific интеграцией с framework.
- Composition, `app`, request handler или test setup собирает междоменный graph в ацикличном порядке и владеет его общим scope.

## Универсальный цикл решения

### 1. Discover

Перед решением найди только релевантный контекст:

- локальные инструкции и стайлгайд;
- SLM root и mapping путей на слои и модули;
- существующие public entry points и package exports;
- внешних consumers затрагиваемой границы;
- runtime- и type-only imports, реэкспорты и aliases;
- state, I/O, SDK, framework runtime и источники недетерминизма;
- места создания graph и instances;
- subscriptions, timers, requests, connections и cleanup;
- тесты и команды проверки затрагиваемых owners.

Считай type-only import и reexport архитектурным ребром. Для runtime-графа дополнительно ищи arguments factories, callbacks, registries, event buses, service locators и singletons: фактическая зависимость может не иметь прямого runtime import.

### 2. Classify

Сформулируй краткую внутреннюю карточку:

```text
Task outcome:
Responsibility:
Owner:
Layer:
Entity:
Domain form:
Public consumers:
Runtime dependencies:
Environment:
State and lifecycle:
Change scope:
```

Не обязан показывать карточку пользователю, если решение однозначно. Если одно из ключевых полей неизвестно и влияет на границу, сначала исследуй код, затем задай один конкретный вопрос.

### 3. Design boundary

Определи:

- один owner каждой самостоятельной ответственности;
- минимальный публичный контракт для реальных consumers;
- разрешённые static edges;
- runtime injection и место сборки graph;
- владельцев domain state, technical cache и framework projection;
- безопасную форму expected errors;
- environment entry points и их transitive reachability;
- scope, multiplicity и cleanup каждого lifecycle resource;
- тестовую границу каждого изменяемого owner.

### 4. Validate before edits

До изменения файлов ответь:

- Соответствует ли ответственность роли слоя?
- Является ли выбранная сущность настоящим owner, а не удобной папкой?
- Есть ли у domain одна форма?
- Импортируется ли каждый чужой module через public API?
- Разрешены ли layer и cross-domain edges?
- Остаётся ли graph ацикличным?
- Совместим ли transitive graph с environment entry point?
- Есть ли owner, scope, multiplicity и cleanup у ресурсов?
- Не требует ли решение незапрошенной миграции соседних owners?

### 5. Act and verify

Если пользователь просит код, не останавливайся на рекомендации. Реализуй согласованную границу, обнови consumers и tests, удали obsolete paths и проверь завершённое состояние. Если пользователь просит только анализ, план или review, не редактируй код.

## Алгоритмы выбора

### Ответственность и владелец

1. Опиши ответственность одним предложением без имени папки, файла или библиотеки.
2. Назови одну причину её изменения.
3. Найди данные, behavior и state, которые изменяются вместе с ней.
4. Найди внешних consumers.
5. Проверь, нужны ли ей собственные API, dependencies, state или lifecycle.
6. Если самостоятельность доказана, назначь ровно один module-owner.
7. Если ответственность нельзя сформулировать или у неё конкурирующие owners, остановись до структурных изменений.

Место выполнения не переносит владение. Provider, hook, controller, route и component могут запускать чужую ответственность, не становясь её owner.

### Выбор слоя

```text
Только framework bootstrap, route entry или external input adaptation?
  -> app

Page/layout/screen/widget, route outcome или multi-domain UI?
  -> compositions

Domain model, scenario, validation, transition или product state?
  -> domains

Technical capability без собственной domain model?
  -> infra

Product-independent reusable UI?
  -> ui

Deterministic, product-agnostic, без I/O/state/lifecycle?
  -> shared

Иначе -> уточни ответственность, не выбирай папку по аналогии.
```

Domain-specific framework integration над готовым API может принадлежать Framework Group пакета Level 2. Зависимость от React/Vue сама по себе не переносит domain behavior в `compositions` или `app`.

### Выбор сущности

```text
Есть самостоятельный owner/API/dependencies/state/lifecycle?
  Да -> module.
  Нет -> часть текущего owner.

Module нужен только внутри одного parent module?
  Да -> nested module.

Папка только классифицирует modules/Groups?
  Да -> Group.

Папка только организует содержимое одного module?
  Да -> segment.

Framework UI entity не имеет самостоятельной ответственности?
  Да -> component parent module.
```

Не создавай module только из-за размера, повторного использования внутреннего helper или желания получить отдельную папку. Не оставляй самостоятельную ответственность component-ом или segment-ом только ради меньшего diff.

### Выбор формы домена

По умолчанию используй доменный модуль Level 1. Level 1 не требует factory, ports, adapters, assemblies или разделения по техническим ролям.

Рассматривай Level 2, когда конкретному домену действительно нужны:

- несколько независимо собираемых Domain API;
- разные browser/server/request assemblies;
- несколько production technical integrations;
- строгие environment boundaries;
- самостоятельные domain-specific framework modules.

Не выбирай Level 2 из-за количества файлов, одного SDK, одного hook, желания унифицировать дерево или гипотетической будущей интеграции. Зафиксируй, какую реальную потребность окупает дополнительная стоимость package, facets, assembly и adapters.

### Публичная граница

1. Перечисли реальных внешних consumers.
2. Для каждого запиши минимально необходимый contract.
3. Удали exports, которым нет consumer.
4. Не экспортируй mutable internals, concrete clients, stores, contexts, adapters или lifecycle implementation.
5. Для обычного module оставь одну логическую external entry point.
6. Для `business` используй только объявленные facets.
7. Удали deep imports и обнови package exports/aliases при необходимости.
8. Не открывай nested module напрямую за пределы parent boundary.

Для Level 2 разделяй Domain API по устойчивым различиям consumers, dependencies или environments, а не по внутренним техническим папкам. Каждый публичный scenario принадлежит ровно одному Domain API; каждому API соответствует одна factory. Именованный graph assembly не является новым Domain API.

### Проверка зависимости

Для каждого нового или изменённого edge:

1. Определи source owner и target owner.
2. Определи их слои и формы доменов.
3. Если owners различаются, импортируй target только через public API.
4. Проверь матрицу слоёв.
5. Если edge пересекает Level 2 package boundary, примени более строгую cross-domain модель.
6. Проверь transitive environment compatibility.
7. Добавь edge в общий module DAG и проверь цикл.

При пересечении границы Level 2 статически допустимы:

```ts
import type { OtherDomainApi } from '.../other/business'
import { deterministicValue } from '.../other/business/runtime'
```

Готовый API другого домена создаёт внешний graph owner и передаёт assembly или factory аргументом. Не импортируй из другого домена его factory, assembly, adapter, API singleton, framework state, hook, context, Provider, component или внутренний путь `business`.

Не скрывай cross-domain dependency локальным structural interface, callback, global registry или event bus. Установи владельца контракта и отрази runtime edge в graph, иначе можно пропустить цикл.

### Runtime capabilities

| Capability | Размещение в Level 2 |
|---|---|
| SDK, HTTP/GraphQL source, storage, platform API | Adapter |
| Concrete state/query runtime для business dependency | Adapter |
| Clock, timer, random, ID, environment | Явная factory dependency с production implementation в adapter |
| Готовый API другого домена | Cross-domain dependency, передаваемая graph owner |
| Provider, hook или query projection готового Domain API | Framework binding module |
| Page-local или multi-domain UI state | Владеющий composition module |
| Универсальный technical service | `infra` module |

Adapter переводит technical arguments/results и реализует dependency contract. Он не объявляет Domain API scenario, domain fallback, transition или public domain error. Production implementation technical dependency не прячь inline в assembly или composition.

Assembly выбирает public adapters своего домена, вызывает factories и возвращает точный именованный graph API. Она не добавляет scenarios, методы API или собственные domain errors. Framework binding получает готовые API и не вызывает factory/assembly и не выбирает adapter.

### State и cache

```text
Domain facts, validation, transitions, commands, scenario outcomes
  -> business authority

Transport/source cache
  -> adapter

Framework/query projection готового Domain API
  -> framework binding

State только текущей UI composition
  -> composition owner
```

Raw DTO, query-library result и mutable client не являются Domain API. Technical и framework cache могут хранить и проецировать только значения, произведённые или проверенные `business`, и не создают параллельную предметную модель.

При optimistic или concurrent mutations не придумывай универсальный rollback. Сначала установи owner политики ordering, versioning, rebase/rollback и authoritative refresh.

### Errors

- Expected technical или foreign-domain failure, доступный через текущий Domain API, преобразуется текущим `business` в собственный readonly domain error со stable code.
- Source object, SDK class, message, status, payload и `cause` не входят в public domain contract.
- Type errors экспортируются через `business`; необходимые runtime codes и guards - только через реально нужный `business/runtime`.
- Не выбирай exception или discriminated `Result` как правило SLM: сохрани project policy и архитектурное владение.
- Не маскируй programming defect под expected domain outcome. Если меняется публичный failure channel, выясни политику unexpected failures, cancellation и serialization.

### Lifecycle и environment

Для каждого request, subscription, listener, timer, observer, connection или другого долгоживущего ресурса зафиксируй:

```text
Owner:
Created or started by:
Scope:
Multiplicity:
Environment:
Owned or borrowed:
Cleanup:
```

Factory или assembly не должна запускать неучтённую долгоживущую работу. Явная операция, запускающая ресурс, предоставляет cleanup. Если assembly обязана создать resource для graph, её публичный result предоставляет cleanup handle; graph owner вызывает его не позже конца scope. Assembly без собственного ресурса не возвращает пустой `dispose` для симметрии.

Environment определяется transitive import graph, а не именем файла или tree shaking. Для RSC, server actions, workers, edge runtime и conditional exports сначала установи реальные executable edges, framework reference edges и runtime capabilities; не объявляй environment safety только по метке `client`/`server`.

## Рабочие процедуры

### Проектирование

1. Ограничь scope пользовательской задачей.
2. Найди SLM root, project mapping и существующие owners.
3. Построй карту consumers и текущих public paths.
4. Определи ответственность, layer, entity и domain form.
5. Спроектируй target boundaries и минимальные public contracts.
6. Классифицируй technical и cross-domain dependencies.
7. Определи graph owner, environments, state, errors и lifecycle.
8. Проверь правила и stop conditions.
9. Выдай решение, target structure, dependencies и порядок реализации.

Не предлагай файловое дерево до определения owners и boundaries. Имена файлов и segments следуют локальному стайлгайду, а не задаются SLM.

### Реализация

1. Зафиксируй принятое решение и change scope.
2. Изменяй код в dependency order: contracts и behavior раньше adapters и assembly, providers/consumers после готовых API.
3. Для Level 1 не создавай отсутствующие роли Level 2.
4. Для Level 2 сначала реализуй types, errors, behavior и factories `business`.
5. Затем реализуй production adapters, assemblies и framework bindings, которые реально нужны задаче.
6. Собери междоменный graph в composition, `app`, request handler или test setup.
7. Переведи всех затронутых consumers на public paths.
8. Удали obsolete exports, deep imports и старые boundaries в согласованном scope.
9. Добавь tests рядом с owners.
10. Запусти доступные structural, type, unit, integration и architecture checks.

Не оставляй заведомо промежуточную смешанную границу как завершённый результат. Backward compatibility добавляй только для реального внешнего consumer, persisted contract или явно согласованной phased migration.

### Миграция Level 1 -> Level 2

1. Выбери ровно один domain module и докажи потребность Level 2.
2. Найди все consumers, exports, state, I/O, framework integration и lifecycle resources.
3. Вычисли dependency-connected migration radius до редактирования.
4. Спроектируй Domain API по scenarios и consumers, а не по текущим technical segments.
5. Перенеси модели, validation, transitions, outcomes и errors под authority `business`.
6. Объяви явные factory dependencies и по одной factory на API.
7. Оформи production technical implementations как adapter modules.
8. Создай минимум одну assembly для реального execution context.
9. Перенеси domain-specific framework responsibilities в Framework Group.
10. Оставь pages, routes и multi-domain UI в `compositions`.
11. Переключи external consumers и graph roots.
12. Удали прежний root API и старую форму домена.
13. Проверь, что итог содержит одну форму и не требует миграции соседних доменов.

Временное физическое сосуществование старой и новой структуры допустимо только внутри незавершённого изменения. Не объявляй его conforming state. Если атомарный cutover невозможен, сначала согласуй ограниченную compatibility strategy и срок её удаления.

### Архитектурное ревью

1. Определи review scope, SLM root и формы затронутых доменов.
2. Построй фактическую карту owners, public boundaries, imports и runtime injection.
3. Проверь structural правила класса `A` по наблюдаемым evidence.
4. Отдельно проверь смысловые правила класса `R`; отсутствие lint error не доказывает их соблюдение.
5. Проверь transitive `business` closure и environment graph.
6. Проверь state/cache/error/lifecycle ownership.
7. Проверь, что tests находятся у правильных owners и не дублируют весь behavior на каждом уровне.
8. Сначала сообщи findings по severity, затем краткий verdict и остаточные gaps.

Каждый finding содержит:

```text
Location:
Kind:
Rule or definition:
Evidence:
Impact:
Minimal remediation:
Required tests:
Confidence:
```

Не называй рекомендацию нарушением. Не подтверждай полное SLM conformance, если не исследовал весь нужный graph или не знаешь project mapping.

### Тестирование по владельцам

| Ответственность | Основная test boundary |
|---|---|
| Domain scenarios, validation, state и expected errors | `business` через соответствующую factory |
| Deterministic runtime/guards | `business` |
| Technical mapping и provider behavior | Adapter module |
| Graph composition, adapter selection, environment и cleanup | Assembly module |
| Provider, hook, form или query projection | Framework binding module |
| Multi-domain graph и lifecycle | Composition, `app` или другой graph owner |

Не повторяй полный business scenario suite в adapter, assembly и framework tests. Проверяй в каждой границе только принадлежащий ей behavior и integration contract.

## Anti-patterns

### Ownership и структура

- Выбирать слой или сущность по имени существующей папки.
- Размещать domain model или scenario в `infra`/`shared`.
- Оставлять page, route policy или multi-domain responsibility внутри домена.
- Делать Group, segment или component скрытым owner.
- Создавать общий module или Level 2 package на будущее.
- Требовать от component быть stateless: локальные data/lifecycle details допустимы, пока ответственность принадлежит parent module.

### Public boundaries

- Deep imports во внутренности module или `business`.
- Root barrel доменного пакета или Group.
- Export mutable store, context, client, adapter или singleton.
- Reexport client и server entry points через общий barrel.
- Создавать `business/runtime` без внешнего consumer.

### Business и runtime

- Импортировать SDK, storage, framework, state/query manager, platform API или hidden nondeterminism в `business`.
- Обходить boundary через helper, `shared` или type alias.
- Публиковать raw DTO или library-specific cache/store types в Domain API.
- Позволять adapter определять domain fallback, transition или error semantics.
- Прятать production adapter inline в assembly/composition.
- Позволять factory выбирать environment или assembly.

### Assembly, framework и cross-domain

- Добавлять scenario или API method в assembly.
- Вызывать factory/assembly из framework binding.
- Импортировать framework state, hooks или components другого домена.
- Импортировать чужую factory, assembly, adapter или API singleton.
- Прятать runtime dependency в service locator, mutable registry или event bus.
- Создавать pass-through adapter автоматически без проверки project policy и реальной boundary value.

### State и lifecycle

- Делать cache параллельной domain model.
- Строить optimistic domain value из raw form/DTO без business validation.
- Использовать file-level singleton без доказанного application scope.
- Запускать скрытую subscription/timer при создании API.
- Оставлять resource без scope или cleanup.
- Возвращать пустой `dispose` только для одинаковой формы assemblies.

### Процесс

- Выбирать Level 2 по размеру каталога.
- Генерировать полный package scaffold без потребности.
- Мигрировать соседние домены ради локального изменения.
- Копировать пример как нормативное дерево.
- Перечислять коды правил вместо анализа фактического graph и runtime.
- Задавать пользователю все открытые вопросы независимо от задачи.

## Stop conditions и адресные вопросы

Остановись до изменения публичной или runtime-границы, если:

- ответственность или owner не определены;
- одна ответственность имеет конкурирующих owners;
- неизвестны consumers изменяемого API;
- одна domain responsibility окажется в двух формах;
- planned edge создаёт цикл;
- environment compatibility нельзя установить;
- resource scope, multiplicity или cleanup неизвестны;
- изменение требует незапрошенной широкой миграции;
- локальные инструкции противоречат выбранной SLM boundary;
- корректность зависит от открытой semantics cancellation, concurrency, hydration или disposal;
- задача требует правил монорепозитория, versioning или нескольких SLM roots, которых текущий DRAFT не задаёт.

Задавай вопрос только при наличии trigger:

| Trigger | Что выяснить |
|---|---|
| L1 -> L2 или удаление старого API | Полный migration radius, атомарный cutover или compatibility strategy |
| Новая technical dependency | Ownership contract, timeout/retry/idempotency/order/subscription semantics |
| Abort или cancellable operation | Кто владеет cancellation и как она связана с cleanup/outcome |
| Публичные errors, RPC, server action | Expected failure, cancellation, unexpected defect и serialization policy |
| Store, persistence или external events | Initial state, transitions, reset, persistence и owner |
| Optimistic/concurrent mutations | Ordering, versioning, rollback/rebase и authoritative refresh |
| Assembly, lazy graph или новый root | Scope, multiplicity, owned/borrowed resources и disposal |
| SSR, hydration, RSC | Serialization boundary, validation/reset и executable/reference edges |
| Worker, edge, conditional exports | Реальные capabilities и resolver conditions |
| Готовый `infra` API совпадает с port | Нужен ли domain adapter или допустима прямая передача capability |

Можно продолжить с явным assumption только когда решение обратимо, не меняет owner/public API, не ослабляет environment boundary и не скрывает lifecycle.

## Проверочные списки

### До изменения файлов

- [ ] Найден SLM root и path mapping.
- [ ] Прочитаны локальные инструкции.
- [ ] Сформулирована responsibility.
- [ ] Назначен один owner.
- [ ] Выбраны layer и entity.
- [ ] Для domain выбрана одна form.
- [ ] Найдены реальные consumers.
- [ ] Спроектирован минимальный public API.
- [ ] Классифицированы static и runtime dependencies.
- [ ] Проверены layer, cross-domain и environment edges.
- [ ] Для resources определены scope и cleanup.
- [ ] Нет активного stop condition.

### После реализации

- [ ] Каждый module имеет отдельную boundary и public API.
- [ ] Нет deep imports и package/Group barrels.
- [ ] Layer matrix соблюдена.
- [ ] Общий module graph ацикличен.
- [ ] `business` import closure environment-neutral и technical-runtime-free.
- [ ] Cross-domain runtime APIs передаются аргументами.
- [ ] Client/server graphs не содержат несовместимый executable code.
- [ ] Facets `business` имеют допустимое содержимое и consumers.
- [ ] Production technical dependencies принадлежат нужным adapters.
- [ ] Assembly возвращает точный graph и cleanup, если владеет resource.
- [ ] Framework bindings получают готовые APIs.
- [ ] Technical и foreign errors не протекают наружу.
- [ ] Cache не подменяет business authority.
- [ ] Tests проверяют behavior соответствующих owners.
- [ ] После migration удалена старая form/boundary.

## Формат результата

Не печатай полную внутреннюю карточку и все checklists без необходимости. Пользователю нужен результат задачи.

| Режим | Обязательный результат |
|---|---|
| Design | Decision, owner/layer/form, boundaries, public APIs, dependencies, lifecycle, implementation order, assumptions |
| Implementation | Использованное решение, изменённые boundaries/files, API/import changes, tests/checks, отклонения и риски |
| Migration | Source/target forms, consumer map, phases, cutover, удаление старой boundary и completion gate |
| Review | Findings с evidence, verdict, remediation order, unresolved decisions и непроверенный scope |

Для однозначной локальной реализации достаточно кратко объяснить архитектурное решение и выполнить работу. Для дорогого, публично несовместимого или неоднозначного решения сначала покажи варианты и запроси выбор.

## Когда открывать references

| Ситуация | Reference |
|---|---|
| Нужна точная формулировка правила | [`rules/level-1.md`](./reference/draft/rules/level-1.md), [`rules/level-2.md`](./reference/draft/rules/level-2.md) |
| Неясен смысл сущности | [`level-1/terminology.md`](./reference/draft/level-1/terminology.md), [`level-2/terminology.md`](./reference/draft/level-2/terminology.md) |
| Сложный Level 1 module/dependency/lifecycle case | [`level-1/`](./reference/draft/level-1/README.md) |
| Package, business, factory или adapters | [`level-2/domains/`](./reference/draft/level-2/domains/README.md) |
| Cross-domain или environment edge | [`level-2/dependencies.md`](./reference/draft/level-2/dependencies.md) |
| State, cache, SSR или hydration | [`state-cache.md`](./reference/draft/level-2/domains/state-cache.md), [`open-questions.md`](./reference/draft/level-2/domains/open-questions.md) |
| Assembly lifecycle и cleanup | [`assemblies.md`](./reference/draft/level-2/domains/assemblies.md) |
| Full architecture review | [`level-1/validation.md`](./reference/draft/level-1/validation.md), [`level-2/validation.md`](./reference/draft/level-2/validation.md) |
| L1 -> L2 migration example | [`auth-example.md`](./reference/draft/level-2/domains/auth-example.md) |

Будущие project examples открывай только после архитектурной классификации. Используй их как evidence конкретной реализации для похожего stack/environment, но не копируй naming, дерево или дополнительные роли без потребности. Example никогда не переопределяет rule или terminology.
