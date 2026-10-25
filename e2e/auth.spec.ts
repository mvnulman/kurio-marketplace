

import { DEMO_ACCOUNT, SECOND_ACCOUNT, login, logout, setScenario, startFresh } from './helpers'
import { expect, test } from './fixtures'

test.describe('conta e sessão', () => {
  test('cadastro valida dados e trata conflito de e-mail', async ({ page }) => {
    await startFresh(page, '/register')

    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.locator('p[role=alert]').first()).toBeVisible()

    await page.getByLabel(/nome de usuário/i).fill('anakurio')
    await page.getByLabel(/e-mail/i).fill(DEMO_ACCOUNT.email)
    await page.getByLabel(/^senha/i).fill('senhaSegura123')
    await page.getByLabel(/confirmar senha/i).fill('senhaSegura123')
    await page.getByRole('button', { name: /criar conta/i }).click()

    await expect(page.locator('p[role=alert]').first()).toContainText('e-mail')
  })

  test('cadastro e login de conta nova funcionam', async ({ page }) => {
    await startFresh(page, '/register')
    await page.getByLabel(/nome de usuário/i).fill('novato')
    await page.getByLabel(/e-mail/i).fill('novato@kurio.art')
    await page.getByLabel(/^senha/i).fill('senhaSegura123')
    await page.getByLabel(/confirmar senha/i).fill('senhaSegura123')
    await page.getByRole('button', { name: /criar conta/i }).click()
    await page.waitForURL('/')
    await expect(page.getByRole('button', { name: /menu da conta/i })).toBeVisible()
  })

  test('login inválido mostra erro e login válido redireciona', async ({ page }) => {
    await startFresh(page, '/login')
    await page.getByLabel(/e-mail/i).fill(DEMO_ACCOUNT.email)
    await page.getByLabel(/senha/i).fill('senha-errada')
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()
    await expect(page.locator('p[role=alert]').first()).toContainText('E-mail ou senha')

    await page.getByLabel(/senha/i).fill(DEMO_ACCOUNT.password)
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()
    await page.waitForURL('/')
    await expect(page.getByRole('button', { name: /menu da conta/i })).toBeVisible()
  })

  test('rota privada redireciona ao login preservando destino', async ({ page }) => {
    await startFresh(page, '/profile')
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/redirect=%2Fprofile/)
  })

  test('expiração de sessão recolhe contexto e permite retomada', async ({ page }) => {
    await startFresh(page)
    await login(page, undefined, '/orders')
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: 'Meus pedidos' })).toBeVisible()

    await setScenario(page, 'session-expired')
    await page.goto('/profile')
    await page.waitForURL(/\/login/)
    await expect(page.locator('p[role=status], p[role=alert]').first()).toContainText('expirou')

    // retomada: login volta para a rota original
    await page.getByLabel(/e-mail/i).fill(DEMO_ACCOUNT.email)
    await page.getByLabel(/senha/i).fill(DEMO_ACCOUNT.password)
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()
    await page.waitForURL('/profile')
  })

  test('troca de usuário isola dados privados', async ({ page }) => {
    await startFresh(page)
    await login(page)
    // Ana favorita
    await page.goto('/nft/nft-01')
    await page.waitForTimeout(600)
    await page.getByRole('button', { name: /adicionar Emerald Ape/i }).click()
    await page.waitForTimeout(700)

    await logout(page)
    await login(page, SECOND_ACCOUNT, '/profile')
    await page.goto('/nft/nft-01')
    await page.waitForTimeout(600)
    await expect(page.getByRole('button', { name: /adicionar Emerald Ape/i })).toBeVisible()
  })
})

