# Модуль React внутри домена

> Пояснение границы фреймворка на примере React.

## Связанные правила

- [`SLM-L3-FRAMEWORK-R013`](../../rules/level-3.md#slm-l3-framework-r013)
- [`SLM-L3-BUSINESS-A004`](../../rules/level-3.md#slm-l3-business-a004)
- [`SLM-L3-ASSEMBLY-R010`](../../rules/level-3.md#slm-l3-assembly-r010)

## Имя и место модуля

Зависящий от фреймворка модуль находится непосредственно в домене и называется именем фреймворка:

```text
domains/auth/react/
├── components/
├── hooks/
├── providers/
├── types/
└── index.ts
```

Имя `react` точно обозначает зависимость и не требует пустой промежуточной группы `framework/react` или `bindings/react`. Если домен действительно поддерживает другой фреймворк, он получает отдельный соседний модуль, например `vue`.

## Роль модуля React

Модуль React может:

- передавать готовый `AuthApi` через контекст и провайдер;
- предоставлять хук доступа к API или состоянию;
- связывать жизненный цикл React с подпиской;
- реализовывать относящийся к домену React-компонент.

Он не меняет предметные правила, не создаёт ошибки домена, не выбирает адаптеры и не вызывает фабрику или типовую сборку. Сборка остаётся у модуля-владельца графа; модуль React получает готовый экземпляр.

```tsx
type AuthProviderProps = PropsWithChildren<{
  api: AuthApi
}>

export const AuthProvider = ({ api, children }: AuthProviderProps) => {
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
```

## Наблюдение за состоянием

Если `AuthApi` предоставляет независимый от фреймворка интерфейс `getSnapshot` и `subscribe`, модуль React может использовать `useSyncExternalStore`:

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

Модуль `business` не импортирует React и не возвращает React-хук как единственный способ наблюдать состояние. Подпиской и её очисткой управляет `useSyncExternalStore`.

## Интерфейс домена и композиции

Компонент принадлежит `react`, если его ответственность ограничена контрактом домена: он работает с `AuthApi`, состоянием и устойчивыми ошибками домена. Он не владеет страницей, маршрутом, перенаправлением, продуктовым текстом или композицией нескольких доменов.

Экран, результат маршрута, локальный текст ошибки, перенаправление и интерфейс конкретной страницы остаются в `compositions`. Зависимость от React сама по себе не доказывает принадлежность домену.
