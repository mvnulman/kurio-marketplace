

import { addNftToCart, changeNftPrice, login, startFresh } from './helpers'
import { expect, test } from './fixtures'

test.describe('tempo real com socket.io', () => {
  test('preço muda no carrinho aberto: aviso + resumo atualizado', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/cart')
    await addNftToCart(page, 'nft-01')
    await page.goto('/cart')
    await page.waitForTimeout(900)

    await changeNftPrice(page, 'nft-01', '2.5')
    await page.waitForTimeout(1300)

    await expect(page.locator('[data-sonner-toast]').first()).toContainText('carrinho mudou')
    await expect(page.locator('aside')).toContainText('2.5 ETH')
  })

  test('evento reflete no catálogo sem recarregar', async ({ page }) => {
    await startFresh(page)
    const firstCard = page.locator('#catalogo article').first()
    await expect(firstCard).toContainText('1.19 ETH')

    await changeNftPrice(page, 'nft-01', '4.2')
    await page.waitForTimeout(1200)

    await expect(firstCard).toContainText('4.2 ETH')
    await expect(page).not.toHaveURL(/page=/)
  })

  test('eventos duplicados/antigos não aplicam efeitos duas vezes', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/cart')
    await addNftToCart(page, 'nft-01')
    await page.goto('/cart')
    await page.waitForTimeout(900)

    await changeNftPrice(page, 'nft-01', '3')
    await page.waitForTimeout(1400)
    await expect(page.locator('aside')).toContainText('3 ETH')

    // repetir o mesmo preço (versão igual) não deve degradar o estado
    await changeNftPrice(page, 'nft-01', '3')
    await page.waitForTimeout(1200)
    await expect(page.locator('aside')).toContainText('3.008 ETH')
  })

  test('interrupção durante pedido pendente: recarga recupera sem nova compra', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/checkout')
    await addNftToCart(page, 'nft-01')
    await page.goto('/checkout')
    await page.waitForTimeout(1000)
    await page.getByRole('radio').first().click()
    await page.waitForTimeout(1300)
    await page.getByRole('button', { name: /confirmar compra/i }).click()
    await page.waitForURL('**/orders/**')

    // recarrega enquanto ainda pendente (ou em transição)
    await page.reload()
    await page.waitForTimeout(3400)

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible()

    // nenhuma compra adicional
    await page.goto('/orders')
    await expect(page.locator('main ul li')).toHaveCount(1)
  })
})

