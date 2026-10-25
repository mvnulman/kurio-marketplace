import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { addFavorite, removeFavorite } from '@/lib/api/catalog'
import type { Nft, NftDetailResponse } from '@/lib/contracts/catalog'
import type { CatalogResponse } from '@/lib/contracts/catalog'

import { catalogKeys } from '@/features/catalog/queries'

export const favoriteKeys = {
  all: ['favorites'] as const,
}

interface ToggleFavoriteInput {
  nftId: string
  favorite: boolean
}

interface ToggleFavoriteContext {
  lists: Array<[readonly unknown[], CatalogResponse | undefined]>
  details: Array<[readonly unknown[], NftDetailResponse | undefined]>
}

function withFavorite(nft: Nft, nftId: string, favorite: boolean): Nft {
  return nft.id === nftId ? { ...nft, isFavorite: favorite } : nft
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, ToggleFavoriteInput, ToggleFavoriteContext>({
    mutationFn: async ({ nftId, favorite }) => {
      if (favorite) await addFavorite(nftId)
      else await removeFavorite(nftId)
    },
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: catalogKeys.all })

      const lists = queryClient.getQueriesData<CatalogResponse>({
        queryKey: catalogKeys.lists(),
      })
      const details = queryClient.getQueriesData<NftDetailResponse>({
        queryKey: catalogKeys.details(),
      })

      queryClient.setQueriesData<CatalogResponse>({ queryKey: catalogKeys.lists() }, (data) =>
        data
          ? {
              ...data,
              items: data.items.map((nft) => withFavorite(nft, nftId, favorite)),
            }
          : data,
      )

      queryClient.setQueriesData<NftDetailResponse>(
        { queryKey: catalogKeys.details() },
        (data) =>
          data
            ? {
                ...data,
                nft: withFavorite(data.nft, nftId, favorite),
                related: data.related.map((nft) => withFavorite(nft, nftId, favorite)),
              }
            : data,
      )

      return { lists, details }
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.lists ?? []) {
        queryClient.setQueryData(key, data)
      }
      for (const [key, data] of context?.details ?? []) {
        queryClient.setQueryData(key, data)
      }
      toast.error('Não foi possível atualizar seus favoritos.', {
        description: 'A alteração foi desfeita. Tente novamente.',
      })
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.',
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.details() })
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
    },
  })
}
