/**
 * Bound cache operations текущего Simple REST API provider scope.
 */
export type SimpleRestApiCache = {
  /** Ревалидирует products и categories. */
  invalidateCatalog: () => Promise<void>
  /** Ревалидирует protected order resources. */
  invalidateOrders: () => Promise<void>
  /** Ревалидирует все Simple API resources. */
  invalidateAll: () => Promise<void>
}
