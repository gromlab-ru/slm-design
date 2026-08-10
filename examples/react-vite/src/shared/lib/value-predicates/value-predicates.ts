/**
 * Проверяет, что массив содержит хотя бы один элемент.
 */
export const isNonEmptyArray = <Item>(
  value: readonly Item[] | null | undefined
): value is readonly [Item, ...Item[]] => {
  return Array.isArray(value) && value.length > 0
}

/**
 * Проверяет, что массив определён и не содержит элементов.
 */
export const isEmptyArray = <Item>(
  value: readonly Item[] | null | undefined
): value is readonly [] => {
  return Array.isArray(value) && value.length === 0
}

/**
 * Проверяет, что значение не равно null или undefined.
 */
export const isDefined = <Value>(value: Value | null | undefined): value is Value => {
  return value !== null && value !== undefined
}
