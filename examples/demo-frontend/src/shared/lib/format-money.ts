/**
 * Форматирует сумму в минимальных единицах валюты для витрины.
 */
export const formatMoney = (valueCents: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(valueCents / 100)
}
