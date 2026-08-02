# Терминология Level 2

> Нормативные определения рабочего черновика. Этот раздел не объявляет правила.

Level 2 наследует терминологию и матрицу слоёв Level 1. Он применяется отдельно к предметным областям, которым нужна пакетная форма с контролируемым Domain API, dependency ports, production adapters, штатной assembly и самостоятельными framework bindings.

## Формы домена

### Форма домена

Структурное представление одной доменной ответственности. На Level 1 предметная область представлена доменным модулем. Для предметной области, использующей Level 2, этот модуль заменяется доменным пакетом. Одна предметная область не использует обе формы одновременно.

### Доменный пакет

Самостоятельная контейнерная предметная граница слоя `domains`, представляющая одну доменную ответственность. Доменный пакет не является модулем или Group. Он объединяет SLM-модули и Groups одной предметной области, но не имеет собственного исполняемого кода, состояния, жизненного цикла, публичного API или узла статического графа зависимостей.

Корень пакета может содержать только декларативную metadata, обязательный модуль `api` и допустимые Groups. Metadata хранит статические данные о пакете, владении, environment capability sets и конфигурации проверки и не содержит кода, выполняемого приложением.

Доменный пакет является policy boundary: проверка использует объявленную принадлежность модулей пакету для контроля структуры, внешних источников и междоменных связей. Публичными dependency boundaries кода остаются модули внутри пакета, а не пакет целиком.

### Навигационная Group слоя `domains`

Group, размещённая непосредственно в слое `domains` или другой такой Group. Она классифицирует доменные модули Level 1, доменные пакеты Level 2 и другие навигационные Groups, но не содержит исполняемый код и не образует dependency boundary.

### Модуль доменного пакета

Обычный SLM-модуль внутри доменного пакета. Его ответственность относится к одной роли пакета: Domain API, assembly, adapter или framework binding. Каждый такой модуль имеет отдельную папку, публичный API и узел статического графа зависимостей.

Модуль внутри Group пакета не является вложенным модулем, потому что его ближайшая внешняя граница не является модулем.

## Доменный API

### Модуль `api`

Обязательный SLM-модуль `api`, который является семантическим шлюзом предметной области для приложения. Он объявляет публичные модели, один или несколько именованных Domain API, соответствующие фабрики, dependency ports, ожидаемые доменные ошибки и необходимый внешним потребителям детерминированный runtime.

Модуль `api` определяет смысл данных и операций, но не является framework store или query cache. Он не импортирует SDK, transport client, storage implementation, framework, state/query manager или platform I/O. Его экземпляры замыкают переданные ports и могут координировать отдельную операцию, но не служат скрытым изменяемым источником данных приложения между вызовами.

Термин **публичный API модуля `api`** обозначает фасеты SLM-модуля. Термин **Domain API** обозначает именованный runtime-контракт предметных операций. Эти понятия не взаимозаменяемы.

### Domain API

Именованный публичный runtime-контракт связного набора предметных команд, запросов или подписок внутри одного домена. Потребитель вызывает Domain API и получает только публичные модели, outcomes и ошибки предметной области, не зная provider, endpoint, SDK или transport protocol.

Модуль `api` может объявить несколько Domain API, если они независимо собираются, имеют разные ports, trust boundaries или реальные consumers. Каждый публичный сценарий принадлежит ровно одному Domain API. APIs с общим неразделимым состоянием, atomicity или lifecycle образуют один контракт либо получают один явно созданный shared capability через assembly.

### Публичная доменная модель

Readonly-форма данных, которую Domain API принимает или возвращает внешнему потребителю. Публичная доменная модель принадлежит модулю `api`, не является backend DTO, cache record или framework view model и экспортируется только при наличии реального consumer.

Внутренняя модель модуля `api`, port record и framework view model могут иметь другую форму и не становятся публичными только из-за принадлежности тому же домену.

### Семантическая власть Domain API

Право определять публичную доменную модель, validation внешних значений, допустимые предметные transitions, семантику операций, outcomes и ожидаемых ошибок. Adapter, assembly или framework binding может транспортировать, хранить, кэшировать и отображать значения, но не становится независимым источником этих решений.

### Публичные фасеты `api`

Объявленные entry points одного логического публичного API модуля `api`:

| Путь | Статус | Содержимое |
|---|---|---|
| `api` | Обязательный | Только consumer-facing types: Domain API, public models, commands, outcomes и domain errors |
| `api/factory` | Обязательный | Только именованные runtime-фабрики Domain API |
| `api/ports` | При наличии dependency ports | Только implementer-facing types: ports, port records, port failures и factory dependency types |
| `api/runtime` | Необязательный | Только публичные детерминированные runtime-значения и функции |

Фасет `api/runtime` может публиковать устойчивые error codes и guards, validators, value constructors, pure transitions, reconciliation functions, предметные константы и чистые projections, если они нужны реальным внешним потребителям. Он не содержит фабрики, изменяемое состояние, ввод-вывод, подписки, сценарии с runtime-зависимостями или environment-specific код.

Фасеты не являются сегментами, вложенными модулями или самостоятельными узлами графа. Любой другой внешний путь внутрь `api` является deep import.

### API-safe внешний пакет

Внешняя библиотека, допустимая в import-графе модуля `api`: детерминированная, environment-neutral, не выполняющая ввод-вывод и не владеющая изменяемым состоянием или runtime capability. SDK, generated client, storage, state manager, query runtime, framework и техническая интеграция не становятся API-safe только из-за совместимости с несколькими средами.

### Фабрика Domain API

Публичная функция фасета `api/factory`, которая получает явные dependency ports и cross-domain API dependencies и создаёт экземпляр одного объявленного Domain API. Каждому Domain API соответствует ровно одна публичная фабрика.

Фабрика не выбирает concrete adapter, assembly, environment или framework, не создаёт framework state и не запускает запрос, socket, subscription, timer или другую долгоживущую работу во время создания API.

## Ports, adapters и ошибки

### Dependency port

Consumer-owned контракт runtime-возможности, которая нужна модулю `api` и требует production-реализации. Port определяет минимальные операции, success values, закрытые expected failures и существенные behavioral guarantees со стороны потребителя capability, а не копирует API конкретного provider.

К ports относятся источники данных, external command gateways, storage, platform capabilities, clock, timer, random, ID generator и realtime event sources. Framework state/query manager, materialized cache и готовый API другого домена не являются dependency ports.

Port и связанные implementer-facing types принадлежат модулю `api` и публикуются через type-only фасет `api/ports`. Они не содержат SDK classes, generated DTO, HTTP status, `WebSocket`, framework hooks или другие concrete provider types.

### Port record

Технически нейтральная форма значения на границе port, достаточная модулю `api` для validation и преобразования в публичную доменную модель. Port record принадлежит implementer-facing контракту и не является публичной моделью приложения или raw provider DTO.

### Port failure

Закрытый implementer-facing набор ожидаемых сбоев dependency port, достаточный модулю `api` для выбора собственного outcome или domain error. Adapter преобразует provider-specific failure в port failure; модуль `api` преобразует port failure в публичную семантику.

Cancellation и неопределённый результат операции объявляются отдельно, если потребитель способен различать их. Unexpected programming failure не маскируется под expected port failure.

### Доменная ошибка

Безопасная публичная форма ожидаемого сбоя операции Domain API. Модуль `api` объявляет устойчивый readonly сериализуемый тип с кодом; при необходимости runtime-коды и guards публикуются через `api/runtime`.

Ошибки provider, SDK, транспорта, storage, adapter или другого домена не являются доменными ошибками текущего API. Публичная ошибка не содержит исходные `message`, status, payload, class, stack или `cause`. Способ передачи ошибки, например exception или discriminated `Result`, не изменяет её владельца.

### Cross-domain API dependency

Готовый публичный API доменного модуля Level 1 или Domain API пакета Level 2, необходимый операции текущего Domain API. Это отдельный вид runtime-зависимости, а не dependency port и не adapter. Graph owner создаёт независимый API раньше зависимого и передаёт готовое значение assembly, которая передаёт его фабрике.

Локальный bridge port вводится только при реальном переводе чужого контракта, а не автоматически для каждого междоменного ребра.

### Adapter

SLM-модуль в Group `adapters`, который реализует один или несколько связанных dependency ports поверх SDK, generated client, storage, transport, platform API, данных запроса или технического сервиса. Одна связная production-реализация принадлежит одному adapter-модулю и не размещается внутри assembly, framework binding или composition.

Adapter знает concrete provider и переводит его arguments, records и expected failures в контракт port. Он не объявляет операции Domain API, публичные доменные модели, предметные fallbacks или domain errors.

### Source cache

Технический cache внешнего источника внутри adapter: transport deduplication, connection state, provider retry или хранение port records. Source cache не является публичной доменной моделью и не передаёт наружу library-specific keys, clients или result types. Adapter является владельцем созданного им cache и экспортирует lifecycle handle; assembly может агрегировать этот cleanup, не становясь вторым владельцем. Если resource создаёт assembly, adapter получает его как borrowed capability.

## Assemblies и runtime-граф

### Assembly

SLM-модуль в Group `assemblies`, который создаёт явный именованный граф одного или нескольких Domain API пакета для одного объявленного production-контекста. Assembly выбирает публичные adapter-модули своего домена, вызывает фабрики и может принимать готовые API других доменов аргументами.

Assembly не добавляет предметные операции, модели или ошибки. Импорт assembly не создаёт API и не запускает side effects; граф появляется только при явном вызове её builder.

### Default assembly

Обязательный модуль `assemblies/default`, который создаёт штатный production-граф домена для одного baseline capability set, объявленного проектом. Имя `default` означает каноническую сборку проекта, но не означает browser-, server-, shared- или isomorphic-совместимость.

Для React + Vite `default` может быть browser-only. Для Next.js она может быть действительно изоморфной, только если каждый executable import совместим со всеми заявленными resolver conditions. Отличающийся набор API, dependencies, trust, runtime capabilities или lifecycle получает отдельную именованную assembly, например `rsc`, `administration` или `realtime-session`.

### Дополнительная assembly

Assembly, отличная от `default` и представляющая реальный дополнительный production-контекст. Имя может отражать environment только тогда, когда environment действительно определяет wiring; наличие RSC, server action или worker само по себе не требует отдельной assembly при неизменном совместимом графе.

### Graph owner

Composition root уровня `app`, `composition`, request handler, worker entry или test setup, который вызывает assemblies в ацикличном порядке, передаёт готовые cross-domain API зависимым assemblies и владеет областью жизни совокупного графа.

Graph owner импортирует production builders assemblies, но не `api/factory` или concrete adapters. Он создаёт только dependency-connected часть графа, необходимую текущему application, route, request, worker или test scope.

### Ресурс assembly

Ресурс жизненного цикла, владельцем которого является assembly и который она обязана создать для возвращаемого графа. Adapter-owned resource сохраняет adapter owner и передаёт assembly только lifecycle handle для aggregate cleanup; borrowed resource не закрывается получателем.

Assembly немедленно регистрирует каждое cleanup obligation: cleanup собственного resource и полученный adapter lifecycle handle. При частичной ошибке все зарегистрированные obligations выполняются в обратном порядке. Успешный результат с хотя бы одним obligation предоставляет идемпотентный aggregate async cleanup, после завершения которого resources не вызывают callbacks. Только graph без cleanup obligations не возвращает пустой `dispose`.

## State, cache и framework

### Framework projection

Материализованное состояние или cache, которое framework binding строит из public models, outcomes и events Domain API для rendering, revalidation, optimistic UI и координации интерфейса. Concrete runtime может быть TanStack Query, SWR, Apollo, Zustand, Redux, Pinia, Signals или механизм конкретного framework.

Framework projection принадлежит binding или composition, а не модулю `api`. Она может хранить значения и технические статусы, но не определяет параллельную предметную модель. Предметный optimistic merge, ordering, rollback, reconciliation или transition производится операцией Domain API либо детерминированной функцией `api/runtime`.

### Hydration payload

Сериализуемая framework-owned форма переноса projection между server и client scopes. Payload содержит только разрешённые публичные доменные значения и framework metadata и не содержит API instances, functions, mutable cache clients, ports, adapters или request secrets.

Server и client создают отдельные API instances и framework caches. RSC передаёт через client boundary только сериализуемые значения или hydration payload; Server Action создаёт собственный request-scoped граф на каждый вызов.

### Framework Group

Group доменного пакета, названная по конкретному фреймворку: `react`, `vue` и аналогично. Она содержит framework binding modules, не имеет собственного `index.ts`, реализации, состояния, жизненного цикла или публичного API.

### Framework binding module

SLM-модуль внутри Framework Group, ответственность которого ограничена domain-specific интеграцией готового Domain API с конкретным framework. Он может владеть Provider, hooks, query policy, framework projection, hydration и переиспользуемым domain-specific UI.

Framework binding module получает готовый Domain API, не вызывает его фабрику или assembly и не выбирает adapters. Он не импортирует framework state, hooks или components другого домена и не обращается к предметному external source в обход Domain API.

Framework-only SDK допустим внутри binding только для получения opaque operation input, например token от CAPTCHA или payment element; предметная операция всё равно выполняется через Domain API, а SDK type не пересекает его публичную границу.

## Realtime

### Realtime port

Dependency port для двусторонних сообщений или подписок поверх WebSocket, SSE, GraphQL subscription, provider SDK или другого push-транспорта. Realtime port описывает предметно необходимую capability и проверяемые guarantees, но не публикует transport frames или concrete client.

### Realtime-команда

Операция Domain API, отправляемая через realtime port и имеющая объявленный момент подтверждения. Если приложение должно получить индивидуальный outcome, protocol adapter сопоставляет command, acknowledgement и failure посредством correlation metadata.

Разрыв соединения после отправки и до подтверждения может означать неопределённый outcome. Без idempotency key или provider guarantee такой исход не объявляется безопасным failure или автоматически повторяемой командой.

### Realtime subscription

Явная операция Domain API, которая публикует только проверенные domain events, statuses и errors и предоставляет cleanup. Realtime port определяет ordering, duplicate delivery, reconnect, gap detection, resync, cancellation и момент, после которого завершившийся cleanup гарантирует отсутствие новых callbacks.

Shared physical connection принадлежит adapter или assembly с явными scope, multiplicity и cleanup. Framework binding решает, как материализовать domain events: обновить projection, применить API-owned transition либо invalidировать cache и повторно запросить snapshot через Domain API.

## Environment

### Environment capability set

Явно объявленный набор runtime-возможностей, доступных конкретной точке входа или assembly: DOM, cookies, filesystem, worker API, edge API, framework server runtime и аналогично. Название папки не определяет capability set.

Совместимость проверяется по executable import-графу для каждого поддерживаемого набора resolver conditions и framework execution phase, включая server prerender и browser hydration. Runtime branching и tree shaking не доказывают изоляцию несовместимых импортов.

### Framework reference edge

Связь, которую framework преобразует в ссылку на другой executable graph вместо обычного runtime-вызова, например ссылка Server Component на Client Component или client invocation Server Action. Такая связь объявляется конфигурации проверки и анализируется отдельно от executable и type-only edges, но не отменяет проверку всех сред, в которых target graph исполняется самостоятельно.

RSC не является универсальной третьей средой рядом с browser и server. Server Component выполняется в server scope. Client Component участвует в browser hydration и, при включённом SSR или prerender, также исполняется в отдельном server render graph; framework-deferred browser effects проверяются отдельно. Между RSC и client graph проходит serialization/reference boundary.

## Структурная модель

```text
SLM root
└── domains
    ├── доменный модуль Level 1
    └── доменный пакет Level 2
        ├── metadata
        ├── модуль api
        │   ├── api
        │   ├── api/factory
        │   ├── api/ports при наличии ports
        │   └── api/runtime при наличии consumers
        ├── обязательная Group assemblies
        │   ├── модуль default
        │   └── дополнительные assembly-модули
        ├── Group adapters при наличии ports
        │   └── adapter-модуль
        └── Framework Group react
            ├── модуль session
            └── модуль queries
```
