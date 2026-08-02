# Состояние, cache и hydration

> Пояснение границы между семантической властью Domain API и framework-owned materialization.

## Связанные правила

- [`SLM-L2-API-R006`](../../rules/level-2.md#slm-l2-api-r006)
- [`SLM-L2-API-A007`](../../rules/level-2.md#slm-l2-api-a007)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-FRAMEWORK-R015`](../../rules/level-2.md#slm-l2-framework-r015)
- [`SLM-L2-API-R018`](../../rules/level-2.md#slm-l2-api-r018)
- [`SLM-L2-STATE-R028`](../../rules/level-2.md#slm-l2-state-r028)

## Основная граница

Модуль `api` определяет форму и семантику доменных значений, но не выбирает способ их хранения и реактивной доставки. TanStack Query, SWR, Apollo, RTK Query, Zustand, Redux, MobX, Pinia, Signals и RxJS остаются в framework bindings или compositions.

```text
Domain API
  → public model/outcome/event
  → framework projection
  → rendering
```

Concrete state/query runtime не импортируется модулем `api`, не является dependency port фабрики и не входит в публичный Domain API.

## Виды materialization

### Source cache

Технический cache внешнего provider внутри adapter. Он может отвечать за transport deduplication, connection state, provider retry и хранение port records.

Source cache не публикует raw DTO, query keys, mutable client или library result через Domain API. Если adapter создаёт timers, subscriptions или connection, он остаётся единственным владельцем и экспортирует lifecycle handle, который assembly только агрегирует. Если resource создаёт assembly, adapter использует его как borrowed capability и не закрывает самостоятельно.

### Framework projection

State или cache, который framework binding строит из готового Domain API:

```ts
export const useAuthSession = () => {
  const api = useAuthApi()

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: api.getSession,
  })
}
```

Query key, stale time, pending/retry status, Suspense, rendering stale data и техническая invalidation принадлежат binding. `AuthSession` и `AuthError` принадлежат `api`.

### Composition state

Состояние конкретной страницы или multi-domain flow принадлежит composition: выбранная вкладка, открытый modal, draft формы, route transition и координация нескольких API.

Если draft приобретает самостоятельную доменную семантику, Domain API предоставляет validation или transition, но framework по-прежнему хранит возвращаемое readonly value.

## Domain API не является store

Публичный Domain API не экспортирует:

- mutable store;
- `getState` и `setState` framework runtime;
- QueryClient;
- Zustand `StoreApi`;
- framework hook;
- глобальный singleton данных;
- универсальный state port.

API methods возвращают значения и outcomes. Framework consumer решает, как долго их хранить и когда повторно запросить.

Это не означает, что framework определяет предметные transitions. Он материализует только то, что произвёл или проверил API.

## Invalidation и retry

| Политика | Обычный владелец |
|---|---|
| Query key, stale time, deduplication, background refetch | Framework binding |
| Transport retry безопасного запроса | Adapter |
| Rendering stale data, Suspense, polling UI | Framework binding или composition |
| Запрет повторной предметной команды | Domain API |
| Cooldown, лимит попыток, допустимый transition | Domain API |
| Freshness, влияющая на корректность сценария | Domain API через operation contract |

После успешной команды binding может технически invalidировать известные query keys. Если выбор invalidation выражает предметную семантику, Domain API возвращает устойчивый outcome/event, а binding только отображает его на framework cache.

## Optimistic updates

Framework binding не конструирует произвольную публичную модель из form input, raw DTO или текущего cache. Optimistic projection допустима, когда предполагаемое значение:

- возвращено командой Domain API;
- создано отдельной операцией Domain API;
- создано или проверено pure-функцией `api/runtime`.

```ts
import {
  projectProfileUpdate,
} from '@/domains/user/api/runtime'

const optimisticProfile = projectProfileUpdate(
  currentProfile,
  command,
)

queryClient.setQueryData(profileKey, optimisticProfile)
```

`projectProfileUpdate` владеет предметным transition, а `setQueryData` остаётся framework operation.

## Concurrent mutations и realtime

При нескольких optimistic commands и realtime events binding не выбирает самостоятельно ordering, versioning, rollback или rebase. Domain API возвращает correlation/version metadata либо предоставляет deterministic reconciliation:

```ts
const nextProjection = reconcileProfile({
  current,
  event,
  pendingCommands,
})
```

Если API не объявляет безопасный merge, binding invalidates cache и получает authoritative snapshot через Domain API. Это предпочтительнее скрытого применения неполного delta.

## Persistence

Framework cache может технически сохраняться между reloads, но persisted value не становится источником предметной истины. После восстановления значение:

- используется как stale projection до revalidation;
- либо проверяется публичным validator `api/runtime`;
- либо отбрасывается и загружается через Domain API.

Если storage является самостоятельным предметным внешним источником, доступ к нему оформляется dependency port и adapter. Автоматический framework middleware не обходит API validation и transitions.

## SSR и hydration

Server и client имеют разные API instances и caches:

```text
server request
  → request assembly
  → server Domain API
  → server framework cache
  → serializable hydration payload

browser
  → client assembly
  → client Domain API
  → hydrated client cache
```

Hydration payload принадлежит framework binding и содержит только public domain values и framework metadata. API object, functions, ports, adapters, mutable clients и request secrets не сериализуются.

Server cache создаётся на каждый request и не хранится в module singleton. Client cache создаётся на согласованный application или route scope.

## RSC и Server Actions

Server Component вызывает server Domain API и передаёт Client Component только сериализуемые values или hydration payload. Client Component создаёт или получает отдельный client API instance; при SSR его render отдельно проверяется в server prerender graph до browser hydration.

Server Action создаёт request-scoped production graph на каждый вызов, выполняет Domain API command и гарантированно выполняет все cleanup obligations графа. Client invocation Server Action является framework reference edge, а не передачей server API в browser.

## Проверка на ревью

Для каждого state/query runtime определяется:

- является ли он source cache, framework projection или composition state;
- откуда поступают public domain values;
- кто определяет validation и transition;
- где находятся library-specific types и keys;
- как invalidation связана с Domain API outcomes;
- как обрабатываются optimistic concurrency и realtime events;
- что сериализуется при SSR/RSC;
- соответствует ли cache scope области жизни API graph.
