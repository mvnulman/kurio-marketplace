import type { CreateOrderInput, Order, OrderResponse, OrdersResponse } from '@/lib/contracts/orders'
import { IDEMPOTENCY_HEADER } from '@/lib/contracts/common'
import { endpoints, http } from '@/lib/http'

export interface CreateOrderResult {
  order: Order
  replayed: boolean
}

export async function createOrder(
  input: CreateOrderInput,
  idempotencyKey: string,
): Promise<CreateOrderResult> {
  const { data } = await http.post<OrderResponse>(endpoints.orders.root, input, {
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
  return { order: data.order, replayed: data.replayed }
}

export async function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await http.get<Order>(endpoints.orders.detail(orderId), { signal })
  return data
}

export async function fetchOrders(signal?: AbortSignal): Promise<Order[]> {
  const { data } = await http.get<OrdersResponse>(endpoints.orders.root, { signal })
  return data.orders
}

export async function resolveOrder(
  orderId: string,
  status: 'confirmed' | 'failed',
): Promise<Order> {
  const { data } = await http.post<{ order: Order }>(endpoints.dev.resolveOrder(orderId), {
    status,
  })
  return data.order
}
