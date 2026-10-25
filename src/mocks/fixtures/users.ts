import type { Profile, Wallet } from '@/lib/contracts/account'
import type { AuthUser } from '@/lib/contracts/auth'

export interface SeedUser extends AuthUser {
  passwordHash: string
  salt: string
  createdAt: string
  updatedAt: string
}

/** Senha fictícia compartilhada pelas duas contas de demonstração. */
export const DEMO_PASSWORD = 'kurio123'

const DEMO_SALT = 'kurio-demo-salt'
// SHA-256 de `${salt}:${DEMO_PASSWORD}`; senhas nunca são guardadas em claro.
const DEMO_PASSWORD_HASH = '862e9ddc0931b6f968e3e9f424dd450b31c80c5b1456370c0ecaf63f1aee407a'
const SECOND_PASSWORD = 'kurio456'
const SECOND_PASSWORD_HASH = '3fcaae22ffb6e6fc7741f159ee188f5155d8b3027bc5b477ca7f020922bcdab8'

const NOW = '2026-09-01T12:00:00.000Z'

export const seedUsers: SeedUser[] = [
  {
    id: 'user-ana',
    displayName: 'Ana Colecionadora',
    username: 'anakurio',
    email: 'ana@kurio.art',
    avatarUrl: '',
    ensName: 'anakurio.eth',
    passwordHash: DEMO_PASSWORD_HASH,
    salt: DEMO_SALT,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'user-bia',
    displayName: 'Bia Colecionadora',
    username: 'biakurio',
    email: 'bia@kurio.art',
    avatarUrl: '',
    ensName: 'biakurio.eth',
    passwordHash: SECOND_PASSWORD_HASH,
    salt: DEMO_SALT,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

export const seedProfiles: Record<string, Profile> = Object.fromEntries(
  seedUsers.map((user) => [
    user.id,
    {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ensName: user.ensName,
      walletNickname: 'Carteira principal',
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  ]),
)

export const seedWallets: Record<string, Wallet[]> = {
  'user-ana': [
    {
      id: 'wallet-ana-primary',
      label: 'Carteira principal',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      ensName: 'anakurio.eth',
      network: 'ethereum',
      type: 'metamask',
      isPrimary: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: 'wallet-ana-secondary',
      label: 'Carteira secundária',
      address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      network: 'polygon',
      type: 'coinbase',
      isPrimary: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  'user-bia': [
    {
      id: 'wallet-bia-primary',
      label: 'Carteira principal',
      address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
      ensName: 'biakurio.eth',
      network: 'ethereum',
      type: 'walletconnect',
      isPrimary: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
}

export const seedFavorites: Record<string, string[]> = {
  'user-ana': ['nft-04', 'nft-07'],
  'user-bia': ['nft-01'],
}

export const SEED_PASSWORDS: Record<string, string> = {
  'ana@kurio.art': DEMO_PASSWORD,
  'bia@kurio.art': SECOND_PASSWORD,
}

export { DEMO_SALT, SECOND_PASSWORD }
