const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value)).replace('.', '')
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
