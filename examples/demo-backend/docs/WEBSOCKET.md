# Socket.IO chat contract

## Connection

Connect to the Complex API namespace:

```text
http://localhost:3002/chat
```

The browser must already have a valid `demo_session` cookie and use credentials. Both `websocket` and `polling` transports are enabled.

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3002/chat", {
  withCredentials: true,
});
```

An invalid session receives `chat:error` and is disconnected.

## Client events

### `chat:join`

```json
{
  "organizationId": "org-acme",
  "conversationId": "conversation-support"
}
```

Response event: `chat:joined`.

### `chat:leave`

Uses the same payload. Response event: `chat:left`.

### `message:send`

```json
{
  "organizationId": "org-acme",
  "conversationId": "conversation-support",
  "text": "Can you check this order?",
  "clientMessageId": "frontend-generated-uuid"
}
```

Response event: `message:ack`. Room broadcast: `message:created`.

Sending the same `clientMessageId` again returns the existing message. Frontends should also deduplicate incoming `message:created` by server message `id`.

### `typing:start` and `typing:stop`

Use the `chat:join` payload. Other room members receive `typing:started` or `typing:stopped`:

```json
{
  "conversationId": "conversation-support",
  "userId": "complex-user-support"
}
```

## Error event

`chat:error` always contains a stable shape:

```json
{
  "code": "CHAT_OPERATION_FAILED",
  "message": "Conversation not found."
}
```

## Reconnect expectations

After reconnect, the frontend should join active conversations again and reload messages after its last known cursor. A session expired by `POST /api/v1/testing/session/expire` rejects the next Socket.IO connection.
