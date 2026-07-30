# Проверка Level 2

> Граница автоматической проверки, архитектурного ревью и тестирования Level 2.

## Конфигурация проекта

Конфигурация проверки сопоставляет физические пути с доменными пакетами, metadata, SLM-модулями, Groups, тремя фасетами `business`, техническими зависимостями, adapter-модулями, публичными точками входа, метками сред выполнения и allowlist внешних пакетов, объявленных business-safe. Она отдельно распознаёт navigation Groups слоя `domains` и Groups внутри пакета.

Формат такой конфигурации пока не выбран. Независимо от формата проверка должна анализировать import-граф и объявленные границы, а не угадывать сущность только по имени папки.

## Автоматическая проверка

Автоматическая проверка должна блокировать:

- исполняемый файл, root `index.ts`, состояние или реэкспорт в корне доменного пакета;
- отсутствие `business` или несколько модулей `business` в одном пакете;
- отсутствие любого из трёх entry points `business`, `business/factory`, `business/error`, runtime export из корневого barrel, type export из runtime-фасета, другой публичный путь либо deep import внутри `business`;
- импорт фасета `business` потребителем, которому этот фасет не разрешён;
- отсутствие непосредственно в корне пакета непустой Group `presets` или наличие в ней прямого дочернего элемента без объявленной модульной границы;
- deep imports во внутренние части модулей;
- runtime- или type-only достижимость framework-, adapter-, preset-, infra- или environment-specific кода из `business`;
- runtime-импорт любого экспорта другого доменного пакета;
- type-only импорт не из публичной точки входа `business` другого доменного пакета;
- импорт framework state, hooks, contexts или components другого домена;
- достижимость server-only кода из client-entry point и обратное несовместимое направление;
- runtime- или type-only циклы в графе модулей.

## Архитектурное ревью

На ревью определяется:

- представляет ли пакет одну связную предметную область;
- является ли `DomainApi` единственным runtime-источником доменных данных и результатов для приложения;
- является ли фабрика единственным runtime-экспортом `business/factory`;
- содержит ли `business/error` только runtime-коды и guards, а type-only barrel именованные типы DomainError и DomainErrorCode;
- преобразует ли business ожидаемые технические и cross-domain сбои в собственные ошибки;
- является ли каждая production-реализация технической зависимости отдельным модулем Group `adapters`, включая реализации, используемые только в одном месте;
- отсутствуют ли production adapters вне Group `adapters` во всём production-графе; test-only fakes не участвуют в этой проверке;
- представляет ли каждый preset один реальный контекст выполнения и сохраняет ли контракт фабрики;
- принадлежит ли каждый framework binding module домену, а не странице или multi-domain сценарию;
- соответствует ли каждый объявленный business-safe внешний пакет ограничениям детерминированной библиотеки без runtime capability;
- остаются ли Framework Groups и другие Groups без реализации и агрегирующего API.

## Тестирование

Business-сценарии проверяются через `business/factory` с управляемыми test fakes. Adapter module проверяет техническое преобразование. Preset проверяет границу среды и, при наличии технических зависимостей, выбор adapter-модулей. Framework binding module проверяет собственный Provider, hook или component без повторения всего набора business-сценариев.

Import-graph checks не заменяются runtime-тестами.

## Миграционное состояние

Наличие доменных модулей Level 1 рядом с пакетами Level 2 допускается только как незавершённая миграция. Проверка полного соответствия Level 2 завершается ошибкой, пока в выбранном SLM root остаются простые доменные модули. Во время перехода отдельно проверяется отсутствие runtime- и type-only импортов между двумя формами.

## Связанные правила

- [`SLM-L2-DOMAIN-A003`](../rules/level-2.md#slm-l2-domain-a003)
- [`SLM-L2-BUSINESS-A007`](../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-MIGRATION-A017`](../rules/level-2.md#slm-l2-migration-a017)
- [`SLM-L2-BUSINESS-R018`](../rules/level-2.md#slm-l2-business-r018)
- [`SLM-L2-BUSINESS-A019`](../rules/level-2.md#slm-l2-business-a019)
- [`SLM-L2-PRESET-A020`](../rules/level-2.md#slm-l2-preset-a020)
- [`SLM-L2-ADAPTER-R021`](../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-BUSINESS-A022`](../rules/level-2.md#slm-l2-business-a022)
- [`SLM-L1-DEPENDENCY-A005`](../rules/level-1.md#slm-l1-dependency-a005)

Скрипт `draft-rules.js` проверяет целостность реестров и ссылок документации, но не архитектуру приложения.
