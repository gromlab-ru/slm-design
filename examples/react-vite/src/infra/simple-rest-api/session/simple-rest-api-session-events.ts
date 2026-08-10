/** Обработчик окончательного истечения REST-сессии. */
export type SimpleRestApiSessionExpiredListener = () => void

const listeners = new Set<SimpleRestApiSessionExpiredListener>()

/**
 * Подписывает владельца пользовательской сессии на потерю credentials.
 */
export const subscribeSimpleRestApiSessionExpired = (
  listener: SimpleRestApiSessionExpiredListener
): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/**
 * Сообщает подписчикам, что refresh token больше нельзя использовать.
 */
export const notifySimpleRestApiSessionExpired = (): void => {
  listeners.forEach((listener) => listener())
}
