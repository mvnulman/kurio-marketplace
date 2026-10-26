

import { setScenario, startFresh } from './helpers'
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
    await expect(page.locator('#global-search')).toBeFocused()
    await page.keyboard.press('Escape')

    // tab até o carrinho e ativação por teclado
    await page.getByRole('banner').getByRole('link', { name: /carrinho/i }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL('/cart')
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  })

  test('mensagens de erro são associadas aos campos', async ({ page }) => {
    await startFresh(page, '/login')
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()

    const email = page.locator('#login-email')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('p[role=alert]').first()).toBeVisible()
  })

  test('skeletons com shimmer durante carregamento lento', async ({ page }) => {
    await page.goto('/?rar=epico&reset=1')

    await setScenario(page, 'slow')

    // O recarregamento zera o cache em memória do TanStack Query: a listagem
    // volta ao estado "pending" e os skeletons aparecem de forma determinística.
    await page.reload()
    await expect(page.locator('#catalogo [data-slot=skeleton]:visible').first()).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.locator('#catalogo article').first()).toBeVisible({ timeout: 15_000 })
  })
})


