# React module внутри Domain

> Пояснение framework boundary Domain на примере React.

## Связанные правила

- [`SLM-L3-FRAMEWORK-R013`](../../rules/level-3.md#slm-l3-framework-r013)
- [`SLM-L3-BUSINESS-A004`](../../rules/level-3.md#slm-l3-business-a004)
- [`SLM-L3-ASSEMBLY-R010`](../../rules/level-3.md#slm-l3-assembly-r010)

## Имя и место module

Framework-specific module находится непосредственно в Domain и называется именем framework:

```text
domains/auth/react/
├── components/
├── hooks/
├── providers/
├── types/
└── index.ts
```

`react` точно обозначает framework и не создаёт пустую промежуточную Group вроде `framework/react` или `bindings/react`. Если Domain действительно поддерживает другой framework, он получает отдельный sibling module, например `vue`.

## Роль React module

React module может:

- передать готовый `AuthApi` через context/provider;
- создать hook доступа к API или framework-neutral state;
- связать React lifecycle с subscription API;
- реализовать domain-specific React component.

Он не меняет business rules, не создаёт domain errors, не выбирает concrete adapters и не вызывает factory или preset. Сборка остаётся у composition graph owner; React module получает уже готовый instance.

```tsx
type AuthProviderProps = PropsWithChildren<{
  api: AuthApi
}>

export const AuthProvider = ({ api, children }: AuthProviderProps) => {
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
```

## Reactive state

Если `AuthApi` предоставляет framework-neutral protocol `getSnapshot` и `subscribe`, React module может использовать `useSyncExternalStore`:

```tsx
'use client'

export const useAuthState = () => {
  const api = useAuth()

  return useSyncExternalStore(
    api.subscribe,
    api.getSnapshot,
    api.getSnapshot,
  )
}
```

Business не импортирует React и не возвращает React hook как единственный способ наблюдать state. React module не создаёт subscription до commit и возвращает cleanup через protocol `useSyncExternalStore`.

## Domain UI и compositions

Component принадлежит `react`, если его responsibility ограничена domain contract: он работает с `AuthApi`, domain state и stable domain errors. Он не владеет page, route, redirect, product copy или composition нескольких domains.

Screen, route outcome, локальный текст ошибки, redirect и page-specific UI остаются в `compositions`. Dependency от React сама по себе не доказывает принадлежность Domain.
