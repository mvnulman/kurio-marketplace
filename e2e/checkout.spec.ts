

import type { Page } from '@playwright/test'

import {
  addNftToCart,
  cartRows,
  changeNftPrice,
  DEMO_ACCOUNT,
  login,
  setScenario,
  startFresh,
} from './helpers'
import { expect, test } from './fixtures'

async function prepareCheckout(page: Page) {
  await startFresh(page)
  await login(page, undefined, '/checkout')
  await page.goto('/nft/nft-01')
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await page.waitForTimeout(600)
  await page.goto('/checkout')
  await page.waitForTimeout(900)
  await page.getByRole('radio').first().click()
  await page.waitForTimeout(1300)
}

test.describe('checkout e pedidos', () => {
  test('compra completa: catálogo → carrinho → pagamento → recibo confirmado', async ({ page }) => {
    await prepareCheckout(page)

    await page.getByRole('button', { name: /confirmar compra/i }).click()
    await page.waitForURL('**/orders/**', { timeout: 20_000 })
    await page.waitForTimeout(3000)

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
    await expect(page.getByText(/ID da transação/)).toBeVisible()

    // carrinho esvazia apenas com pedido confirmado
    await page.goto('/cart')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()

    // recibo permanece acessível e imutável
    await page.goBack()
    await page.waitForTimeout(800)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  })

  test('confirmação exibida apenas para pedido confirmado', async ({ page }) => {
    await prepareCheckout(page)
    await page.getByRole('button', { name: /confirmar compra/i }).click()
    await page.waitForURL('**/orders/**')

    // estado pendente não mostra recibo
    await expect(page.getByText(/Processando pagamento/)).toBeVisible()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeHidden()

    await page.waitForTimeout(3200)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  })

  test('pagamento recusado preserva o carrinho', async ({ page }) => {
    await prepareCheckout(page)
    await setScenario(page, 'payment-declined')

    await page.getByRole('button', { name: /confirmar compra/i }).click()
    await page.waitForURL('**/orders/**', { timeout: 20_000 })
    await page.waitForTimeout(3000)

    await expect(page.getByRole('heading', { name: 'Pagamento não concluído' })).toBeVisible()

    await page.goto('/cart')
    await expect(cartRows(page).filter({ hasText: 'Emerald Ape' })).toBeVisible()
  })

  test('timeout após criação recupera o mesmo pedido por idempotência', async ({ page }) => {
    await prepareCheckout(page)
    await setScenario(page, 'payment-timeout')

    await page.getByRole('button', { name: /confirmar compra/i }).click()
    await page.waitForTimeout(2500)

    // pedido em processamento aparece no lugar do checkout vazio
    await expect(page.getByText('Pedido em processamento')).toBeVisible()
    await page.getByRole('link', { name: /ver meus pedidos/i }).click()
    await page.waitForURL('/orders')

    // exatamente 1 pedido
    await expect(page.locator('main ul li')).toHaveCount(1)

    await page.locator('main ul li a').first().click()
    await page.waitForURL('**/orders/**')
    await page.waitForTimeout(3000)
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()
  })

  test('cliques repetidos não duplicam o pedido', async ({ page }) => {
    await prepareCheckout(page)

    const confirm = page.getByRole('button', { name: /confirmar compra/i })
    await confirm.click()
    await confirm.click({ force: true }).catch(() => {})
    await page.waitForURL('**/orders/**', { timeout: 20_000 })
    await page.waitForTimeout(3000)

    await page.goto('/orders')
    await expect(page.locator('main ul li')).toHaveCount(1)
  })

  test('mudança de preço durante o checkout exige nova confirmação', async ({ page }) => {
    await prepareCheckout(page)

    await changeNftPrice(page, 'nft-01', '2.75')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: /confirmar compra/i }).click()
    await page.waitForTimeout(1500)

    const dialog = page.locator('[role=dialog]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('mudaram')

    // sem confirmar, volta ao carrinho para revisar
    await dialog.getByRole('link', { name: /revisar carrinho/i }).click()
    await page.waitForURL('/cart')
    await expect(page.locator('aside')).toContainText('2.75 ETH')
  })

  test('checkout exige carteira conectada e dados validados', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/checkout')
    await addNftToCart(page, 'nft-01')
    await page.goto('/checkout')
    await page.waitForTimeout(1000)

    const confirm = page.getByRole('button', { name: /confirmar compra/i })
    await expect(confirm).toBeDisabled()

    await page.locator('#checkout-ens').fill('!')
    await page.getByRole('radio').first().click()
    await page.waitForTimeout(1300)
    await expect(confirm).toBeEnabled()
    await confirm.click()

    await expect(page.locator('#checkout-ens')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('p[role=alert]').first()).toBeVisible()
  })

  test('conta de demonstração mantém credenciais documentadas', async ({ page }) => {
    await startFresh(page, '/login')
    await page.getByRole('button', { name: /preencher credenciais/i }).click()
    await expect(page.locator('#login-email')).toHaveValue(DEMO_ACCOUNT.email)
  })
})



