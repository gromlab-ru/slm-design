# Проверка Level 2

> Граница автоматической проверки, architecture review и contract tests Level 2.

## Конфигурация проекта

Конфигурация проверки сопоставляет физические пути с:

- доменными модулями Level 1 и пакетами Level 2;
- metadata, SLM-модулями и Groups;
- фасетами `api`;
- dependency ports и adapter modules;
- assemblies и их baseline/special contexts;
- public entry points;
- executable, type-only, framework reference и deferred edges;
- environment capability sets, resolver conditions и framework execution phases;
- API-safe external packages;
- runtime assembly inputs и создаваемыми API, если проект автоматизирует runtime DAG.

Формат такой конфигурации пока не выбран. Проверка анализирует объявленные boundaries и resolved graphs, а не угадывает сущность только по имени папки.

## Автоматическая проверка

Каждое правило класса `A` реализуется блокирующей проверкой проекта. Автоматическая проверка обнаруживает:

- одновременное объявление одной предметной области module и package;
- executable file, root `index.ts`, state или reexport в корне package;
- отсутствие `api` или несколько модулей `api`;
- отсутствие `api` либо `api/factory`;
- недопустимый type/runtime export kind фасетов `api`, `api/ports`, `api/factory` и `api/runtime`;
- другой public path или deep import внутри `api`;
- отсутствие Group `assemblies` или модуля `assemblies/default`;
- прямой дочерний элемент `assemblies` или `adapters` без module boundary;
- нарушение importer matrix ports, factories и concrete adapters;
- достижимость adapter, assembly, framework, SDK, storage, state/query runtime или environment-specific code из `api`;
- запрещённый cross-domain import;
- type-only import не из public facet владельца;
- import framework state, hooks, contexts или components другого домена;
- несовместимую executable reachability под каждым configured resolver condition set;
- runtime- или type-only cycles статического module graph.

Проверка external package reachability использует project allowlist API-safe packages. Решение о том, соответствует ли package критериям API-safe, принимается на review; автоматизация проверяет объявленный label и фактически resolved entries.

Неанализируемые dynamic imports запрещаются или явно allowlist-ятся project policy с target capability set.

## Architecture review

На review определяется:

- представляет ли package одну связную предметную область;
- является ли `api` единственным семантическим шлюзом домена;
- соответствуют ли exports `api` реальным consumer contracts, `api/ports` implementer contracts, а `api/factory` объявленным Domain API factories;
- отличаются ли public models от raw provider DTO там, где это необходимо;
- принадлежат ли operations ровно одному Domain API;
- оправдано ли разделение нескольких Domain API независимой сборкой, trust или consumers;
- описывают ли ports consumer-owned capabilities, а не endpoints конкретного SDK;
- достаточна ли closed failure algebra для выбора domain outcomes;
- преобразуются ли provider и foreign-domain failures в собственные errors;
- является ли каждая production implementation отдельным adapter module;
- не выполняют ли framework bindings предметные external operations в обход API;
- не создаёт ли framework projection параллельную модель;
- определены ли optimistic ordering, versioning и reconciliation модулем `api`;
- представляет ли `default` один реальный baseline capability context;
- оправданы ли дополнительные assemblies реальным отличием graph;
- остаётся ли runtime assembly graph ацикличным;
- создаётся ли только dependency-connected часть production graph;
- полностью ли определены lifecycle и cleanup failure paths;
- соответствует ли каждый API-safe package ограничениям;
- остаются ли Groups без implementation и aggregate API.

## Environment review

Для каждого public entry point рассматриваются реальные executable imports под заявленными conditions. Отдельно проверяются:

- RSC server execution;
- Client Component references;
- server prerender graph Client Components при включённом SSR;
- browser hydration graph Client Components;
- framework-deferred browser effects;
- Server Action references;
- browser, Node.js, edge и worker capabilities;
- conditional exports external packages;
- dynamic imports;
- serialization boundaries.

Название `default`, `rsc`, `server` или `client` не является доказательством совместимости. Tree shaking и runtime branching также не являются доказательством.

## Realtime review

Для каждого realtime port фиксируются:

- correlation scope и ACK semantics;
- ordering и duplicate policy;
- disconnect, timeout и `OUTCOME_UNKNOWN`;
- idempotency и retry;
- reconnect, gap detection и resync;
- cancellation;
- shared connection owner;
- cleanup и запрет callbacks после disposal.

Без этих guarantees adapter нельзя считать проверяемой реализацией port.

## Testing

Domain API проверяется через factory с fake ports. Adapter проверяется contract tests concrete provider. Assembly проверяет production wiring, capabilities, partial construction и cleanup. Framework binding проверяет projection, hydration и lifecycle с fake API.

Import-graph checks не заменяются runtime tests, а API fake не заменяет adapter contract test.

## Смешанный SLM root

Наличие доменных модулей Level 1 рядом с пакетами Level 2 является завершённым допустимым состоянием. Проверка применяет правила формы отдельно к каждой предметной области и правила Level 2 ко всем статическим связям, пересекающим package boundary.

Переход одного домена завершается, когда его старая module boundary удалена и checker видит только package. Другие домены не входят в критерий формы, но dependency-connected consumers и graph owners входят в change radius.

## Связанные правила

- [`SLM-L2-DOMAIN-A003`](../rules/level-2.md#slm-l2-domain-a003)
- [`SLM-L2-API-A007`](../rules/level-2.md#slm-l2-api-a007)
- [`SLM-L2-DEPENDENCY-A012`](../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-ENVIRONMENT-A013`](../rules/level-2.md#slm-l2-environment-a013)
- [`SLM-L2-API-A019`](../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ASSEMBLY-A020`](../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-API-A022`](../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-DOMAIN-A026`](../rules/level-2.md#slm-l2-domain-a026)

Скрипт `draft-rules.js` проверяет целостность реестров и ссылок документации, но не архитектуру приложения.
