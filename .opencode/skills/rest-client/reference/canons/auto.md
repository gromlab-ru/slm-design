---
title: Автогенерация REST-клиента
description: Генерация split REST-клиента из OpenAPI-спецификации.
keywords: [rest, openapi, api-codegen, автогенерация, generated, split, operations, npx]
---

# Автогенерация REST-клиента

Генерация REST-клиента из OpenAPI-спецификации.

## Когда использовать

Автогенерация используется, когда у API есть актуальная OpenAPI-спецификация. Генератор создаёт split-клиент: HTTP-клиент, типы и отдельную operation-функцию на каждый endpoint. Разработчик вручную добавляет транспорт в `client.ts`, полный API в `rest-api.ts` и GET-хуки.

По умолчанию генерация идёт внутрь infra-модуля приложения в `{name}-rest-api/generated` — этот сценарий описан ниже. Если клиент нужен нескольким приложениям, generated-код выносится в отдельный пакет `{name}-rest-api-sdk`: [SDK-пакет REST-клиента](./sdk.md).

## Пример API

В примерах используется Swagger Petstore:

```text
https://petstore3.swagger.io/api/v3/openapi.json
```

Имена модуля:

```text
src/infra/pet-store-rest-api/
petStoreRestApi
```

## Скрипт генерации

`@gromlab/api-codegen` не устанавливается в `devDependencies`. Используем `npx @gromlab/api-codegen@latest`, чтобы запускать свежую версию.

```json
{
  "scripts": {
    "codegen:pet-store-rest-api": "npx @gromlab/api-codegen@latest -i https://petstore3.swagger.io/api/v3/openapi.json -o src/infra/pet-store-rest-api/generated"
  }
}
```

Параметры:

- `-i` — путь к OpenAPI-спецификации: URL или локальный файл.
- `-o` — директория для сгенерированного split-клиента.

По умолчанию генератор работает в режиме `split`. Legacy-режим `--mode single -n <имя>` генерирует один монолитный файл и используется только в старых проектах, которые уже завязаны на монолитный generated-клиент. В новых проектах single-режим не используется.

Генератор не создаёт SWR-хуки. GET-хуки REST-клиента пишутся вручную, чтобы сохранить проектный контракт: один GET-хук = одна GET operation, без бизнес-логики и композиции.

## Генерация

```bash
npm run codegen:pet-store-rest-api
```

Ожидаемый результат:

```text
src/infra/pet-store-rest-api/generated/
├── create-api-client.ts
├── data-contracts.ts
├── http-client.ts
├── index.ts
├── operations-tree.ts
└── operations/
    ├── index.ts
    ├── get-pet-by-id.ts
    └── find-pets-by-status.ts
```

Основные части:

- `http-client.ts` — fetch-based `HttpClient`: `baseUrl`, заголовки, авторизация и хуки транспорта.
- `data-contracts.ts` — TypeScript-типы из OpenAPI schemas, включая `*Params`-типы операций.
- `operations/*.ts` — отдельная typed operation-функция на каждый endpoint.
- `operations-tree.ts` — дерево всех операций для сборки полного клиента.
- `create-api-client.ts` — `createApiClient`, который привязывает дерево операций к `HttpClient`.
- `index.ts` — входная точка generated-кода, реэкспортирует всё перечисленное.

Файлы в `generated/` не правятся руками и коммитятся в репозиторий.

Enum-значения в split-режиме генерируются как union-типы строковых литералов. Отдельных runtime enum в `generated/` нет: в коде используются строковые литералы вроде `'available'`, а тип проверяет их допустимость.

## Проверка операций

После генерации откройте `generated/operations-tree.ts` и проверьте фактические имена operation-функций и структуру дерева.

Для Petstore нужны GET-операции вида:

```ts
import { findPetsByStatus } from './generated/operations/find-pets-by-status'
import { getPetById } from './generated/operations/get-pet-by-id'
```

Точечная operation вызывается через настроенный `HttpClient`:

```ts
getPetById(petStoreHttpClient, { petId: 10 })
findPetsByStatus(petStoreHttpClient, { status: 'available' })
```

После сборки полного клиента в `rest-api.ts` те же операции доступны как bound API:

```ts
petStoreRestApi.pet.findPetsByStatus({ status: 'available' })
petStoreRestApi.pet.getPetById({ petId: 10 })
```

Имена операций и группировка дерева зависят от `operationId` и тегов OpenAPI-схемы. В рабочих задачах всегда сверяйтесь с `generated/operations-tree.ts` и `generated/data-contracts.ts`.

## Источник Imports

Если generated-код лежит внутри infra-модуля, импортируйте operation из локального `generated/`:

```ts
import { getPetById } from '../generated/operations/get-pet-by-id'
```

Если generated-код вынесен в SDK-пакет, импортируйте operation через subpath export пакета:

```ts
import { getPetById } from '@company/pet-store-rest-api-sdk/operations/get-pet-by-id'
```

Не импортируйте весь `operations` namespace ради одной операции.

## Алгоритм для агента

После генерации агент должен действовать по шагам:

1. Открыть `generated/operations-tree.ts` и найти фактические имена нужных operation-функций.
2. Для каждой нужной операции найти тип параметров и тип ответа в `generated/data-contracts.ts`.
3. Создать или обновить `client.ts`: настроить и экспортировать только `*HttpClient`.
4. Создать или обновить `rest-api.ts`: собрать полный `*RestApi` через `createApiClient(*HttpClient, operationsTree)`.
5. Создать GET-хуки только для реально нужных GET-операций, не для всех операций API на всякий случай.
6. В каждом GET-хуке импортировать точечную operation из `operations/<operation-file>`.
7. Для каждого GET-хука создать key-функцию формата `[serviceName, endpoint]`.
8. В key-функции вернуть `null`, если обязательные параметры не готовы.
9. В хуке принять `params?: GeneratedParams | null` и `config?: SWRConfiguration<Data>`.
10. В fetcher вызвать operation через общий `*HttpClient`: `operation(nameHttpClient, params as GeneratedParams, requestParams?)`.
11. Экспортировать хук и key-функцию из `hooks/index.ts`; если это первый hook, добавить в `hooks/index.ts` директиву `'use client'`.
12. Экспортировать наружу только нужные generated-типы, DTO, `*HttpClient`, `*RestApi` и `hooks` через корневой `index.ts`.

Что агент не должен делать:

- Не править файлы в `generated/` руками.
- Не импортировать операции и `HttpClient` из `generated/` или SDK в UI/components.
- Не импортировать `operationsTree` или полный `*RestApi` в GET-хуки.
- Не добавлять GET-хуки для POST, PUT, PATCH, DELETE.
- Не добавлять бизнес-флаги, тосты, редиректы и UI-состояние в GET-хук.
- Не создавать словари enum-маппинга внутри GET-хука.
- Не объявлять DTO и response-типы в файле хука.
- Не вызывать `useSWR` условно.
- Не добавлять `throw` в fetcher для неготовых params.

## `client.ts`

`client.ts` содержит только настроенный транспортный `HttpClient`.

```ts
// src/infra/pet-store-rest-api/client.ts
import { HttpClient } from './generated'

export const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
})
```

`client.ts` не содержит расширения типов, `declare module`, `Extended`-типы, GET-хуки, `operationsTree`, `createApiClient` и бизнес-логику.

Авторизация, refresh token, логирование и другие настройки транспорта задаются опциями и хуками `HttpClient` в этом же файле: [Кастомизация HTTP-клиента](./http-client.md).

## `rest-api.ts`

`rest-api.ts` собирает полный bound API-клиент из всего generated дерева операций.

```ts
// src/infra/pet-store-rest-api/rest-api.ts
import { createApiClient, operationsTree } from './generated'
import { petStoreHttpClient } from './client'

export const petStoreRestApi = createApiClient(petStoreHttpClient, operationsTree)
```

Импорт `operationsTree` означает полный клиент: в bound API доступны все операции API.

Если generated-код вынесен в SDK-пакет, используйте subpath exports:

```ts
// src/infra/pet-store-rest-api/rest-api.ts
import { createApiClient } from '@company/pet-store-rest-api-sdk/create-api-client'
import { operationsTree } from '@company/pet-store-rest-api-sdk/operations-tree'
import { petStoreHttpClient } from './client'

export const petStoreRestApi = createApiClient(petStoreHttpClient, operationsTree)
```

## GET-хуки

GET-хуки пишутся вручную после проверки generated-операций.

Пример для операции `getPetById`:

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

Типы импортируются как `import type` из `./generated`: generated `index.ts` реэкспортирует все типы из `data-contracts.ts`.

Подробный контракт key-функций, `params`, `config` и запретов описан в разделе [GET-хуки REST-клиента](../../SKILL.md#get-хуки-rest-клиента).

## Расширение сгенерированных типов

Файлы в `generated/` не правятся руками. Если OpenAPI-спецификация неполная или генератор дал слишком общий тип (`object`, `unknown`, отсутствующее поле), расширения живут в `types/`.

```text
src/infra/biocad-less-rest-api/
├── generated/
│   ├── data-contracts.ts
│   ├── operations/
│   └── index.ts
├── types/
│   ├── term.ts
│   └── index.ts
├── client.ts
├── rest-api.ts
└── index.ts
```

Пример расширения generated-типа:

```ts
// src/infra/biocad-less-rest-api/types/term.ts
import type { TermRecordItem } from '../generated/data-contracts'

declare module '../generated/data-contracts' {
  interface TermRecordItem {
    media?: {
      file?: string
      title?: string
      url?: string
    }
  }
}

export type TermRecordItemExtended = Omit<
  TermRecordItem,
  'categories' | 'tags' | 'fields'
> & {
  categories?: Array<{
    _id?: string
    id?: string
    slug?: string
    name?: string
  }>
  tags?: Array<{
    _id?: string
    id?: string
    slug?: string
    name?: string
  }>
  fields?: Record<string, unknown>
}
```

```ts
// src/infra/biocad-less-rest-api/types/index.ts
export type { TermRecordItemExtended } from './term'
```

`declare module` нацеливается на `../generated/data-contracts` — именно там живут generated-интерфейсы. Он используется для добавления отсутствующих полей. `Extended`-тип используется, когда нужно переопределить неточные поля, не трогая generated-файлы.

## Публичный API

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
```

Наружу импортируют только из `infra/pet-store-rest-api`, не из `generated/`.

Если у модуля есть расширенные типы, они тоже реэкспортируются через `index.ts`:

```ts
// src/infra/biocad-less-rest-api/index.ts
export type { TermRecordItemExtended } from './types'
```

## Регенерация

При изменении OpenAPI-схемы:

```bash
npm run codegen:pet-store-rest-api
```

Что меняется:

- Папка `generated/` — перезаписывается генератором целиком.
- `client.ts`, `rest-api.ts`, `hooks/`, `types/`, `index.ts` — не трогаются автоматически.

Если после регенерации поменялись имена операций, сигнатуры или типы, это исправляется в ручном коде модуля: `rest-api.ts`, GET-хуки, minimal clients и реэкспорты.

## Следующий шаг

После генерации настройте транспорт в `client.ts` по разделу [Кастомизация HTTP-клиента](./http-client.md), соберите полный API в `rest-api.ts`, затем проверьте [использование REST-клиента](../../SKILL.md#использование-rest-клиента) или добавьте [GET-хук REST-клиента](../../SKILL.md#get-хуки-rest-клиента) для Client Components.
