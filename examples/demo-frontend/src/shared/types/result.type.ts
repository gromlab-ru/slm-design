/**
 * Успешный результат прикладного сценария.
 */
export type SuccessResult<T> = {
  /** Признак успешного завершения. */
  isSuccess: true
  /** Значение завершённого сценария. */
  data: T
}

/**
 * Ожидаемая ошибка прикладного сценария.
 */
export type FailureResult<E> = {
  /** Признак неуспешного завершения. */
  isSuccess: false
  /** Безопасная ошибка текущего владельца. */
  error: E
}

/**
 * Явный канал успешного или ожидаемо неуспешного результата.
 */
export type Result<T, E> = SuccessResult<T> | FailureResult<E>
