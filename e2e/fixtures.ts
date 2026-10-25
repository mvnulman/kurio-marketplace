import AxeBuilder from '@axe-core/playwright'
import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export { expect }

interface Fixtures {
  axe: () => AxeBuilder
}

export const test = base.extend<Fixtures>({
  axe: async ({ page }, useAxie) => {
    await useAxie(() => new AxeBuilder({ page }))
  },
})

/** Varredura de acessibilidade focada nas regras críticas. */
export async function auditA11y(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast', 'aria-allowed-attr', 'button-name', 'image-alt', 'label'])
    .analyze()

  const violations = results.violations.filter((violation) => violation.impact !== 'minor')
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
}
