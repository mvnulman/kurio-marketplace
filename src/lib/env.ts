export const env = {
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS !== 'false',
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || undefined,
  mockScenario: import.meta.env.VITE_MOCK_SCENARIO ?? 'default',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
