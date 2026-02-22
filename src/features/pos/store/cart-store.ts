import { create } from 'zustand'
import { ApiProduct } from '@/lib/api-types'

export interface CartItem {
  product: ApiProduct
  quantity: number
  price: number
}

interface CartState {
  items: CartItem[]
  addToCart: (product: ApiProduct) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addToCart: (product) => {
    const items = get().items
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      })
    } else {
      set({
        items: [...items, { product, quantity: 1, price: Number(product.sellingPrice) }],
      })
    }
  },
  removeFromCart: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) })
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    })
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}))
