# Value Predicates

`value-predicates` — небольшая библиотека runtime-предикатов для безопасной работы с `unknown`, `null`, массивами и объектами.

Файл содержит два типа утилит:

- Type guards: возвращают `value is T` и сужают тип в TypeScript.
- Boolean-предикаты: возвращают `boolean` и используются для читаемых условий без обязательного narrowing.

Проверки доменных DTO и API-ответов не размещаются здесь. Они должны жить рядом с владельцем данных: business-модулем, mapper/source или infra-адаптером.

## Группы

- `Nullish`: `isDefined`, `isNotDefined`.
- `Primitives`: `isString`, `isNumber`, `isBoolean`.
- `Strings`: `isNonEmptyString`.
- `Arrays`: `isArray`, `isArrayOf`, `isEmptyArray`, `isNonEmptyArray`.
- `Objects`: `isRecord`, `hasOwn`.
- `Combinators`: `isOneOf`.

## Правило для TSX

В conditional rendering не пишем голые проверки длины массива:

```tsx
items?.length
items.length > 0
items.length !== 0
items.length === 0
!items.length
items && items.map(...)
```

Для списков используем `isEmptyArray`, `isNonEmptyArray`, а для `unknown`-данных — `isArrayOf`.

Голый `.length` допустим, когда нужен именно числовой размер для текста, расчётов или атрибутов.

## Уже типизированный массив

```tsx
const ordersData = orders.data

{isNonEmptyArray(ordersData) && (
  <OrdersList orders={ordersData} />
)}
```

В этом сценарии `ordersData` уже имеет тип вроде `Order[] | null | undefined`, поэтому достаточно проверить, что массив существует и не пуст.

## Empty state

```tsx
const ordersData = orders.data
const shouldShowEmptyState = isEmptyArray(ordersData) && !orders.isLoading

{shouldShowEmptyState && (
  <EmptyState />
)}
```

`isEmptyArray` считает `null` и `undefined` пустым списком. Это удобно для UI-состояний, где отсутствие данных и пустой список показывают один empty state.

## Map в JSX

```tsx
const itemsData = items

{isNonEmptyArray(itemsData) && itemsData.map((item) => (
  <Card key={item.id} item={item} />
))}
```

Сначала сужаем локальную переменную, потом используем её в `map`. Не дублируем путь к данным внутри JSX.

## Unknown/API данные

```tsx
type Order = {
  id: string
  title: string
}

const isOrder = (value: unknown): value is Order => {
  return (
    isRecord(value) &&
    hasOwn(value, 'id') &&
    isString(value.id) &&
    hasOwn(value, 'title') &&
    isString(value.title)
  )
}

const ordersData = response.data

{isArrayOf(ordersData, isOrder) && (
  <OrdersList orders={ordersData} />
)}
```

`isArrayOf` нужен на границе с недоверенными данными: он проверяет не только массив, но и каждый элемент через item guard.

Если нужно одновременно проверить форму элементов и непустой массив:

```tsx
const canRenderOrders = isArrayOf(ordersData, isOrder) && isNonEmptyArray(ordersData)

{canRenderOrders && (
  <OrdersList orders={ordersData} />
)}
```

Если такой паттерн повторится много раз, можно добавить отдельный `isNonEmptyArrayOf`, но заранее его не вводим.

## Object fields

```ts
if (isRecord(value) && hasOwn(value, 'code') && isString(value.code)) {
  // value.code: string
}
```

`isRecord` проверяет только базовую форму объекта: не `null` и не массив. Конкретные поля всегда проверяются отдельно.

## Literal unions

```ts
const statuses = ['draft', 'published'] as const

if (isOneOf(value, statuses)) {
  // value: 'draft' | 'published'
}
```

`isOneOf` удобен для runtime-проверки union-типов, собранных из `as const` массивов.

## Нормализованный массив

Если массив заранее нормализован, прямой `map` допустим:

```tsx
const ordersData = orders.data ?? []

return ordersData.map((order) => (
  <OrderCard key={order.id} order={order} />
))
```

Для conditional rendering empty state всё равно используем predicate:

```tsx
{isEmptyArray(ordersData) && (
  <EmptyState />
)}
```
