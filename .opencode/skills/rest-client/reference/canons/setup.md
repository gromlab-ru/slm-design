---
title: Настройка REST-клиента
description: Подготовка REST-клиента сервиса к использованию.
keywords: [rest, клиент, infra, operation, openapi, get-хуки, swr]
---

# Настройка REST-клиента

Подготовка REST-клиента сервиса к использованию.

## Что настраиваем

REST-клиент — это infra-модуль, через который проект работает с внешним REST API.

На этапе настройки нужно подготовить транспортный HTTP-клиент, полный API-клиент и GET-хуки для клиентских компонентов.

## Нейминг

- infra-модуль REST-клиента называется `{name}-rest-api`: `src/infra/pet-store-rest-api/`.
- Генерация внутри клиента — классический вариант — живёт в `{name}-rest-api/generated`.
- Если generated-клиент выносится в npm-пакет или пакет монорепозитория, пакет называется `{name}-rest-api-sdk`: [SDK-пакет REST-клиента](./sdk.md).
- Производные имена образуются от имени модуля: транспорт `petStoreHttpClient`, полный API-клиент `petStoreRestApi`, SWR-ключ `['pet-store-rest-api', ...]`.

## Из чего состоит клиент

REST-клиент состоит из четырёх основных частей:

1. **Транспорт** — ручной `client.ts` с настроенным `*HttpClient`.
2. **Полный API-клиент** — `rest-api.ts` с `createApiClient(*HttpClient, operationsTree)`.
3. **Операции** — operation-функции, сгенерированные из OpenAPI, поставляемые SDK-пакетом или написанные вручную через `@gromlab/api-codegen`.
4. **GET-хуки** — SWR-обёртки для GET-запросов.

Эти части живут в одном REST-модуле, потому что относятся к одному внешнему сервису.

## Транспорт

`client.ts` — ручной слой, который настраивает транспорт: `HttpClient`, заголовки, авторизацию и обработку ошибок.

Авторизация, refresh token и другие транспортные сценарии настраиваются хуками `HttpClient` — `onRequest`, `onResponse`, `onError`: [Кастомизация HTTP-клиента](./http-client.md).

Даже если операции генерируются из OpenAPI, `client.ts` остаётся ручным файлом проекта.

`client.ts` экспортирует только настроенный `*HttpClient`. В нём не размещаются DTO, `declare module`, `Extended`-типы, GET-хуки, `operationsTree`, `createApiClient` и бизнес-логика.

```ts
// src/infra/pet-store-rest-api/client.ts
import { HttpClient } from '@company/pet-store-rest-api-sdk'

export const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
})
```

## Полный API-клиент

`rest-api.ts` собирает полный bound API-клиент из всего generated дерева операций.

```ts
// src/infra/pet-store-rest-api/rest-api.ts
import { createApiClient } from '@company/pet-store-rest-api-sdk/create-api-client'
import { operationsTree } from '@company/pet-store-rest-api-sdk/operations-tree'
import { petStoreHttpClient } from './client'

export const petStoreRestApi = createApiClient(petStoreHttpClient, operationsTree)
```

Импортируйте `operationsTree` только в `rest-api.ts`. Для GET-хуков и minimal clients используйте точечные operation imports.

## Операции

Операции описывают конкретные запросы к API.

Они появляются одним из трёх способов:

- генерируются из OpenAPI в `generated/` как отдельные operation-функции;
- поставляются SDK-пакетом `{name}-rest-api-sdk`;
- создаются вручную в `operations/` через `@gromlab/api-codegen`, если OpenAPI нет или он неполный.

Подробности:

- [Автогенерация из OpenAPI](./auto.md)
- [Ручное создание](./manual.md)

## GET-хуки

Для GET-запросов добавляются GET-хуки REST-клиента.

Это прозрачные SWR-обёртки над generated GET operations. Они живут в `hooks/` этого же REST-модуля и нужны для использования данных в Client Components.

GET-хуки именуются с префиксом `useGet`: `useGetPetList`, `useGetPetDetail`, `useGetCurrentUser`.

Каждый GET-хук имеет экспортируемую key-функцию. SWR-ключ всегда имеет формат `[serviceName, endpoint]`: например `['pet-store-rest-api', '/pet/10']`.

Хук принимает generated-параметры операции и SWR-настройки: `params?: GetPetByIdParams | null`, `config?: SWRConfiguration<Pet>`.

`hooks/index.ts` содержит `'use client'` и экспортирует все GET-хуки. Сами `use-get-*.hook.ts` остаются обычными файлами без директивы.

Подробности:

- [GET-хуки REST-клиента](../../SKILL.md#get-хуки-rest-клиента)

## Структура модуля

```text
src/infra/{name}-rest-api/
├── client.ts                 # настройка и экспорт *HttpClient
├── rest-api.ts               # полный *RestApi через operationsTree
├── generated/ или operations/ # локальный split-клиент или ручные operations
├── operations-tree.ts         # ручное дерево операций, если нет generated/operations-tree.ts
├── hooks/                    # GET-хуки REST-клиента
│   ├── lib/
│   │   └── create-query-string.ts
│   ├── use-get-*.hook.ts
│   └── index.ts              # 'use client' и публичные экспорты hooks
├── types/                    # DTO, именованные response-типы и расширения типов
├── errors/                   # ошибки API, если нужны
└── index.ts                  # публичный API
```

`index.ts` — единственная точка входа в REST-модуль для внешнего кода.

Если generated-код вынесен в `{name}-rest-api-sdk`, локальной папки `generated/` внутри infra-модуля может не быть: `client.ts`, `rest-api.ts` и GET-хуки импортируют generated части из SDK subpath exports.

Если OpenAPI нет, не создавайте самописный `fetch`-класс и `methods/`. Ручной клиент пишется тем же API, что generated-клиент: `HttpClient`, `ApiRequestClient`, `RequestParams`, operation-функции и `createApiClient` из `@gromlab/api-codegen`.

Если generated operation возвращает безымянный тип вроде `Record<string, number>`, а этот тип нужен снаружи, вынесите его в `types/`. Не объявляйте DTO внутри `hooks/use-get-*.hook.ts`.

## Что делаем дальше

1. Создайте операции клиента: [Автогенерация из OpenAPI](./auto.md), SDK-пакет или [Ручное создание](./manual.md).
2. Если клиент нужен нескольким приложениям, вынесите generated-код в пакет: [SDK-пакет REST-клиента](./sdk.md).
3. Настройте транспорт — авторизацию, хуки, таймауты: [Кастомизация HTTP-клиента](./http-client.md).
4. Добавьте GET-хуки для GET-запросов: [GET-хуки REST-клиента](../../SKILL.md#get-хуки-rest-клиента).
5. Проверьте прямые вызовы клиента: [Использование REST-клиента](../../SKILL.md#использование-rest-клиента).
6. После настройки клиента выбирайте стратегию route-level data fetching по `nextjs-style-guide`.
