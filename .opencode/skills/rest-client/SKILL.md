---
name: rest-client
description: "Используй при создании, изменении или ревью REST API клиента и infra REST-модуля. Триггеры: REST API, REST client, API client, backend API, external API, OpenAPI, Swagger, ручной клиент без OpenAPI, @gromlab/api-codegen, @gromlab/api-codegen@5.1.0, src/infra/*-rest-api, *-rest-api-sdk, REST SDK, npm SDK, client.ts, rest-api.ts, operations-tree.ts, *HttpClient, *RestApi, generated/, operations/, operations/*, data-contracts, hooks/, types/, errors/, HttpClient, ApiRequestClient, RequestParams, ContentType, createApiClient, operationsTree, full client, minimal client, SDK exports, onRequest, onResponse, onError, JWT, refresh token, ApiError, useGet*, get*Key, useSWR, SWRConfiguration, DTO, API error, public API REST-модуля. НЕ используй для любого fetch вне REST-клиента проекта, route-level data fetching Next.js, SLM-архитектуры без REST-модуля, code style, SVG sprites или генерации шаблонов."
---

<!-- Generated from src/SKILL.md. Do not edit manually. -->

# REST Client

## Работа с REST-клиентом

### Базовые Правила

- REST-клиент сервиса оформляй как отдельный `infra/` module с именем `{name}-rest-api`: `pet-store-rest-api`, `billing-rest-api`, `maps-rest-api`.
- Генерация внутри клиента живёт в `{name}-rest-api/generated`. Generated-клиент, выносимый в npm-пакет или пакет монорепозитория, называется `{name}-rest-api-sdk`.
- Внешний код импортирует клиент, типы, enum и GET-хуки только через корневой `index.ts` REST-модуля.
- `client.ts` экспортирует только настроенный транспортный `*HttpClient`: `petStoreHttpClient`, `billingHttpClient`, `mapsHttpClient`.
- `rest-api.ts` экспортирует полный bound API-клиент `*RestApi`, собранный через `createApiClient(*HttpClient, operationsTree)`.
- Не размещай в `client.ts` DTO, `declare module`, `Extended`-типы, GET-хуки и бизнес-логику.
- GET-хуки не импортируют полный `*RestApi`; они импортируют точечную operation и вызывают её через общий `*HttpClient`.
- `hooks/index.ts` содержит `'use client'`; отдельные `use-get-*.hook.ts` остаются обычными файлами без директивы.
- Если OpenAPI нет, ручные operations пиши через `@gromlab/api-codegen@5.1.0+` с тем же контрактом, что у generated SDK: `operation(http, params/body, requestParams?)`.
- Не создавай собственные `fetch`-классы, `methods/*Methods(client)` и ручные `get/post` wrappers для нового ручного клиента.
- Не правь файлы в `generated/` руками. Расширения типов, DTO и именованные response-типы держи в `types/` REST-модуля.
- UI/components не импортируют SDK-пакет, `generated/`, `operations/`, `operationsTree` и транспорт напрямую.
- SDK operations напрямую импортируются только внутри `infra/*-rest-api` и boundary-файлов минимальных clients в `compositions` или `features`.
- Для прямого REST-вызова в server code, submit-функции или сервисе используй именованный API-объект клиента из публичного API REST-модуля или минимальный composition client.
- Для GET-данных в Client Component сначала используй готовый `useGet*` hook REST-модуля.
- GET-хуки являются прозрачными SWR-обёртками над GET operation и живут в `hooks/` этого REST-модуля.
- Не выноси SWR keys, fetcher, DTO mapping, API errors и транспортные детали в UI-компоненты.
- Если в коде появляется бизнес-смысл вроде `isAuth`, `canEdit`, `hasAccess` или `hasPets`, это уже не REST-клиент, а `business/`.

### Full Client vs Minimal Client

- Full client живёт только в `infra/{name}-rest-api/rest-api.ts`.
- Full client собирается из всего generated дерева: `createApiClient(nameHttpClient, operationsTree)`.
- Full client экспортируется через `infra/{name}-rest-api/index.ts` как `nameRestApi`.
- Minimal client допустим только в feature/composition boundary-файле, где нужен ограниченный набор операций для конкретного бизнес-сценария.
- Minimal client собирается из selected operations: `createApiClient(nameHttpClient, { ...только нужные операции... })`.
- GET-hook не использует bound client вообще: он вызывает `operation(nameHttpClient, params, requestParams?)`.
- `operationsTree` не импортируется в GET-хуки и minimal clients.
- Для ручного клиента `operationsTree` пишется вручную в `infra/{name}-rest-api/operations-tree.ts`.

### Рабочий Алгоритм

1. Найди REST-модуль сервиса в `infra/` и работай через его публичный API.
2. Проверь корневой `index.ts`: внешний код не должен импортировать из `generated/`, `hooks/`, `types/` или `errors/` напрямую.
3. Если нужен прямой REST-вызов в server code, submit-функции или сервисе, используй полный `*RestApi` из `infra/{name}-rest-api`.
4. Если данные нужны в Client Component и запрос является GET, сначала ищи готовый `useGet*` hook.
5. Если GET-хука нет, добавь его рядом с клиентом в `hooks/` по контракту раздела `GET-хуки REST-клиента`.
6. Если feature/composition нужен компактный клиент с небольшим набором операций, создай minimal client в boundary-файле этой composition.
7. Если нужно изменить тип ответа или дополнить generated-тип, не меняй generated-файл; добавь тип или расширение в `types/`.
8. Если REST-клиента ещё нет или нужно подключить новый внешний API, открой конкретный локальный setup-материал ниже.
9. После изменений проверь публичные экспорты, отсутствие SDK imports в UI/components и то, что SWR-механика не утекла в компоненты.

### Создание И Настройка Клиента

Создание нового REST-клиента - редкий сценарий. Не открывай setup-материалы, если задача сводится к использованию существующего клиента, GET-хука или публичного API.

- [Настройка REST-клиента](./reference/canons/setup.md) - состав REST-клиента, структура модуля и базовая настройка.
- [Автогенерация из OpenAPI](./reference/canons/auto.md) - генерация split-клиента через `@gromlab/api-codegen`.
- [Кастомизация HTTP-клиента](./reference/canons/http-client.md) - опции и хуки `HttpClient`: авторизация, refresh token, транспорт.
- [SDK-пакет REST-клиента](./reference/canons/sdk.md) - вынос generated-клиента в npm-пакет или пакет монорепозитория `{name}-rest-api-sdk`.
- [Ручное создание](./reference/canons/manual.md) - ручной REST-клиент, если OpenAPI нет или он неполный.

### Включённые Разделы

- [Использование REST-клиента](#использование-rest-клиента) - прямой вызов готового клиента.
- [GET-хуки REST-клиента](#get-хуки-rest-клиента) - контракт `useGet*`, key-функций и SWR-обёрток.

## Использование REST-клиента

Как выбрать правильную точку вызова REST API.

### Прямой вызов полного API

Для server code, submit-функции, adapter или сервиса импортируйте полный API-клиент из публичного API REST-модуля.

```ts
import { petStoreRestApi } from 'infra/pet-store-rest-api'

export const getPet = async (petId: number) => {
  return petStoreRestApi.pet.getPetById({ petId })
}
```

Внешний код не импортирует SDK-пакет, `generated/`, `operations/`, `operationsTree`, `client.ts` или `rest-api.ts` напрямую.

### Minimal Client В Composition Boundary

Если business composition нужен компактный клиент из нескольких операций, собирайте его в boundary-файле этой composition.

```ts
// src/compositions/business/pet-store/orders/pet-store-rest-api.ts
import { createApiClient } from '@company/pet-store-rest-api-sdk/create-api-client'
import { createOrder } from '@company/pet-store-rest-api-sdk/operations/create-order'
import { getOrder } from '@company/pet-store-rest-api-sdk/operations/get-order'
import { petStoreHttpClient } from 'infra/pet-store-rest-api'

export const petStoreOrdersRestApi = createApiClient(petStoreHttpClient, {
  orders: {
    create: createOrder,
    get: getOrder,
  },
})
```

Minimal client не экспортируется из общего `infra/{name}-rest-api`. Он принадлежит конкретному feature/composition boundary и содержит только операции этого сценария.

### GET В Client Components

Client Components используют только готовые `useGet*` hooks REST-модуля.

```tsx
import { useGetPetDetail } from 'infra/pet-store-rest-api'

export const PetCard = ({ petId }: { petId: number }) => {
  const { data: pet } = useGetPetDetail({ petId })

  return <div>{pet?.name}</div>
}
```

Не вызывайте `useSWR`, SDK operation или полный `*RestApi` прямо в UI-компоненте.

## GET-хуки REST-клиента

Прозрачные SWR-обёртки над GET operations REST-клиента.

### Зачем нужны

GET-хуки нужны, чтобы Client Components получали REST-данные через SWR, но не работали с `useSWR`, ключами кеша и fetcher напрямую.

### Где лежат

GET-хуки принадлежат REST-клиенту конкретного сервиса и живут рядом с ним:

```text
src/infra/
└── pet-store-rest-api/
    ├── client.ts
    ├── rest-api.ts
    ├── generated/
    ├── hooks/
    │   ├── lib/
    │   │   └── create-query-string.ts
    │   ├── use-get-pet-list.hook.ts
    │   ├── use-get-pet-detail.hook.ts
    │   └── index.ts
    ├── types/
    └── index.ts
```

### Контракт

- Один GET-хук = одна GET operation.
- Имя GET-хука начинается с `useGet`: `useGetPetList`, `useGetPetDetail`.
- Имя файла начинается с `use-get`: `use-get-pet-list.hook.ts`.
- Хук принимает `params?: GeneratedParams | null` и `config?: SWRConfiguration<Data>`.
- Для GET operation без параметров хук принимает только `config?: SWRConfiguration<Data>`.
- Key-функция принимает те же `params`, что и хук.
- Key-функция возвращает `null`, если обязательные параметры не готовы.
- Проверка готовности запроса живёт в key-функции, а не в теле хука.
- Хук вызывает `useSWR` один раз и безусловно.
- Fetcher вызывает точечную operation через общий `*HttpClient`: `operation(nameHttpClient, params, requestParams?)`.
- Fetcher не проверяет `null`, не бросает ошибку и не вызывает operation с `null`.
- Внутри только SWR-механика: key, fetcher, `useSWR`, `config`.
- Хук возвращает тип ответа API: generated-тип или DTO из `types/`.
- Хук не объединяет несколько запросов.
- Хук не маппит DTO в доменную модель.
- Хук не вычисляет бизнес-флаги: `isAuth`, `canEdit`, `hasAccess`, `hasPets`.
- Хук не вызывает тосты, модалки, редиректы и не пишет UI-состояние.
- Хук не импортирует полный `*RestApi`, `createApiClient` или `operationsTree`.
- `hooks/index.ts` содержит `'use client'`; отдельные `use-get-*.hook.ts` не содержат эту директиву.

### Формат SWR-ключа

SWR-ключ GET-хука всегда создаётся отдельной экспортируемой функцией.

Формат ключа:

```ts
['pet-store-rest-api', '/pet/10'] as const
```

- Первый элемент — имя API-сервиса или REST-клиента в `kebab-case`.
- Второй элемент — endpoint запроса: path и query string.
- Key-функция возвращает `null`, когда запрос нельзя выполнять.
- Key-функция нужна и GET-хуку, и `SWRConfig fallback`.
- Не используйте произвольные части вроде `['pet-store-rest-api', 'pet', 'detail', params]`.
- Не используйте только строку endpoint без имени сервиса.

Примеры ключей:

```ts
export const getPetDetailKey = (params?: GetPetByIdParams | null) => {
  if (!params?.petId) {
    return null
  }

  return ['pet-store-rest-api', `/pet/${params.petId}`] as const
}
```

```ts
export const getPetListKey = (params?: FindPetsByStatusParams | null) => {
  if (!params?.status) {
    return null
  }

  return ['pet-store-rest-api', `/pet/findByStatus?status=${params.status}`] as const
}
```

```ts
export const getPetListByTagsKey = (params?: FindPetsByTagsParams | null) => {
  if (!params?.tags.length) {
    return null
  }

  return ['pet-store-rest-api', `/pet/findByTags?tags=${params.tags.join(',')}`] as const
}
```

Если API допускает `0` как валидный идентификатор, не используйте проверку `!params?.id`. В таком случае проверяйте `null` и `undefined` явно.

### Query String Для Key

Если key зависит от query-параметров, собирайте query string отдельной маленькой функцией или общим helper внутри `hooks/lib/`.

```ts
// src/infra/pet-store-rest-api/hooks/lib/create-query-string.ts
type QueryValue = boolean | number | string | null | undefined

export const createQueryString = (query: Record<string, QueryValue>): string => {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const search = searchParams.toString()

  return search ? `?${search}` : ''
}
```

Key должен отражать фактический URL запроса: path плюс query string. Не кладите весь `params` object в SWR key.

### Пример списка

```ts
// src/infra/pet-store-rest-api/hooks/use-get-pet-list.hook.ts
import { findPetsByStatus } from '../generated/operations/find-pets-by-status'
import type { SWRConfiguration } from 'swr'
import useSWR from 'swr'
import { petStoreHttpClient } from '../client'
import { createQueryString } from './lib/create-query-string'
import type { FindPetsByStatusParams, Pet } from '../generated'

const getPetListQuery = (params: FindPetsByStatusParams): string => {
  return createQueryString({ status: params.status })
}

export const getPetListKey = (params?: FindPetsByStatusParams | null) => {
  if (!params?.status) {
    return null
  }

  return ['pet-store-rest-api', `/pet/findByStatus${getPetListQuery(params)}`] as const
}

/**
 * Получает список питомцев по статусу.
 */
export const useGetPetList = (
  params?: FindPetsByStatusParams | null,
  config?: SWRConfiguration<Pet[]>,
) => {
  const key = getPetListKey(params)
  const fetcher = () => findPetsByStatus(
    petStoreHttpClient,
    params as FindPetsByStatusParams,
  )

  return useSWR<Pet[]>(key, fetcher, config)
}
```

`params as FindPetsByStatusParams` допустим только в fetcher: готовность параметров проверена в key-функции, а при `key = null` SWR не вызывает fetcher.

### Пример detail-запроса

```ts
// src/infra/pet-store-rest-api/hooks/use-get-pet-detail.hook.ts
import { getPetById } from '../generated/operations/get-pet-by-id'
import type { SWRConfiguration } from 'swr'
import useSWR from 'swr'
import { petStoreHttpClient } from '../client'
import type { GetPetByIdParams, Pet } from '../generated'

export const getPetDetailKey = (params?: GetPetByIdParams | null) => {
  if (!params?.petId) {
    return null
  }

  return ['pet-store-rest-api', `/pet/${params.petId}`] as const
}

/**
 * Получает детальную карточку питомца с кешированием результата.
 */
export const useGetPetDetail = (
  params?: GetPetByIdParams | null,
  config?: SWRConfiguration<Pet>,
) => {
  const key = getPetDetailKey(params)
  const fetcher = () => getPetById(petStoreHttpClient, params as GetPetByIdParams)

  return useSWR<Pet>(key, fetcher, config)
}
```

### Пример без параметров

```ts
// src/infra/pet-store-rest-api/hooks/use-get-store-inventory.hook.ts
import { getStoreInventory } from '../generated/operations/get-store-inventory'
import type { SWRConfiguration } from 'swr'
import useSWR from 'swr'
import { petStoreHttpClient } from '../client'
import type { StoreInventory } from '../types'

export const getStoreInventoryKey = () => {
  return ['pet-store-rest-api', '/store/inventory'] as const
}

/**
 * Получает инвентарь магазина.
 */
export const useGetStoreInventory = (
  config?: SWRConfiguration<StoreInventory>,
) => {
  return useSWR<StoreInventory>(
    getStoreInventoryKey(),
    () => getStoreInventory(petStoreHttpClient),
    config,
  )
}
```

Если generated operation возвращает безымянный тип вроде `Record<string, number>`, а тип нужен наружу, вынесите его в `types/`.

### Пример С Request Params

Если operation зависит от разовых headers или дополнительных query-параметров, соберите `requestParams` внутри fetcher. Key-функция должна учитывать параметры, которые меняют результат запроса.

```ts
// src/infra/cms-rest-api/hooks/use-get-post-detail.hook.ts
import { postsDetail } from '@company/cms-rest-api-sdk/operations/posts-detail'
import type { SWRConfiguration } from 'swr'
import useSWR from 'swr'
import { cmsHttpClient } from '../client'
import { createQueryString } from './lib/create-query-string'
import type {
  PostDetail,
  PostsDetailParams,
  RequestParams,
} from '@company/cms-rest-api-sdk'

export type GetPostDetailParams = PostsDetailParams & {
  app?: string
}

const getPostDetailPath = (params: GetPostDetailParams): string => {
  return `/v1/posts/${params.slug}${createQueryString({
    app: params.app,
    status: params.status,
  })}`
}

export const getPostDetailKey = (params?: GetPostDetailParams | null) => {
  if (!params?.slug) {
    return null
  }

  return ['cms-rest-api', getPostDetailPath(params)] as const
}

export const useGetPostDetail = (
  params?: GetPostDetailParams | null,
  config?: SWRConfiguration<PostDetail>,
) => {
  const key = getPostDetailKey(params)
  const fetcher = () => {
    const { app, ...postParams } = params as GetPostDetailParams
    const requestParams: RequestParams = {
      headers: app ? { 'x-app': app } : undefined,
    }

    return postsDetail(cmsHttpClient, postParams, requestParams)
  }

  return useSWR<PostDetail>(key, fetcher, config)
}
```

### Отложенный запрос

GET-хук может принимать `null` или `undefined` для обязательных параметров. Это означает, что параметры ещё не готовы и запрос выполнять нельзя.

```ts
const key = getPetDetailKey(params)
```

Если `params` не готов, key-функция вернёт `null`. SWR не вызовет fetcher для `null`-ключа.

Не добавляйте отдельные `isReady`, `throw new Error(...)` и условный вызов `useSWR`.

### Экспорт

```ts
// src/infra/pet-store-rest-api/hooks/index.ts
'use client'

export { getPetListKey, useGetPetList } from './use-get-pet-list.hook'
export { getPetDetailKey, useGetPetDetail } from './use-get-pet-detail.hook'
export {
  getStoreInventoryKey,
  useGetStoreInventory,
} from './use-get-store-inventory.hook'
```

```ts
// src/infra/pet-store-rest-api/index.ts
export { petStoreHttpClient } from './client'
export { petStoreRestApi } from './rest-api'
export type {
  FindPetsByStatusParams,
  GetPetByIdParams,
  Pet,
} from './generated'
export * from './hooks'
export type { StoreInventory } from './types'
```

Наружу импортируют только из `infra/pet-store-rest-api`, не из `generated/` и не из `hooks/` напрямую.

### Где заканчивается infra

```ts
// Хорошо: infra, прозрачный GET-хук
const { data: pets } = useGetPetList({ status: 'available' })
```

```ts
// Хорошо: business, доменная интерпретация
export const useAvailablePets = () => {
  const query = useGetPetList({ status: 'available' })

  return {
    ...query,
    hasPets: Boolean(query.data?.length),
  }
}
```

`hasPets` — не часть GET-запроса, поэтому он не добавляется в `useGetPetList`.

### Что запрещено

```ts
// Плохо — useSWR в компоненте
const { data } = useSWR(
  ['pet-store-rest-api', '/pet/findByStatus?status=available'],
  () => findPetsByStatus(petStoreHttpClient, { status: 'available' }),
)

// Плохо — проверка готовности размазана по хуку
export const useGetPetDetail = (params?: GetPetByIdParams | null) => {
  const key = params?.petId ? getPetDetailKey(params) : null
  const fetcher = () => {
    if (!params?.petId) {
      throw new Error('Pet id is required')
    }

    return getPetById(petStoreHttpClient, params)
  }

  return useSWR<Pet>(key, fetcher)
}

// Плохо — условный вызов useSWR нарушает rules of hooks
export const useGetPetDetail = (params?: GetPetByIdParams | null) => {
  const key = getPetDetailKey(params)

  if (key === null) {
    return useSWR(null, null)
  }

  return useSWR(key, () => getPetById(petStoreHttpClient, params))
}

// Плохо — GET-хук импортирует полный bound client вместо точечной operation
export const useGetPetDetail = (params?: GetPetByIdParams | null) => {
  const key = getPetDetailKey(params)

  return useSWR(
    key,
    () => petStoreRestApi.pet.getPetById(params as GetPetByIdParams),
  )
}

// Плохо — несколько GET внутри infra-хука
export const usePetDashboard = () => {
  const available = useGetPetList({ status: 'available' })
  const sold = useGetPetList({ status: 'sold' })

  return { available, sold }
}

// Плохо — бизнес-флаг внутри GET-хука REST-клиента
export const useGetPetList = (params?: FindPetsByStatusParams | null) => {
  const query = useSWR(...)

  return {
    ...query,
    hasPets: Boolean(query.data?.length),
  }
}
```

Потребление таких хуков на уровне route-level data fetching относится к `nextjs-style-guide`.
