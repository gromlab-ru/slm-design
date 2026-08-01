/**
 * Value predicates для проверки runtime-значений.
 *
 * Type guards в этом файле сужают unknown-данные только до базовых типов.
 * Boolean-предикаты используются для читаемых условий и не обязаны сужать тип.
 * Проверки доменных DTO и API-ответов размещаются рядом с владельцем данных.
 */

/* --- Nullish --- */

/**
 * Исключает только null и undefined из типа значения.
 *
 * `0`, `false` и пустая строка не считаются отсутствующими.
 * Удобно для `.filter(isDefined)`.
 *
 * @example
 * ```ts
 * const values = [0, null, false, undefined, '']
 * const definedValues = values.filter(isDefined)
 * // definedValues: Array<0 | false | ''>
 * ```
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
	return value != null
}

/**
 * Проверяет, что значение отсутствует как null или undefined.
 */
export const isNotDefined = <T>(value: T | null | undefined): value is null | undefined => {
	return value == null
}

/* --- Primitives --- */

/**
 * Сужает unknown-значение до string.
 */
export const isString = (value: unknown): value is string => {
	return typeof value === 'string'
}

/**
 * Сужает unknown-значение до конечного number.
 *
 * NaN и Infinity не проходят проверку.
 */
export const isNumber = (value: unknown): value is number => {
	return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Сужает unknown-значение до boolean.
 */
export const isBoolean = (value: unknown): value is boolean => {
	return typeof value === 'boolean'
}

/* --- Strings --- */

/**
 * Проверяет, что значение является строкой с непустым содержимым.
 *
 * Пробельная строка считается пустой.
 */
export const isNonEmptyString = (value: unknown): value is string => {
	return typeof value === 'string' && value.trim().length > 0
}

/* --- Arrays --- */

/**
 * Проверяет, что значение является массивом.
 *
 * Не проверяет тип элементов. Для проверки элементов используйте `isArrayOf`.
 */
export const isArray = (value: unknown): value is unknown[] => {
	return Array.isArray(value)
}

/**
 * Проверяет массив и каждый его элемент через переданный предикат элемента.
 *
 * Используется на границах с unknown-данными, когда нужно получить `T[]`.
 *
 * @example
 * ```ts
 * if (isArrayOf(value, isString)) {
 * 	// value: string[]
 * }
 * ```
 */
export const isArrayOf = <T>(value: unknown, isItem: (item: unknown) => item is T): value is T[] => {
	return Array.isArray(value) && value.every(isItem)
}

/**
 * Проверяет, что массив отсутствует или не содержит элементов.
 *
 * Null и undefined считаются пустым списком для UI-условий.
 */
export const isEmptyArray = (value: readonly unknown[] | null | undefined): boolean => {
	return !Array.isArray(value) || value.length === 0
}

/**
 * Проверяет, что массив существует и содержит хотя бы один элемент.
 *
 * Сужает тип до non-empty tuple, чтобы TypeScript знал,
 * что обращение к первому элементу безопасно.
 *
 * @example
 * ```ts
 * if (isNonEmptyArray(items)) {
 * 	const firstItem = items[0]
 * }
 * ```
 */
export const isNonEmptyArray = <T>(value: readonly T[] | null | undefined): value is readonly [T, ...T[]] => {
	return Array.isArray(value) && value.length > 0
}

/* --- Objects --- */

/**
 * Проверяет, что значение является объектом-записью.
 *
 * Исключает null и массивы, но не проверяет конкретную форму объекта.
 */
export const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Проверяет наличие собственного свойства объекта.
 *
 * Используйте вместе с `isRecord` перед чтением unknown-свойств.
 *
 * @example
 * ```ts
 * if (isRecord(value) && hasOwn(value, 'code') && isString(value.code)) {
 * 	// value.code: string
 * }
 * ```
 */
export const hasOwn = <K extends PropertyKey>(value: object, key: K): value is Record<K, unknown> => {
	return Object.prototype.hasOwnProperty.call(value, key)
}

/* --- Combinators --- */

/**
 * Проверяет, что значение входит в список допустимых литералов.
 *
 * Удобно для runtime-проверки union-типов из `as const` массивов.
 *
 * @example
 * ```ts
 * const statuses = ['draft', 'published'] as const
 *
 * if (isOneOf(value, statuses)) {
 * 	// value: 'draft' | 'published'
 * }
 * ```
 */
export const isOneOf = <T extends readonly unknown[]>(value: unknown, values: T): value is T[number] => {
	return values.some((item) => item === value)
}
