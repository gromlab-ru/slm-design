# Состояние и кэш

> Пояснение границы между предметной властью business и техническими state/query runtimes.

## Связанные правила

- [`SLM-L2-BUSINESS-R006`](../../rules/level-2.md#slm-l2-business-r006)
- [`SLM-L2-BUSINESS-A007`](../../rules/level-2.md#slm-l2-business-a007)
- [`SLM-L2-DEPENDENCY-A012`](../../rules/level-2.md#slm-l2-dependency-a012)
- [`SLM-L2-FRAMEWORK-R015`](../../rules/level-2.md#slm-l2-framework-r015)
- [`SLM-L2-BUSINESS-R018`](../../rules/level-2.md#slm-l2-business-r018)

## Библиотеки не запрещены

Запрет state/query manager в import-графе `business` не запрещает TanStack Query, SWR, Apollo, RTK Query, Zustand, Redux, MobX или RxJS в доменном пакете. Он запрещает concrete runtime становиться предметным контрактом.

Такая библиотека может находиться:

- в adapter-модуле, если реализует техническую зависимость business-фабрики;
- в framework binding module, если доставляет готовый Domain API конкретному framework;
- в composition, если состояние принадлежит только её UI scope и не подменяет доменную модель.

## Три вида состояния

### Предметное состояние

Модель фактов и переходов домена. `business` определяет initial value, validation, допустимые команды, transitions и selectors. Concrete store может быть передан фабрике как business-owned port:

```ts
export type AuthStateDependency = {
  create: (initial: AuthState) => {
    get: () => AuthState
    set: (state: AuthState) => void
    subscribe: (listener: () => void) => () => void
  }
}
```

Adapter поверх Zustand или другого manager реализует этот контракт, но не выбирает initial state и не добавляет переходы.

### Technical source cache

Кэш SDK, HTTP, GraphQL или storage-вызовов. Adapter может использовать QueryClient, Apollo cache или иной runtime для deduplication, transport retry и хранения внешних результатов. Business по-прежнему проверяет и преобразует результат до публикации предметной модели.

Query keys и библиотечные result types остаются внутри adapter. Domain API не экспортирует `UseQueryResult`, `ApolloError`, raw DTO или mutable QueryClient.

Если technical cache создаёт timers, subscriptions или другой lifecycle-ресурс для всего графа, владеющая им assembly передаёт cleanup graph owner. Cache без такого ресурса не требует искусственного `dispose`.

### Framework projection cache

Кэш, который framework binding строит поверх вызовов готового Domain API для rendering, Suspense, revalidation или UI coordination.

```ts
const useProfile = () => {
  const api = useUserApi()

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: api.getProfile,
  })
}
```

Такой cache не является параллельным предметным источником, пока его значения происходят из Domain API и все предметные изменения выполняются через API.

## Invalidation и retry

Не каждая cache policy является бизнес-правилом.

| Политика | Обычный владелец |
|---|---|
| Query key, stale time, deduplication, background refetch | Adapter или framework binding |
| Rendering stale data, Suspense, polling UI | Framework binding или composition |
| Transport retry безопасного запроса | Adapter |
| Запрет повторной предметной команды | `business` |
| Cooldown, лимит попыток, допустимый transition | `business` |
| Freshness, влияющая на корректность сценария | `business` через явный контракт |

Если после команды требуется invalidation, framework binding может связать успешный результат API с техническими keys. Если выбор invalidation выражает предметную семантику, business возвращает устойчивый outcome/event либо публикует чистое правило через `business/runtime`; binding только отображает его на библиотечные операции.

## Optimistic updates

Framework binding не конструирует произвольную предметную модель из input формы или transport DTO. Optimistic update допустим, когда предполагаемое значение:

- возвращено командой Domain API как безопасная projection;
- создано отдельным pure-методом Domain API;
- создано или проверено публичной функцией `business/runtime`.

```ts
const optimisticProfile = projectProfileUpdate(currentProfile, command)

queryClient.setQueryData(profileKey, optimisticProfile)
```

Здесь `projectProfileUpdate` принадлежит `business/runtime`, а `setQueryData` остаётся технической операцией framework binding.

Запись raw form data или DTO напрямую в публичный product cache обходит предметного владельца и нарушает границу.

## Browser, SSR и RSC

Client hook, server prefetch и hydrate/dehydrate могут принадлежать разным framework binding modules с совместимыми environment entry points. Общая framework-specific cache policy выносится в отдельный модуль той же Framework Group, если у неё несколько реальных потребителей.

`compositions` вызывает публичный server binding для prefetch и публичный client binding для rendering. Она не повторяет query keys и mapping доменных результатов.

## Проверка на ревью

Для каждого state/query runtime определяется:

- является ли он adapter, framework projection или локальным UI state;
- откуда поступают значения;
- кто определяет transition и optimistic projection;
- где находятся library-specific types и keys;
- как invalidation соотносится с результатами Domain API;
- соответствует ли cache lifecycle области жизни API и framework scope.
