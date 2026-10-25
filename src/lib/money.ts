import Decimal from 'decimal.js'

/** Precisão usada em todos os cálculos monetários (ETH). */
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export type { Decimal }

export function dec(value: string | number): Decimal {
  return new Decimal(value)
}

/** Normaliza um valor ETH para string decimal com até 6 casas, sem zeros à direita. */
export function toEthString(value: Decimal.Value): string {
  const rounded = new Decimal(value).toDecimalPlaces(6, Decimal.ROUND_HALF_UP)
  const fixed = rounded.toFixed(6)
  return fixed.replace(/\.?0+$/, '') || '0'
}

export function addEth(...values: Array<Decimal.Value>): string {
  return toEthString(values.reduce<Decimal>((acc, value) => acc.plus(value), new Decimal(0)))
}

export function subEth(a: Decimal.Value, b: Decimal.Value): string {
  const result = new Decimal(a).minus(b)
  return toEthString(result.isNegative() ? 0 : result)
}

export function mulEth(a: Decimal.Value, b: Decimal.Value): string {
  return toEthString(new Decimal(a).times(b))
}

export function sumLineTotals(
  lines: ReadonlyArray<{ unitPriceEth: string; quantity: number }>,
): string {
  return toEthString(
    lines.reduce<Decimal>(
      (acc, line) => acc.plus(new Decimal(line.unitPriceEth).times(line.quantity)),
      new Decimal(0),
    ),
  )
}

export function percentOf(value: Decimal.Value, percent: number): string {
  return toEthString(new Decimal(value).times(percent).div(100))
}

export function isEthAmount(value: unknown): value is string {
  return typeof value === 'string' && /^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value)
}

export function compareEth(a: string, b: string): number {
  return new Decimal(a).comparedTo(new Decimal(b))
}

export function formatEth(value: string | number, options?: { withSymbol?: boolean }): string {
  const formatted = toEthString(value)
  return options?.withSymbol === false ? formatted : `${formatted} ETH`
}

export function formatEthPrecise(value: string): string {
  return `${toEthString(value)} ETH`
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
