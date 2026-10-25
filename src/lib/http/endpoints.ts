export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    session: '/auth/session',
    logout: '/auth/logout',
  },
  catalog: {
    list: '/nfts',
    detail: (nftId: string) => `/nfts/${encodeURIComponent(nftId)}`,
  },
  favorites: {
    list: '/favorites',
    item: (nftId: string) => `/favorites/${encodeURIComponent(nftId)}`,
  },
  cart: {
    root: '/cart',
    items: '/cart/items',
    item: (nftId: string) => `/cart/items/${encodeURIComponent(nftId)}`,
    coupon: '/cart/coupon',
    quote: '/cart/quote',
  },
  orders: {
    root: '/orders',
    detail: (orderId: string) => `/orders/${encodeURIComponent(orderId)}`,
  },
  profile: {
    root: '/profile',
    password: '/profile/password',
    avatar: '/profile/avatar',
  },
  wallets: {
    root: '/wallets',
    detail: (walletId: string) => `/wallets/${encodeURIComponent(walletId)}`,
  },
  dev: {
    scenario: '/dev/scenario',
    reset: '/dev/reset',
    state: '/dev/state',
    nftPrice: (nftId: string) => `/dev/nfts/${encodeURIComponent(nftId)}/price`,
    nftSoldOut: (nftId: string) => `/dev/nfts/${encodeURIComponent(nftId)}/sold-out`,
    resolveOrder: (orderId: string) => `/dev/orders/${encodeURIComponent(orderId)}/resolve`,
    expireSession: '/dev/session/expire',
  },
} as const
