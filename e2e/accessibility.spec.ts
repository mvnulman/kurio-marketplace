

import { startFresh } from './helpers'
import { auditA11y, expect, test } from './fixtures'

test.describe('acessibilidade e navegação por teclado', () => {
  test('varredura axe nas telas principais', async ({ page }) => {
    await startFresh(page)
    await auditA11y(page)

    await page.goto('/nft/nft-01')
    await page.waitForTimeout(1000)
    await auditA11y(page)

    await page.goto('/cart')
    await page.waitForTimeout(900)
    await auditA11y(page)

    await page.goto('/login')
    await page.waitForTimeout(700)
    await auditA11y(page)
  })

  test('navegação por teclado: busca, foco visível e diálogo', async ({ page }) => {
    await startFresh(page)

    // pular para o conteúdo
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /pular para o conteúdo/i })).toBeFocused()

    // atalho de busca
    await page.keyboard.press('Control+k')
    await expect(page.getByLabel(/termo de busca/i)).toBeFocused()
    await page.keyboard.press('Escape')

    // tab até o carrinho e ativação por teclado
    await page.getByRole('link', { name: /carrinho/i }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL('/cart')
    await expect(page.getByRole('heading', { name: /carrinho/i })).toBeVisible()
  })

  test('mensagens de erro são associadas aos campos', async ({ page }) => {
    await startFresh(page, '/login')
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()

    const email = page.getByLabel(/e-mail/i)
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('p[role=alert]').first()).toBeVisible()
  })

  test('skeletons com shimmer durante carregamento lento', async ({ page }) => {
    await page.goto('/?reset=1')
    await page.evaluate(async () => {
      await fetch('/api/dev/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'slow' }),
      })
    })

    await page.goto('/')
    await page.waitForTimeout(250)
    await expect(page.locator('[data-slot=skeleton]').first()).toBeVisible()
    await page.waitForTimeout(2500)
    await expect(page.locator('#catalogo article').first()).toBeVisible()
  })
})

