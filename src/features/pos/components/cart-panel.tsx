import { useCartStore } from '@/features/pos/store/cart-store'
import { Button } from '@/components/ui/button'
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function CartPanel({ onCheckout }: { onCheckout: () => void }) {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCartStore()
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    // Quick helper for image URL (should extract to hook or util if reused often)
    const getImageUrl = (path?: string | null) => {
      if (!path) return null
      if (path.startsWith('http')) return path
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
      const cleanPath = path.startsWith('/') ? path : `/${path}`
      return `${baseUrl}${cleanPath}`
    }

    return (
        <div className="flex flex-col h-full bg-background border-l shadow-2xl z-20">
             <div className="p-4 border-b flex items-center justify-between bg-card">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                    Pesanan Saat Ini
                </h2>
                <Button variant="ghost" size="sm" onClick={() => clearCart()} disabled={cart.length === 0} className="text-destructive hover:bg-destructive/10">
                    Kosongkan
                </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-2">
                        <ShoppingCart className="h-16 w-16 opacity-20" />
                        <p className="font-medium text-lg">Keranjang Kosong</p>
                        <p className="text-sm text-center px-4">Pilih produk dari menu untuk mulai menambahkan ke keranjang</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div key={item.productId} className="flex gap-3 group animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Thumbnail */}
                                <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0 border">
                                   {item.image ? (
                                       <img src={getImageUrl(item.image)!} className="w-full h-full object-cover" alt={item.name} />
                                   ) : (
                                       <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No Img</div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h4 className="font-medium truncate text-sm text-foreground/90">{item.name}</h4>
                                        <div className="text-xs text-muted-foreground">{formatCurrency(item.price)}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm hover:bg-background shadow-sm" onClick={() => {
                                                if (item.quantity <= 1) removeFromCart(item.productId)
                                                else updateQuantity(item.productId, -1)
                                            }}>
                                                {item.quantity <= 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                                            </Button>
                                            <span className="text-sm w-6 text-center font-mono font-medium">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm hover:bg-background shadow-sm" onClick={() => updateQuantity(item.productId, 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
            
            <div className="p-4 border-t bg-muted/10 space-y-4 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)]">
                <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(total)}</span>
                     </div>

                     <Separator />
                     <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                     </div>
                </div>
                <Button className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all" size="lg" disabled={cart.length === 0} onClick={onCheckout}>
                    Proses Pembayaran • {formatCurrency(total)}
                </Button>
            </div>
        </div>
    )
}
