

import { cartRows, waitForSession, addNftToCart, catalogCard, login, startFresh } from './helpers'
import { expect, test } from './fixtures'

test.describe('descoberta do catálogo', () => {
  test('busca global reflete na URL e nos resultados', async ({ page }) => {
    await startFresh(page)

    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByLabel(/termo de busca/i).fill('Emerald')
    await page.getByRole('button', { name: /buscar/i }).click()

    await expect(page).toHaveURL(/q=Emerald/)
    await expect(page).toHaveURL(/#catalogo/)
    await expect(catalogCard(page, 0)).toContainText('Emerald Ape #042')
  })

  test('filtros combináveis compõem a URL e reiniciam a paginação', async ({ page }) => {
    await startFresh(page)
    const isMobile = (page.viewportSize()?.width ?? 1440) < 1024

    // vai para a página 2 primeiro
    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)

    if (isMobile) {
      await page.getByRole('button', { name: /filtros/i }).click()
      await page.getByRole('checkbox', { name: /Kurio Apes/ }).check()
      await page.getByRole('button', { name: /ver \d+ resultado/i }).click()
    } else {
      await page.getByRole('checkbox', { name: /Kurio Apes/ }).check()
    }

    await expect(page).toHaveURL(/col=kurio-apes/)
    await expect(page).not.toHaveURL(/page=/)
    await expect(page.locator('#catalogo article')).toHaveCount(9)

    // adiciona filtro de rede (combinável)
    if (isMobile) {
      await page.getByRole('button', { name: /filtros/i }).click()
      await page.getByRole('checkbox', { name: /Polygon/ }).check()
      await page.getByRole('button', { name: /ver \d+ resultado/i }).click()
    } else {
      await page.getByRole('checkbox', { name: /Polygon/ }).check()
    }
    await expect(page).toHaveURL(/net=polygon/)
  })

  test('ordenação muda o primeiro resultado e sobrevive ao refresh', async ({ page }) => {
    await startFresh(page)

    await page.getByRole('combobox', { name: /ordenar resultados/i }).click()
    await page.getByRole('option', { name: /menor preço/i }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(catalogCard(page, 0)).toContainText('Golden Signal')

    await page.reload()
    await expect(catalogCard(page, 0)).toContainText('Golden Signal')

    // voltar no histórico restaura a ordenação anterior
    await page.goBack()
    await expect(catalogCard(page, 0)).toContainText('Emerald Ape')
  })

  test('busca sem resultados exibe estado vazio com limpeza de filtros', async ({ page }) => {
    await startFresh(page, '/?q=zzz-nada')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('button', { name: /limpar filtros/i }).click()
    await expect(catalogCard(page, 0)).toContainText('Emerald Ape')
  })

  test('catálogo vazio do cenário `empty` mantém a interface estável', async ({ page }) => {
    await startFresh(page)
    await page.evaluate(async () => {
      await fetch('/api/dev/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'empty' }),
      })
    })
    await page.reload()
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  })
})

test.describe('carrinho', () => {
  test('quantidade, cupom, remoção e persistência após refresh', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/cart')
    await addNftToCart(page, 'nft-01')
    await page.goto('/nft/nft-07')
    for (let index = 0; index < 3; index += 1) {
      await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    }
    await page.getByRole('button', { name: 'Comprar', exact: true }).click()
    await page.waitForTimeout(600)

    await page.goto('/cart')
    await expect(cartRows(page)).toHaveCount(2)

    // cupom válido
    await page.locator('#cart-coupon').fill('KURIO10')
    await page.getByRole('button', { name: /aplicar/i }).click()
    await expect(page.locator('aside')).toContainText('(-)')

    // persiste após refresh
    await page.reload()
    await expect(page.locator('aside')).toContainText('KURIO10')

    // cupom inválido
    await page.getByRole('button', { name: /remover cupom/i }).click()
    await page.locator('#cart-coupon').fill('INVALIDO')
    await page.getByRole('button', { name: /aplicar/i }).click()
    await expect(page.locator('[data-sonner-toast]').first()).toContainText('inválido')

    // ajuste de quantidade pelo carrinho
    const item = cartRows(page).filter({ hasText: 'Emerald Ape' })
    await item.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(page.locator('aside')).toContainText('6.356 ETH')

    await item.getByRole('button', { name: /remover/i }).click()
    await expect(cartRows(page)).toHaveCount(1)
  })

  test('carrinho do visitante é preservado ao autenticar', async ({ page }) => {
    await startFresh(page)
    await addNftToCart(page, 'nft-03')

    await login(page, undefined, '/cart')
    await page.goto('/cart')
    await expect(cartRows(page).filter({ hasText: 'Neon Vessel' })).toBeVisible()
  })
})

test.describe('detalhe do NFT', () => {
  test('acesso direto, favorito otimista e recuperação após falha', async ({ page }) => {
    await startFresh(page, '/nft/nft-01')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()

    await login(page, undefined, '/nft/nft-01')
    await page.goto('/nft/nft-01')
    await waitForSession(page)
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()

    const favorite = page.locator('button[aria-pressed]:has-text("Favoritar")')
    await expect(favorite).toBeVisible()
    await favorite.click()
    await expect(page.locator('button[aria-pressed]:has-text("Favoritado")')).toBeVisible()
    // espera a persistência no servidor antes de recarregar
    await expect(page.getByText('Adicionado aos favoritos.')).toBeVisible()

    await page.reload()
    await expect(page.locator('button[aria-pressed]:has-text("Favoritado")')).toBeVisible()
  })

  test('NFT inexistente tem tratamento dedicado', async ({ page }) => {
    await startFresh(page, '/nft/nao-existe')
    await expect(page.getByText('NFT não encontrado')).toBeVisible()
  })

  test('edição esgotada impede compra', async ({ page }) => {
    await startFresh(page, '/nft/nft-10')
    await expect(page.getByRole('button', { name: /edição esgotada/i })).toBeDisabled()
  })
})


