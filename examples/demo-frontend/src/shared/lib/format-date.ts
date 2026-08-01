/**
 * Форматирует ISO-дату в короткую человекочитаемую дату.
 */
export const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value))
}
