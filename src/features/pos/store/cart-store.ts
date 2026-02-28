import { create } from 'zustand'

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  image?: string
}

interface CartStore {
  // State
  cart: CartItem[]
  selectedCustomer: any | null
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'debt'
  cashAmount: string
  discount: string
  notes: string
  // Delivery
  deliveryMethod: 'pickup' | 'delivery'
  shippingCost: string
  courierName: string
  shippingAddress: string

  // Actions
  addToCart: (product: any) => void
  updateQuantity: (productId: string, delta: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  
  setSelectedCustomer: (customer: any | null) => void
  setPaymentMethod: (method: 'cash' | 'qris' | 'transfer' | 'debt') => void
  setCashAmount: (amount: string) => void
  setDiscount: (discount: string) => void
  setNotes: (notes: string) => void
  setDeliveryMethod: (method: 'pickup' | 'delivery') => void
  setShippingCost: (cost: string) => void
  setCourierName: (name: string) => void
  setShippingAddress: (address: string) => void
}

export const useCartStore = create<CartStore>((set) => ({
  cart: [],
  selectedCustomer: null,
  paymentMethod: 'cash',
  cashAmount: '',
  discount: '',
  notes: '',
  deliveryMethod: 'pickup',
  shippingCost: '',
  courierName: '',
  shippingAddress: '',

  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.productId === product.id)
    if (existing) {
      return {
        cart: state.cart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
    }
    return {
      cart: [...state.cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.sellingPrice),
        quantity: 1,
        image: product.image,
      }]
    }
  }),

  updateQuantity: (productId, delta) => set((state) => ({
    cart: state.cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    })
  })),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.productId !== productId)
  })),

  clearCart: () => set({
    cart: [],
    selectedCustomer: null,
    paymentMethod: 'cash',
    cashAmount: '',
    discount: '',
    notes: '',
    deliveryMethod: 'pickup',
    shippingCost: '',
    courierName: '',
    shippingAddress: '',
  }),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCashAmount: (amount) => set({ cashAmount: amount }),
  setDiscount: (discount) => set({ discount: discount }),
  setNotes: (notes) => set({ notes: notes }),
  setDeliveryMethod: (method) => set({ deliveryMethod: method }),
  setShippingCost: (cost) => set({ shippingCost: cost }),
  setCourierName: (name) => set({ courierName: name }),
  setShippingAddress: (address) => set({ shippingAddress: address }),
}))
