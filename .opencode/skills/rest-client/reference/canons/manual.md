---
title: Ручное создание REST-клиента
description: Создание generated-style REST-клиента вручную, когда OpenAPI нет или он неполный.
keywords: [rest, ручной клиент, api-codegen, operation, ApiRequestClient, RequestParams, ContentType]
---

# Ручное создание REST-клиента

Ручной клиент используется, когда у API нет OpenAPI-спецификации или она недостаточно точная для автогенерации.

Ручной режим не является отдельной архитектурой. Это тот же generated-style клиент, где operation-функции написаны вручную вместо генерации из OpenAPI.

## Зависимость

Для ручного клиента установите `@gromlab/api-codegen@5.1.0+` как runtime-зависимость проекта.

```bash
bun add @gromlab/api-codegen
```

Не используйте `npx @gromlab/api-codegen` для ручного режима: `npx` нужен для генерации SDK из OpenAPI, а ручной клиент импортирует runtime API пакета напрямую.

## Что нужно создать

```text
src/infra/
└── pet-project-rest-api/
    ├── client.ts
    ├── rest-api.ts
    ├── operations-tree.ts
    ├── operations/
    │   ├── posts-create.ts
    │   ├── posts-detail.ts
    │   ├── posts-list.ts
    │   └── index.ts
    ├── hooks/
    │   ├── lib/
    │   │   └── create-query-string.ts
    │   ├── use-get-post-list.hook.ts
    │   └── index.ts
    ├── types/
    │   ├── post.ts
    │   └── index.ts
    └── index.ts
```

| Файл | Роль |
|------|------|
| `client.ts` | Настройка и экспорт `*HttpClient` |
| `operations/` | Ручные operation-функции в стиле generated SDK |
| `operations-tree.ts` | Ручное дерево операций для `createApiClient` |
| `rest-api.ts` | Полный bound API через `createApiClient` |
| `types/` | DTO запросов, ответов и именованные response-типы |
| `hooks/` | GET-хуки REST-клиента, если данные нужны в Client Components |
| `index.ts` | Публичный API REST-модуля |

## Типы API

DTO запросов и ответов живут в `types/`. `client.ts` и operation-файлы не объявляют доменные типы.

```ts
// src/infra/pet-project-rest-api/types/post.ts
export type PostDto = {
  id: string
  slug: string
  title: string
}

export type PostListQueryDto = {
  limit?: number
  category?: string
}

export type CreatePostPayload = {
  title: string
}
```

```ts
// src/infra/pet-project-rest-api/types/index.ts
export type { CreatePostPayload, PostDto, PostListQueryDto } from './post'
```

Если данным нужен доменный смысл или маппинг DTO, делайте это выше, в `business/`, а не в REST-клиенте.

## Operation-Функции

Каждая ручная operation повторяет контракт generated operation:

- первым аргументом принимает `http: ApiRequestClient`;
- принимает typed params/body как последующие аргументы;
- последним аргументом принимает `requestParams: RequestParams = {}`;
- внутри вызывает только `http.request(...)`;
- не использует прямой `fetch`;
- не знает про React, SWR, UI и бизнес-логику.

```ts
// src/infra/pet-project-rest-api/operations/posts-list.ts
import type { ApiRequestClient, RequestParams } from '@gromlab/api-codegen'
import type { PostDto, PostListQueryDto } from '../types'

export const postsList = (
  http: ApiRequestClient,
  query: PostListQueryDto = {},
  requestParams: RequestParams = {},
) =>
  http.request<PostDto[]>({
    path: '/posts',
    method: 'GET',
    query,
    format: 'json',
    ...requestParams,
  })
```

```ts
// src/infra/pet-project-rest-api/operations/posts-detail.ts
import type { ApiRequestClient, RequestParams } from '@gromlab/api-codegen'
import type { PostDto } from '../types'

export type PostsDetailParams = {
  slug: string
}

export const postsDetail = (
  http: ApiRequestClient,
  { slug }: PostsDetailParams,
  requestParams: RequestParams = {},
) =>
  http.request<PostDto>({
    path: `/posts/${slug}`,
    method: 'GET',
    format: 'json',
    ...requestParams,
  })
```

```ts
// src/infra/pet-project-rest-api/operations/posts-create.ts
import { ContentType } from '@gromlab/api-codegen'
import type { ApiRequestClient, RequestParams } from '@gromlab/api-codegen'
import type { CreatePostPayload, PostDto } from '../types'

export const postsCreate = (
  http: ApiRequestClient,
  body: CreatePostPayload,
  requestParams: RequestParams = {},
) =>
  http.request<PostDto>({
    path: '/posts',
    method: 'POST',
    body,
    type: ContentType.Json,
    format: 'json',
    secure: true,
    ...requestParams,
  })
```

```ts
// src/infra/pet-project-rest-api/operations/index.ts
export { postsCreate } from './posts-create'
export { postsDetail } from './posts-detail'
export { postsList } from './posts-list'
export type { PostsDetailParams } from './posts-detail'
```

## Транспорт

`client.ts` настраивает и экспортирует только `*HttpClient`.

```ts
// src/infra/pet-project-rest-api/client.ts
import { HttpClient } from '@gromlab/api-codegen'

export const petProjectHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
})
```

Авторизация, refresh token, логирование и другие настройки транспорта задаются опциями и хуками `HttpClient` в этом же файле: [Кастомизация HTTP-клиента](./http-client.md).

## Operations Tree

`operations-tree.ts` вручную собирает дерево операций. Держите структуру такой, какой вы ожидаете видеть после будущей автогенерации.

```ts
// src/infra/pet-project-rest-api/operations-tree.ts
import { postsCreate } from './operations/posts-create'
import { postsDetail } from './operations/posts-detail'
import { postsList } from './operations/posts-list'

export const operationsTree = {
  posts: {
    create: postsCreate,
    detail: postsDetail,
    list: postsList,
  },
} as const
```

## Полный API-Клиент

`rest-api.ts` собирает полный bound API через тот же `createApiClient`, что используется в generated SDK.

```ts
// src/infra/pet-project-rest-api/rest-api.ts
import { createApiClient } from '@gromlab/api-codegen'
import { petProjectHttpClient } from './client'
import { operationsTree } from './operations-tree'

export const petProjectRestApi = createApiClient(
  petProjectHttpClient,
  operationsTree,
)
```

После binding внешний вызов совпадает с generated-клиентом:

```ts
await petProjectRestApi.posts.create({ title: 'Новый пост' })
await petProjectRestApi.posts.detail({ slug: 'hello' })
```

## GET-Хуки

GET-хуки ручного клиента пишутся так же, как hooks для generated operations: импортируют точечную operation и вызывают её через общий `*HttpClient`.

```ts
// src/infra/pet-project-rest-api/hooks/use-get-post-list.hook.ts
import type { SWRConfiguration } from 'swr'
import useSWR from 'swr'
import { petProjectHttpClient } from '../client'
import { postsList } from '../operations/posts-list'
import type { PostDto, PostListQueryDto } from '../types'

export const getPostListKey = (params: PostListQueryDto = {}) => {
  const searchParams = new URLSearchParams()

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.category) {
    searchParams.set('category', params.category)
  }

  const search = searchParams.toString()

  return ['pet-project-rest-api', `/posts${search ? `?${search}` : ''}`] as const
}

export const useGetPostList = (
  params: PostListQueryDto = {},
  config?: SWRConfiguration<PostDto[]>,
) => {
  const key = getPostListKey(params)
  const fetcher = () => postsList(petProjectHttpClient, params)

  return useSWR<PostDto[]>(key, fetcher, config)
}
```

```ts
// src/infra/pet-project-rest-api/hooks/index.ts
'use client'

export { getPostListKey, useGetPostList } from './use-get-post-list.hook'
```

## Публичный API

```ts
// src/infra/pet-project-rest-api/index.ts
export { petProjectHttpClient } from './client'
export { petProjectRestApi } from './rest-api'
export * from './hooks'
export type { PostsDetailParams } from './operations'
export type { CreatePostPayload, PostDto, PostListQueryDto } from './types'
```

Внешний код импортирует только из `infra/pet-project-rest-api`, не из внутренних файлов модуля.

## Миграция На OpenAPI

Ручной клиент проектируйте так, чтобы его можно было заменить автогенерацией без смены API потребителей.

- Называйте operation-функции и дерево близко к будущим `operationId` и tags OpenAPI.
- Держите сигнатуры operation в стиле generated SDK: `operation(http, params/body, requestParams?)`.
- Не создавайте собственный класс клиента и методные фабрики.
- Если позже появится OpenAPI, сгенерируйте SDK и замените ручные operations на generated operations с минимальными правками `rest-api.ts`, GET-хуков и re-exports.

## Правила

- Ручной клиент использует `@gromlab/api-codegen@5.1.0+` как runtime dependency.
- `client.ts` экспортирует только `*HttpClient`.
- Ручные запросы живут в `operations/` и пишутся как generated-style operations.
- `operations-tree.ts` вручную собирает дерево для `createApiClient`.
- `rest-api.ts` экспортирует полный `*RestApi` через `createApiClient(*HttpClient, operationsTree)`.
- GET-хуки вызывают точечные operations через `*HttpClient`, не полный `*RestApi`.
- Не используйте прямой `fetch`, custom `RestApiClient` class, `methods/*Methods(client)` и ручные `get/post` wrappers.
- DTO запросов и ответов живут в `types/`.
- Доменные типы и маппинг DTO живут не в REST-клиенте, а в `business/`.

Следующий шаг: [Использование REST-клиента](../../SKILL.md#использование-rest-клиента), [GET-хуки REST-клиента](../../SKILL.md#get-хуки-rest-клиента) или выбор route-level data fetching по `nextjs-style-guide`.
