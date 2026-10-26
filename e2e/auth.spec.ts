

import { DEMO_ACCOUNT, SECOND_ACCOUNT, login, logout, setScenario, startFresh, waitForSession } from './helpers'
import { expect, test } from './fixtures'

test.describe('conta e sessão', () => {
  test('cadastro valida dados e trata conflito de e-mail', async ({ page }) => {
    await startFresh(page, '/register')

    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page.locator('p[role=alert]').first()).toBeVisible()

    await page.locator('#register-username').fill('novato')
    await page.locator('#register-email').fill(DEMO_ACCOUNT.email)
    await page.locator('#register-password').fill('senhaSegura123')
    await page.locator('#register-password-confirmation').fill('senhaSegura123')
    await page.getByRole('button', { name: /criar conta/i }).click()

    await expect(page.locator('p[role=alert]').first()).toContainText('e-mail')
  })

  test('cadastro e login de conta nova funcionam', async ({ page }) => {
    await startFresh(page, '/register')
    await page.locator('#register-username').fill('novato')
    await page.locator('#register-email').fill('novato@kurio.art')
    await page.locator('#register-password').fill('senhaSegura123')
    await page.locator('#register-password-confirmation').fill('senhaSegura123')
    await page.getByRole('button', { name: /criar conta/i }).click()
    await page.waitForURL('/')
    await expect(page.getByRole('button', { name: /menu da conta/i })).toBeVisible()
  })

  test('login inválido mostra erro e login válido redireciona', async ({ page }) => {
    await startFresh(page, '/login')
    await page.locator('#login-email').fill(DEMO_ACCOUNT.email)
    await page.locator('#login-password').fill('senha-errada')
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()
    await expect(page.locator('p[role=alert]').first()).toContainText('E-mail ou senha')

    await page.locator('#login-password').fill(DEMO_ACCOUNT.password)
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
    await login(page, undefined, '/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

    await setScenario(page, 'session-expired')
    // Recarregar zera o cache em memória do TanStack: a sessão é revalidada,
    // o servidor responde 401 SESSION_EXPIRED e o handler global recolhe para
    // /login preservando a rota atual — sem depender de revalidações de fundo.
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForURL(/\/login/)
    await expect(page.locator('p[role=status], p[role=alert]').first()).toContainText('expirou')

    // retomada: login volta para a rota original
    await page.locator('#login-email').fill(DEMO_ACCOUNT.email)
    await page.locator('#login-password').fill(DEMO_ACCOUNT.password)
    await page.getByRole('button', { name: /entrar/i, exact: true }).click()
    await page.waitForURL('/profile')
  })

  test('troca de usuário isola dados privados', async ({ page }) => {
    await startFresh(page)
    await login(page)
    // Ana favorita (botão com rótulo) — obra fora do seed das duas contas
    await page.goto('/nft/nft-02')
    await waitForSession(page)
    await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toBeVisible()
    await page.locator('button[aria-pressed]:has-text("Favoritar")').click()
    await page.waitForTimeout(700)
    await expect(page.locator('button[aria-pressed]:has-text("Favoritado")')).toBeVisible()

    await logout(page)
    await login(page, SECOND_ACCOUNT, '/profile')
    await page.goto('/nft/nft-02')
    await waitForSession(page)
    await expect(page.getByRole('heading', { name: 'Sage Nomad #009' })).toBeVisible()
    await expect(page.locator('button[aria-pressed]:has-text("Favoritar")')).toBeVisible()
  })
})


