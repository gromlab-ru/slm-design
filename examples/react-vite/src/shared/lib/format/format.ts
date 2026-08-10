/**
 * Форматирует сумму в минимальных единицах валюты для русского интерфейса.
 */
export const formatCurrency = (valueCents: number, currency: string): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency
  }).format(valueCents / 100)
}

/**
 * Форматирует ISO-дату в короткое локализованное представление.
 */
export const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}
