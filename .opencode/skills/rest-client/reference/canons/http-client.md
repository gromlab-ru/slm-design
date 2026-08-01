---
title: Кастомизация HTTP-клиента
description: Настройка транспорта REST-клиента через опции и хуки HttpClient.
keywords: [rest, http, транспорт, авторизация, jwt, refresh token, onRequest, onError]
---

# Кастомизация HTTP-клиента

Настройка транспорта REST-клиента через опции и хуки `HttpClient`.

## Где живёт кастомизация

Вся настройка транспорта — `baseUrl`, заголовки, авторизация, retry — задаётся в `client.ts` REST-модуля при создании `HttpClient`.

Не размещайте авторизацию, обработку 401 и логирование в компонентах, GET-хуках или обёртках над операциями: у транспорта одна точка настройки.

В generated/SDK-сценарии `HttpClient` импортируется из generated-кода или SDK-пакета. В ручном сценарии без OpenAPI `HttpClient` импортируется из runtime-зависимости `@gromlab/api-codegen`.

```ts
import { HttpClient } from '@gromlab/api-codegen'
```

## Опции HttpClient

`HttpClient` принимает плоский конфиг: стандартные `fetch`-опции задаются вместе с хуками клиента.

| Опция | Назначение |
| --- | --- |
| `baseUrl` | Базовый URL API. |
| `headers` | Заголовки по умолчанию для всех запросов. |
| `credentials` | Политика отправки cookies: `omit`, `same-origin`, `include`. |
| `timeout` | Таймаут запроса в миллисекундах, работает через `AbortSignal`. |
| `customFetch` | Замена стандартного `fetch`: тесты, SSR, custom transport. |
| `paramsSerializer` | Кастомная сериализация query params в URL. |
| `responseParser` | Кастомный парсинг response body. |
| `onRequest` | Request-хук перед вызовом `fetch`. |
| `onResponse` | Response-хук после успешного HTTP-ответа. |
| `onError` | Error-хук для HTTP-ошибок, network errors и ошибок парсинга. |

Полный список опций — в README `@gromlab/api-codegen`.

## Контракт хуков

- `onRequest(params, context)` вызывается перед `fetch` и возвращает изменённые `params`.
- `onResponse(response, context)` вызывается после успешного ответа и возвращает `response`.
- `onError(error, context)` вызывается для HTTP-ошибок, network errors и ошибок парсинга.
- `context` содержит `url`, `request`, `retryCount` и `retry()` — повтор текущего запроса.
- `onError` должен либо бросить ошибку, либо вернуть fallback-значение, либо вернуть результат `context.retry()`. Если вернуть `undefined`, ошибка будет считаться обработанной, а вызывающий код получит `undefined` вместо исключения.
- Для защищённых endpoints generated operation передаёт `secure: true`, поэтому авторизацию можно добавлять только там, где она нужна.

## JWT-авторизация

Токен добавляется в `onRequest` только для защищённых запросов и не перезаписывает явно переданный `Authorization`.

```ts
// src/infra/pet-store-rest-api/client.ts
export const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
  onRequest: (params) => {
    const token = localStorage.getItem('access_token')

    if (!params.secure || !token) {
      return params
    }

    const headers = new Headers(params.headers)

    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return {
      ...params,
      headers,
    }
  },
})
```

## Refresh token

Обновление токена и повтор запроса выполняются в `onError` через `context.retry()`. `context.retryCount` защищает от бесконечного цикла повторов.

```ts
// src/infra/pet-store-rest-api/client.ts
import { ApiError, HttpClient } from './generated'

export const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
  onError: async (error, context) => {
    if (error instanceof ApiError && error.status === 401 && context.retryCount === 0) {
      await refreshToken()
      return context.retry()
    }

    throw error
  },
})
```

`ApiError` экспортируется из `generated/` и содержит `status`, `statusText`, `response`, `data` и исходный `request`.

## Логирование

```ts
const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
  onResponse: (response, context) => {
    console.log(context.request.method, context.url, response.status)
    return response
  },
})
```

## Сериализация query params

```ts
const petStoreHttpClient = new HttpClient({
  baseUrl: 'https://example.com/api',
  paramsSerializer: (query) => {
    const params = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.set(key, value.join(','))
        return
      }

      if (value !== undefined) {
        params.set(key, String(value))
      }
    })

    return params.toString()
  },
})
```

## Параметры одного вызова

Разовые настройки запроса не относятся к `HttpClient`. Они передаются последним аргументом operation:

```ts
import { getPetById } from './generated/operations/get-pet-by-id'
import { petStoreHttpClient } from './client'

await getPetById(
  petStoreHttpClient,
  { petId },
  {
    headers: {
      'X-Request-Id': requestId,
    },
  },
)
```

## Правила

- Кастомизация транспорта живёт только в `client.ts` REST-модуля.
- Авторизация добавляется в `onRequest` с учётом `params.secure` и без перезаписи явного `Authorization`.
- `onError` либо бросает ошибку, либо возвращает fallback или `context.retry()`; молчаливый `return` запрещён.
- Повторы запроса ограничиваются проверкой `context.retryCount`.
- Бизнес-реакции на ошибки — тосты, редиректы, UI-состояние — не размещаются в хуках `HttpClient`.

## Следующий шаг

После настройки транспорта проверьте [использование REST-клиента](../../SKILL.md#использование-rest-клиента) или добавьте [GET-хуки REST-клиента](../../SKILL.md#get-хуки-rest-клиента).
