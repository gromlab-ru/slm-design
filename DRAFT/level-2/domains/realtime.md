# Realtime messages и subscriptions

> Пояснение Domain API поверх WebSocket, SSE, GraphQL subscriptions и provider SDK.

## Связанные правила

- [`SLM-L2-API-R006`](../../rules/level-2.md#slm-l2-api-r006)
- [`SLM-L2-ERROR-R009`](../../rules/level-2.md#slm-l2-error-r009)
- [`SLM-L2-ERROR-R010`](../../rules/level-2.md#slm-l2-error-r010)
- [`SLM-L2-ADAPTER-R021`](../../rules/level-2.md#slm-l2-adapter-r021)
- [`SLM-L2-ASSEMBLY-R023`](../../rules/level-2.md#slm-l2-assembly-r023)
- [`SLM-L2-PORT-R027`](../../rules/level-2.md#slm-l2-port-r027)
- [`SLM-L2-STATE-R028`](../../rules/level-2.md#slm-l2-state-r028)
- [`SLM-L2-REALTIME-R029`](../../rules/level-2.md#slm-l2-realtime-r029)

## Граница транспорта

Realtime transport находится внутри adapter:

```text
WebSocket / SSE / GraphQL / SDK
  → adapter
  → realtime port
  → Domain API
  → domain event/outcome/error
  → framework projection
```

Domain API не экспортирует `WebSocket`, `MessageEvent`, raw frames, SDK subscription, provider error или transport close code. Port также не должен быть generic socket API с `send(frame)` и `onMessage(frame)`: он описывает capability, необходимую конкретному домену.

## Realtime-команда

Публичная команда может выглядеть как обычный Promise независимо от транспорта:

```ts
export type ChatApi = {
  sendMessage: (
    command: SendMessageCommand,
  ) => Promise<ChatMessage>
}
```

Port возвращает типизированный technical outcome:

```ts
export type SendMessagePortFailure =
  | Readonly<{ type: 'FORBIDDEN' }>
  | Readonly<{ type: 'RATE_LIMITED' }>
  | Readonly<{ type: 'UNAVAILABLE' }>
  | Readonly<{ type: 'OUTCOME_UNKNOWN' }>

export type ChatRealtimePort = {
  sendMessage: (
    command: SendMessagePortCommand,
  ) => Promise<PortResult<ChatMessageRecord, SendMessagePortFailure>>
}
```

Domain API преобразует port result в `ChatMessage` или собственную `ChatError`. Для прикладного consumer transport остаётся незаметным.

## Correlation

`socket.send()` подтверждает только локальную отправку frame. Чтобы завершить `sendMessage()` результатом server command, protocol должен сопоставить command и acknowledgement:

```text
Domain API command
  → adapter assigns operationId
  → transport frame
  → server ACK or ERROR with operationId
  → adapter settles pending port operation
  → Domain API maps outcome
```

Adapter владеет protocol registry pending operations и не бросает error из async `onmessage`, который невозможно поймать вокруг исходного `send`. Он завершает соответствующую Promise или другой объявленный operation channel.

Correlation contract фиксирует:

- источник и scope уникальности operation ID;
- момент, когда команда считается принятой или выполненной;
- поведение при duplicate и late acknowledgement;
- timeout и cancellation;
- очистку pending operation при disconnect;
- связь command outcome с последующими domain events.

Если provider не возвращает correlation metadata, API не обещает индивидуальный результат. Такая операция является fire-and-forget, а поздний отказ публикуется отдельным domain event либо доступна только общая ошибка transport scope.

## Outcome uncertainty и idempotency

Disconnect после отправки и до acknowledgement не доказывает, что command не выполнена:

```text
frame sent
  → connection lost
  → server may have committed command
  → acknowledgement unknown
```

Port возвращает `OUTCOME_UNKNOWN`, если это различие нужно Domain API. Автоматический retry безопасен только при provider guarantee или idempotency key. Domain API не преобразует неопределённый outcome в ложное `MESSAGE_NOT_SENT`.

## Subscription

Публичная subscription предоставляет проверенные events и явный cleanup:

```ts
export type ChatEvent =
  | Readonly<{
      type: 'MESSAGE_CREATED'
      message: ChatMessage
      revision: number
    }>
  | Readonly<{
      type: 'MESSAGE_REMOVED'
      messageId: string
      revision: number
    }>

export type ChatSubscription = Readonly<{
  close: () => Promise<void>
}>

export type ChatObserver = Readonly<{
  onEvent: (event: ChatEvent) => void
  onError: (error: ChatRealtimeError) => void
  onStatus: (status: ChatRealtimeStatus) => void
}>

export type ChatApi = {
  subscribe: (
    observer: ChatObserver,
  ) => Promise<ChatSubscription>
}
```

Callback, async iterable или другой project-wide channel допустимы. Обязательны типизированные domain events/errors, определённый lifecycle и cleanup.

## Stable errors и statuses

Начальная ошибка подключения может завершить `subscribe()` domain error. Ошибка после успешного запуска приходит через stream channel.

Не каждый transport failure становится domain error. Adapter может восстановить соединение и опубликовать только устойчивый status:

```ts
export type ChatRealtimeStatus =
  | Readonly<{ type: 'CONNECTED' }>
  | Readonly<{ type: 'RECONNECTING' }>
  | Readonly<{ type: 'RESYNC_REQUIRED' }>
  | Readonly<{ type: 'CLOSED' }>
```

Публичные errors описывают реакции приложения, например `CHAT_REALTIME_UNAVAILABLE`, `CHAT_FORBIDDEN` или `CHAT_SESSION_EXPIRED`. Close codes, provider messages и SDK classes остаются внутри adapter.

Caller-initiated close не является domain error.

## Ordering, duplicates и resync

Realtime port явно объявляет:

- гарантируется ли порядок событий;
- возможна ли at-least-once delivery;
- кто устраняет duplicates;
- содержит ли event revision или sequence;
- как обнаруживается gap после reconnect;
- откуда загружается authoritative snapshot.

Если adapter не может доказать непрерывность, Domain API публикует `RESYNC_REQUIRED`. Framework binding invalidates projection и получает snapshot через query Domain API.

Binding не применяет raw delta к публичной модели. Если безопасный merge содержит предметную семантику, его выполняет операция Domain API или pure-функция `api/runtime`.

## Shared connection

Один adapter может multiplex несколько ports и subscriptions через физическое соединение. Connection имеет явные owner, scope, multiplicity и cleanup:

```text
assembly-owned connection
  ├── chat messages port
  ├── presence port
  └── notification port
```

Cleanup отдельной subscription снимает её lease. Cleanup assembly закрывает shared connection после завершения всех принадлежащих графу operations. После awaited cleanup новые callbacks запрещены.

Если создание connection завершилось успешно, а следующий шаг assembly упал, connection закрывается на rollback path до возврата ошибки.

## Framework materialization

Framework binding выбирает техническую реакцию на domain event:

```text
MESSAGE_CREATED
  → update query cache verified full model

RESYNC_REQUIRED
  → invalidate query
  → fetch snapshot through Domain API
```

Zustand, QueryClient, Pinia или другой store не импортирует socket adapter и не интерпретирует protocol frame. Он хранит только public values, events, statuses и errors Domain API.

## SSR, RSC и workers

Browser assembly может включать realtime adapter, а request/RSC assembly — только query API. Отсутствующий realtime API не заменяется throwing stub.

Server process или worker получает отдельную assembly и scope, если ему действительно нужна долгоживущая subscription. Server Component не открывает connection, которая переживает request, без отдельного owner вне request scope.

## Тестовые границы

API-тест с fake realtime port проверяет mapping records, failures, stable errors и public events. Adapter contract test проверяет protocol frames, correlation, timeout, disconnect, duplicate acknowledgement, reconnect, resync и cleanup. Framework test проверяет materialization и invalidation. Assembly test проверяет shared connection, rollback и отсутствие callbacks после disposal.

Контрольные случаи:

- acknowledgement приходит после timeout;
- duplicate acknowledgement приходит после reconnect;
- event приходит раньше command acknowledgement;
- disconnect происходит после send и до ACK;
- unsubscribe завершается во время pending callback;
- adapter получает malformed payload;
- следующий resource assembly падает после открытия connection.
