/**
 * Проверяет, что значение является строкой.
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

/**
 * Проверяет, что значение является конечным числом.
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Проверяет, что значение является массивом без уточнения элементов.
 */
export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value)
}

/**
 * Проверяет массив и каждый его элемент переданным предикатом.
 */
export const isArrayOf = <T>(value: unknown, isItem: (item: unknown) => item is T): value is T[] => {
  return Array.isArray(value) && value.every(isItem)
}

/**
 * Проверяет отсутствие элементов, считая null и undefined пустым списком.
 */
export const isEmptyArray = (value: readonly unknown[] | null | undefined): boolean => {
  return !Array.isArray(value) || value.length === 0
}

/**
 * Проверяет, что список существует и содержит хотя бы один элемент.
 */
export const isNonEmptyArray = <T>(
  value: readonly T[] | null | undefined
): value is readonly [T, ...T[]] => {
  return Array.isArray(value) && value.length > 0
}

/**
 * Проверяет, что значение является объектом-записью.
 */
export const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Проверяет наличие собственного свойства объекта.
 */
export const hasOwn = <K extends PropertyKey>(value: object, key: K): value is Record<K, unknown> => {
  return Object.prototype.hasOwnProperty.call(value, key)
}

/**
 * Проверяет принадлежность значения набору литералов.
 */
export const isOneOf = <T extends readonly unknown[]>(value: unknown, values: T): value is T[number] => {
  return values.some((item) => item === value)
}
