import { http } from 'msw'

import { getDb, decorateNft, getFavoriteIds, requireUser, setFavorite } from '../db'
import { mockHandler, pathParam } from '../http/handler'

function favoritesPayload(userId: string) {
  const ids = getFavoriteIds(userId)
  const items = getDb()
    .nfts.filter((nft) => ids.includes(nft.id))
    .map((nft) => decorateNft(nft, userId))

  return { ids, items }
}

export const favoriteHandlers = [
  http.get(
    '/api/favorites',
    mockHandler('GET /favorites', ({ request }) => {
      const user = requireUser(request)
      return favoritesPayload(user.id)
    }),
  ),

  http.put(
    '/api/favorites/:nftId',
    mockHandler('PUT /favorites/:nftId', ({ request, params }) => {
      const user = requireUser(request)
      setFavorite(user.id, pathParam({ request, params }, 'nftId'), true)
      return favoritesPayload(user.id)
    }),
  ),

  http.delete(
    '/api/favorites/:nftId',
    mockHandler('DELETE /favorites/:nftId', ({ request, params }) => {
      const user = requireUser(request)
      setFavorite(user.id, pathParam({ request, params }, 'nftId'), false)
      return favoritesPayload(user.id)
    }),
  ),
]
