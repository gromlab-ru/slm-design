---
title: SDK-пакет REST-клиента
description: Вынос generated REST-клиента в npm-пакет или пакет монорепозитория.
keywords: [rest, sdk, npm, монорепозиторий, api-codegen, generated, пакет]
---

# SDK-пакет REST-клиента

Вынос generated REST-клиента в npm-пакет или пакет монорепозитория.

## Когда выносить

SDK-пакет нужен, когда один и тот же API используется несколькими приложениями: в монорепозитории или через публикацию в npm registry.

Если API нужен одному приложению, SDK-пакет не создаётся — генерация идёт классически внутрь infra-модуля в `{name}-rest-api/generated` по разделу [Автогенерация из OpenAPI](./auto.md).

## Нейминг

SDK-пакет называется `{name}-rest-api-sdk`.

```text
pet-store-rest-api-sdk
@company/pet-store-rest-api-sdk
```

Имя SDK-пакета образуется от имени infra-модуля: приложение с модулем `infra/pet-store-rest-api` потребляет пакет `pet-store-rest-api-sdk`.

## Что содержит SDK

SDK-пакет содержит только generated-код и `package.json` exports для точечных импортов. Это транспорт-нейтральная библиотека: она не знает про приложение, авторизацию и SWR конкретного проекта.

В SDK не размещаются:

- `client.ts` и `rest-api.ts` — настройка транспорта и bound API живут в приложении;
- GET-хуки — SWR-обёртки живут в infra-модуле приложения;
- бизнес-логика и DTO-маппинг.

## Структура пакета

```text
packages/pet-store-rest-api-sdk/
├── package.json
└── src/
    └── generated/
```

Скрипт генерации внутри пакета выводит split-клиент в `src/generated`:

```json
{
  "scripts": {
    "codegen": "npx @gromlab/api-codegen@latest -i https://petstore3.swagger.io/api/v3/openapi.json -o src/generated"
  }
}
```

`package.json` обязан открыть subpath exports для generated частей:

```json
{
  "name": "@company/pet-store-rest-api-sdk",
  "type": "module",
  "exports": {
    ".": "./src/generated/index.ts",
    "./create-api-client": "./src/generated/create-api-client.ts",
    "./data-contracts": "./src/generated/data-contracts.ts",
    "./http-client": "./src/generated/http-client.ts",
    "./operations": "./src/generated/operations/index.ts",
    "./operations/*": "./src/generated/operations/*.ts",
    "./operations-tree": "./src/generated/operations-tree.ts"
  }
}
```

Файлы в `src/generated/` не правятся руками и коммитятся в репозиторий пакета.

Корневой `package.json` монорепозитория добавляет удобный script для запуска codegen через workspace filter:

```json
{
  "scripts": {
    "codegen:pet-store-rest-api-sdk": "dotenv -- pnpm --filter @company/pet-store-rest-api-sdk run codegen"
  }
}
```

## Потребление в приложении

Приложение оформляет REST-модуль как обычно: `src/infra/{name}-rest-api/` с `client.ts`, `rest-api.ts`, `hooks/`, `types/` и корневым `index.ts`. Меняется только источник generated-кода: вместо локальной папки `generated/` импортируется SDK-пакет.

```ts
// src/infra/pet-store-rest-api/client.ts
import { HttpClient } from '@company/pet-store-rest-api-sdk'

export const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
})
```

```ts
// src/infra/pet-store-rest-api/rest-api.ts
import { createApiClient } from '@company/pet-store-rest-api-sdk/create-api-client'
import { operationsTree } from '@company/pet-store-rest-api-sdk/operations-tree'
import { petStoreHttpClient } from './client'

export const petStoreRestApi = createApiClient(petStoreHttpClient, operationsTree)
```

Типы в хуках и `types/` импортируются из пакета вместо `../generated`:

```ts
import type { GetPetByIdParams, Pet } from '@company/pet-store-rest-api-sdk'
```

GET-хуки импортируют точечные operations из SDK subpath:

```ts
import { getPetById } from '@company/pet-store-rest-api-sdk/operations/get-pet-by-id'
```

Остальной контракт модуля не меняется:

- настройка транспорта — [Кастомизация HTTP-клиента](./http-client.md);
- GET-хуки — [GET-хуки REST-клиента](../../SKILL.md#get-хуки-rest-клиента);
- внешний код импортирует только из `infra/pet-store-rest-api`, не из SDK-пакета напрямую.

## Minimal Client В Composition

SDK operations можно импортировать напрямую в boundary-файлах feature/composition, если там собирается минимальный клиент для конкретного бизнес-сценария.

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

Это исключение действует только для boundary-файлов сборки клиента. UI/components, pages и произвольные helpers не импортируют SDK напрямую.

## Регенерация

При изменении OpenAPI-схемы перегенерируется `src/generated` внутри SDK-пакета:

```bash
npm run codegen
```

Приложения получают обновление через новую версию пакета. Если поменялись имена операций или типы, правки в приложении локализованы в `rest-api.ts`, GET-хуках, minimal clients и реэкспортах.

## Правила

- SDK-пакет называется `{name}-rest-api-sdk` и содержит только generated-код.
- SDK-пакет обязан открыть subpath exports: `.`, `./operations/*`, `./create-api-client`, `./operations-tree`, `./http-client`, `./data-contracts`.
- Генерация внутри пакета идёт в `src/generated`, файлы не правятся руками.
- `client.ts`, `rest-api.ts`, авторизация и GET-хуки живут в infra-модуле приложения, не в SDK.
- Приложение импортирует SDK внутри своего `infra/{name}-rest-api` модуля.
- Boundary-файл feature/composition может импортировать SDK operations напрямую только для сборки minimal client.
- UI/components не импортируют SDK напрямую.
