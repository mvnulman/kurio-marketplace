import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { devHandlers } from './dev'
import { favoriteHandlers } from './favorites'
import { orderHandlers } from './orders'

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...accountHandlers,
  ...devHandlers,
]
