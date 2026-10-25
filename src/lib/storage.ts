const PREFIX = 'kurio:'

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value)
  } catch {
    // Armazenamento indisponível (modo privado/quotas): a sessão vive só em memória.
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

export const storage = {
  get: safeGet,
  set: safeSet,
  remove: safeRemove,
}

const SESSION_TOKEN_KEY = 'session-token'
const GUEST_CART_KEY = 'guest-cart-id'
const SCENARIO_KEY = 'scenario'

export const sessionTokenStorage = {
  get: () => storage.get(SESSION_TOKEN_KEY),
  set: (token: string) => storage.set(SESSION_TOKEN_KEY, token),
  clear: () => storage.remove(SESSION_TOKEN_KEY),
}

export const guestCartStorage = {
  get(): string {
    const existing = storage.get(GUEST_CART_KEY)
    if (existing) return existing

    const id = `guest_${crypto.randomUUID()}`
    storage.set(GUEST_CART_KEY, id)
    return id
  },
  clear: () => storage.remove(GUEST_CART_KEY),
}

export const scenarioStorage = {
  get: () => storage.get(SCENARIO_KEY),
  set: (scenario: string) => storage.set(SCENARIO_KEY, scenario),
}
