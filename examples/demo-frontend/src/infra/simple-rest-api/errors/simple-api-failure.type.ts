/**
 * Безопасное техническое описание сбоя Simple API.
 */
export type SimpleApiFailure = {
  /** HTTP-статус или ноль для transport failure. */
  status: number
  /** Стабильный backend-код или локальный transport-код. */
  code: string
  /** Сообщение, пригодное для последующего доменного перевода. */
  message: string
}
