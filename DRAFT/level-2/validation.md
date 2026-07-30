# Проверка Level 2

> Граница автоматической проверки, архитектурного ревью и тестирования Level 2.

## Конфигурация проекта

Конфигурация проверки сопоставляет физические пути с доменными модулями Level 1, доменными пакетами Level 2, metadata, SLM-модулями, Groups, фасетами `business`, техническими зависимостями, adapter-модулями, assemblies, публичными точками входа, метками сред выполнения и allowlist внешних business-safe пакетов.

Формат такой конфигурации пока не выбран. Независимо от формата проверка анализирует объявленные границы и import-граф, а не угадывает сущность только по имени папки.

## Автоматическая проверка

Автоматическая проверка блокирует:

- одновременное объявление одной предметной области доменным модулем и пакетом;
- исполняемый файл, root `index.ts`, состояние или реэкспорт в корне доменного пакета;
- отсутствие `business` или несколько модулей `business` в одном пакете;
- отсутствие `business` либо `business/factory`, runtime export из корневого barrel, export не-фабрики из `business/factory`, type export из `business/runtime`, другой публичный путь либо deep import внутри `business`;
- импорт фасета `business` потребителем, которому этот фасет не разрешён;
- отсутствие непосредственно в корне пакета непустой Group `assemblies` или наличие в ней прямого дочернего элемента без объявленной модульной границы;
- deep imports во внутренние части модулей;
- runtime- или type-only достижимость framework-, adapter-, assembly-, infra- или environment-specific кода из `business`;
- запрещённый runtime-импорт через границу пакета Level 2;
- type-only импорт не из публичной точки входа владельца;
- импорт framework state, hooks, contexts или components другого домена;
- достижимость server-only кода из client-entry point и обратное несовместимое направление;
- runtime- или type-only циклы в графе модулей.

Статический анализ может отдельно находить прямые вызовы `Date.now`, `Math.random`, `crypto.randomUUID`, timers и чтение env внутри `business`. Окончательное решение о скрытом недетерминизме остаётся за ревью.

## Архитектурное ревью

На ревью определяется:

- представляет ли пакет одну связную предметную область;
- принадлежит ли каждая соседняя область ровно одной форме независимо от форм других доменов;
- принадлежат ли публичные сценарии ровно одному из именованных Domain API;
- оправдано ли разделение API разными consumers, dependencies или assemblies, а не техническим дроблением;
- остаются ли модель, validation и transitions под предметной властью `business`;
- не создаёт ли state/query cache параллельную продуктовую модель или raw DTO boundary;
- соответствует ли каждой фабрике ровно один API и остаётся ли она environment-neutral;
- содержит ли `business/runtime` только реально публичные deterministic values и functions;
- преобразует ли business ожидаемые technical и cross-domain сбои в собственные ошибки;
- является ли каждая связная production-реализация технических dependencies отдельным модулем Group `adapters`;
- представляет ли каждая assembly один реальный контекст выполнения и возвращает ли точный именованный граф;
- не запускают ли фабрики и assemblies скрытую долгоживущую работу при создании графа;
- предоставляет ли assembly cleanup только для действительно созданного ею lifecycle-ресурса и вызывает ли graph owner этот cleanup;
- принадлежит ли каждый framework binding module домену, а не странице или multi-domain сценарию;
- соответствует ли каждый объявленный business-safe внешний пакет ограничениям детерминированной библиотеки без runtime capability;
- остаются ли Framework Groups и другие Groups без реализации и агрегирующего API.

## Тестирование

Business-сценарии проверяются через соответствующие фабрики с управляемыми test fakes, включая fake clock/random/id при необходимости. Adapter module проверяет technical transformation. Assembly проверяет состав графа, выбор adapters, environment boundary и условный cleanup. Framework binding module проверяет собственный Provider, hook, cache integration или component без повторения полного набора business-сценариев.

Import-graph checks не заменяются runtime-тестами.

## Смешанный SLM root

Наличие доменных модулей Level 1 рядом с пакетами Level 2 является завершённым допустимым состоянием. Проверка применяет правила формы отдельно к каждой предметной области и правила Level 2 ко всем статическим связям, пересекающим пакетную границу.

Переход одного домена завершается, когда его старая модульная граница удалена и checker видит только пакет. Другие домены не входят в критерий завершения.

## Связанные правила

- [`SLM-L2-DOMAIN-A003`](../rules/level-2.md#slm-l2-domain-a003)
- [`SLM-L2-BUSINESS-A007`](../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-DOMAIN-A026`](../rules/level-2.md#slm-l2-domain-a026)
- [`SLM-L2-BUSINESS-R018`](../rules/level-2.md#slm-l2-business-r018)
- [`SLM-L2-BUSINESS-A019`](../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-ASSEMBLY-A020`](../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L2-ASSEMBLY-R023`](../rules/level-2.md#slm-l2-assembly-r023)
- [`SLM-L2-BUSINESS-R024`](../rules/level-2.md#slm-l2-business-r024)
- [`SLM-L2-BUSINESS-R025`](../rules/level-2.md#slm-l2-business-r025)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

Скрипт `draft-rules.js` проверяет целостность реестров и ссылок документации, но не архитектуру приложения.
