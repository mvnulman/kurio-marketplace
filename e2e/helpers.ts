import { expect, type Page } from '@playwright/test'

export const DEMO_ACCOUNT = {
  email: 'ana@kurio.art',
  password: 'kurio123',
  displayName: 'Ana Colecionadora',
}

export const SECOND_ACCOUNT = {
  email: 'bia@kurio.art',
  password: 'kurio456',
  displayName: 'Bia Colecionadora',
}

/**
 * Todo teste começa de um estado conhecido: `?reset=1` restaura o banco de
 * mocks e o cenário padrão antes da navegação do teste.
 */
export async function startFresh(page: Page, path = '/'): Promise<void> {
  await page.goto(path.includes('?') ? `${path}&reset=1` : `${path}?reset=1`)
  await page.waitForTimeout(600)
}

export async function setScenario(page: Page, scenario: string): Promise<void> {
  await page.evaluate(async (name) => {
    await fetch('/api/dev/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: name }),
    })
  }, scenario)
}

export async function login(page: Page, account = DEMO_ACCOUNT, redirect?: string): Promise<void> {
  await page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
  await page.locator('#login-email').fill(account.email)
  await page.locator('#login-password').fill(account.password)
  await page.getByRole('button', { name: /entrar/i, exact: true }).click()
  await page.waitForTimeout(900)
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /menu da conta/i }).click()
  await page.getByRole('menuitem', { name: /sair/i }).click()
  await page.waitForTimeout(900)
}

export async function addNftToCart(page: Page, nftId: string, quantity = 1): Promise<void> {
  await page.goto(`/nft/${nftId}`)
  for (let index = 1; index < quantity; index += 1) {
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  }
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page.locator('[data-sonner-toast]').first()).toBeVisible()
}

export async function changeNftPrice(page: Page, nftId: string, priceEth: string): Promise<void> {
  await page.evaluate(
    async ({ id, price }) => {
      await fetch(`/api/dev/nfts/${id}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceEth: price }),
      })
    },
    { id: nftId, price: priceEth },
  )
}

export function catalogCard(page: Page, index: number) {
  return page.locator('#catalogo article').nth(index)
}

export function cartRows(page: Page) {
  return page.locator('section[aria-label="Itens do carrinho"] article')
}

export async function waitForSession(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /menu da conta/i })).toBeVisible({ timeout: 10_000 })
}

