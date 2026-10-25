import { login, startFresh } from './helpers'
import { expect, test } from './fixtures'

/**
 * Regressão visual das telas principais, com dados estáveis (reset + seed
 * determinístico) e animações desligadas. Baselines versionadas em e2e/**.
 */
test.describe('regressão visual', () => {
  test('início (desktop e mobile)', async ({ page }) => {
    await startFresh(page, '/?sort=recent')
    await page.waitForTimeout(1600)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await expect(page).toHaveScreenshot('home.png')
  })

  test('detalhe do NFT', async ({ page }) => {
    await startFresh(page, '/nft/nft-01')
    await page.waitForTimeout(1600)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: false })
  })

  test('carrinho com itens', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/cart')
    await page.goto('/nft/nft-01')
    await page.getByRole('button', { name: /comprar/i, exact: true }).click()
    await page.waitForTimeout(600)
    await page.goto('/nft/nft-07')
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await page.getByRole('button', { name: /comprar/i, exact: true }).click()
    await page.waitForTimeout(600)

    await page.goto('/cart')
    await page.waitForTimeout(1100)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: false })
  })

  test('pagamento preenchido', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/checkout')
    await page.goto('/nft/nft-01')
    await page.getByRole('button', { name: /comprar/i, exact: true }).click()
    await page.waitForTimeout(600)
    await page.goto('/checkout')
    await page.waitForTimeout(1200)
    await page.getByRole('radio').first().click()
    await page.waitForTimeout(1400)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: false })
  })
})
