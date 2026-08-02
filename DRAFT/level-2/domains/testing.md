# Тестирование доменного пакета

> Проверка Domain API, port contracts, production wiring и framework projections Level 2.

## Связанные правила

- [`SLM-L2-TEST-R016`](../../rules/level-2.md#slm-l2-test-r016)
- [`SLM-L2-API-A019`](../../rules/level-2.md#slm-l2-api-a019)
- [`SLM-L2-ASSEMBLY-A020`](../../rules/level-2.md#slm-l2-assembly-a020)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-API-A022`](../../rules/level-2.md#slm-l2-api-a022)
- [`SLM-L2-ASSEMBLY-R023`](../../rules/level-2.md#slm-l2-assembly-r023)
- [`SLM-L2-API-R024`](../../rules/level-2.md#slm-l2-api-r024)
- [`SLM-L2-PORT-R027`](../../rules/level-2.md#slm-l2-port-r027)
- [`SLM-L2-REALTIME-R029`](../../rules/level-2.md#slm-l2-realtime-r029)
- [`SLM-L2-ASSEMBLY-R030`](../../rules/level-2.md#slm-l2-assembly-r030)

## Размещение

Тест находится рядом с module-owner проверяемой ответственности. У доменного пакета нет общей корневой папки `tests`.

| Проверяемая граница | Владелец теста |
|---|---|
| Domain API operations, models, outcomes и errors | `api` через factory |
| Deterministic runtime и guards | `api` |
| Реализация dependency port | Adapter |
| Default и специальный production graph | Assembly |
| Provider, hook, query/store integration и hydration | Framework binding |
| Cross-domain graph | Graph owner |

## Domain API через фабрику

Каждый публичный сценарий проверяется через фабрику владеющего им Domain API с управляемыми fake ports:

```ts
import type {
  AuthSessionApi,
} from '@/domains/auth/api'

import type {
  AuthIdentityPort,
} from '@/domains/auth/api/ports'

import {
  createAuthSessionApi,
} from '@/domains/auth/api/factory'

const identity: AuthIdentityPort = createIdentityPortFake({
  signIn: {
    ok: true,
    value: {
      expiresAt: 1_700_000_000_000,
      subject: 'user-1',
    },
  },
})

const api: AuthSessionApi = createAuthSessionApi({
  identity,
  runtime: {
    createId: () => 'id-1',
    now: () => 1_700_000_000_000,
  },
})
```

API suite проверяет:

- public models и outcomes;
- validation commands и port records;
- mapping каждого expected port failure;
- отсутствие raw provider details в domain errors;
- cancellation и outcome uncertainty при наличии;
- pure transitions и reconciliation;
- каждый API отдельно при нескольких factories.

API-тест не использует React, production assembly, реальный SDK, backend, system clock или module singleton.

## Adapter contract test

Adapter test доказывает, что concrete provider реализует port:

- правильно преобразует arguments;
- валидно читает provider record;
- возвращает port record, а не raw DTO;
- различает закрытые port failures;
- не создаёт public domain error;
- соблюдает cancellation, timeout и lifecycle contract;
- использует заявленный environment capability set.

Fake port в API-тесте не заменяет adapter contract test. Идеальный fake может соответствовать типу, пока реальный endpoint или SDK уже изменился.

## Default assembly

Тест `assemblies/default` проверяет:

- вызов только нужных API factories;
- выбор штатных adapter modules;
- точный именованный состав graph;
- объявленный baseline capability set;
- отсутствие module-import side effects;
- передачу cross-domain API аргументом;
- отсутствие factory/adapter leakage наружу;
- aggregate cleanup, если assembly создаёт owned resource или получает adapter lifecycle handle.

Каждая дополнительная assembly тестирует отличие своего production context, а не повторяет полный API suite.

## Partial construction и cleanup

Assembly test моделирует ошибку после регистрации каждого cleanup obligation, включая adapter-owned handle:

```text
resource A created
resource B creation failed
  → cleanup A awaited
  → original failure propagated
```

Проверяются reverse dependency order, idempotent repeated disposal, попытка очистить все resources и отсутствие callbacks после завершившегося cleanup.

Assembly без cleanup obligations не тестирует пустой `dispose`, потому что не обязана его предоставлять. Если adapter передал lifecycle handle, obligation существует независимо от resource ownership.

## Framework binding

Framework test получает fake готового Domain API и проверяет собственную responsibility:

- Provider и hook;
- query keys, stale policy и invalidation;
- store projection;
- optimistic update через API-owned function;
- hydration payload;
- public domain errors;
- subscription cleanup;
- отсутствие direct SDK/external source access.

Framework test не повторяет validation и failure mapping всех API operations.

## Realtime

API realtime test с fake port проверяет public events, stable errors, acknowledgement semantics и `OUTCOME_UNKNOWN` mapping.

Adapter realtime contract test проверяет:

- command correlation;
- duplicate и late acknowledgement;
- disconnect до ACK;
- ordering и sequence gaps;
- reconnect и resync;
- malformed frames;
- cancellation и unsubscribe;
- отсутствие callbacks после cleanup.

Assembly test отдельно проверяет shared connection, multiplexing, rollback и graph-level disposal. Framework test проверяет только materialization events и invalidation.

## SSR, RSC и Server Actions

Environment tests подтверждают:

- request-scoped API и cache не разделяются между users;
- API instance не входит в hydration payload;
- Client Component создаёт отдельный client graph;
- SSR-enabled Client Component проверяется в server prerender и browser hydration graphs;
- browser-only effect не выполняется во время server render;
- Server Action создаёт и очищает graph на каждый вызов;
- framework reference edge не превращается в executable client/server leak;
- `default` проверяется под всеми объявленными resolver conditions.

## Cross-domain graph

Graph owner test создаёт assemblies и construction points модулей Level 1 в dependency order и проверяет runtime inputs и callbacks. Отдельно проверяется невозможность mixed L1/L2 циклической сборки и reverse cleanup order.

Не достаточно проверить только статический import DAG: runtime dependencies, передаваемые arguments, должны быть представлены architecture mapping или review evidence.

## Автоматические структурные проверки

Import и export checks подтверждают:

- отсутствие root API пакета и Groups;
- обязательные `api`, `api/factory` и `assemblies/default`;
- `api/ports` только при наличии declared ports;
- допустимые exports каждого фасета;
- importer matrix factories, ports и concrete adapters;
- отсутствие deep imports;
- отсутствие SDK, framework и state/query runtime в graph `api`;
- отсутствие запрещённых cross-domain imports;
- environment compatibility под configured conditions;
- отсутствие статических cycles.

Runtime tests не заменяют import-graph checks и architecture review.
