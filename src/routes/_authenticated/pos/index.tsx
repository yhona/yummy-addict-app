import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useProducts } from '@/features/inventory/api/products'
import { useTransactions } from '@/features/pos/api/transactions'
import { useCartStore } from '@/features/pos/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  LayoutGrid,
  ShoppingCart,
  History,
  Printer,
  Barcode,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/pos/')({
  component: PosPage,
})

function PosPage() {
  const navigate = useNavigate()
  
  // Cart state from store
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCartStore()
  
  // Local UI state
  const [productSearch, setProductSearch] = useState('')
  const [recentOpen, setRecentOpen] = useState(false)
  
  // Barcode scanner
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Queries
  const { data: recentData } = useTransactions({ limit: 10 })
  const recentTxs = recentData?.data || []
  const { data: productsData } = useProducts({ search: productSearch, limit: 50 })
  const products = (productsData as any)?.data || []
  
  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])
  
  // Barcode Scanner Handler
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p: any) => p.sku === barcode || p.barcode === barcode)
    if (product) {
      addToCart(product)
      toast.success(`Ditamabahkan: ${product.name}`)
    } else {
      toast.error(`Produk tidak ditemukan: ${barcode}`)
    }
  }
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      
      if (e.key === 'F1') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'F2') {
        e.preventDefault()
        if (cart.length > 0) navigate({ to: '/pos/checkout' })
      } else if (e.key === 'F3') {
        e.preventDefault()
        clearCart()
        toast.info('Keranjang dikosongkan')
      } else if (e.key === 'F4') {
        e.preventDefault()
        barcodeInputRef.current?.focus()
      } else if (e.key === 'F5') {
        e.preventDefault()
        setRecentOpen(true)
      } else if (e.key === 'Enter' && !isInput && cart.length > 0) {
        e.preventDefault()
        navigate({ to: '/pos/checkout' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, clearCart, navigate])
  
  // Print Receipt
  const handlePrint = (tx: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; margin: 0; padding: 10px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; }
          .items { margin: 10px 0; }
          .item { margin: 5px 0; }
          h2 { margin: 5px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2>RECEIPT</h2>
          <p>${tx.number || 'N/A'}</p>
          <p>${format(new Date(tx.date || Date.now()), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <div class="line"></div>
        <p><strong>Customer:</strong> ${tx.customer?.name || 'Walk-in'}</p>
        <div class="line"></div>
        <div class="items">
          ${(tx.items || []).map((item: any) => `
            <div class="item">
              <div>${item.product?.name || 'Item'}</div>
              <div class="row">
                <span>${item.quantity} x Rp ${Number(item.price).toLocaleString('id-ID')}</span>
                <span>Rp ${(item.quantity * Number(item.price)).toLocaleString('id-ID')}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>Rp ${Number(tx.totalAmount).toLocaleString('id-ID')}</span></div>
        ${Number(tx.discountAmount) > 0 ? `<div class="row"><span>Discount</span><span>-Rp ${Number(tx.discountAmount).toLocaleString('id-ID')}</span></div>` : ''}
        <div class="row bold"><span>TOTAL</span><span>Rp ${Number(tx.finalAmount).toLocaleString('id-ID')}</span></div>
        ${tx.paymentMethod === 'cash' ? `
          <div class="row"><span>Cash</span><span>Rp ${Number(tx.cashAmount).toLocaleString('id-ID')}</span></div>
          <div class="row"><span>Change</span><span>Rp ${Number(tx.changeAmount).toLocaleString('id-ID')}</span></div>
        ` : `<div class="row"><span>Payment</span><span>${tx.paymentMethod?.toUpperCase()}</span></div>`}
        <div class="line"></div>
        <p class="center">Thank You!</p>
      </body>
      </html>
    `
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Product Grid */}
      <div className="flex-1 flex flex-col border-r bg-muted/10">
        <div className="p-4 border-b bg-card">
          <div className="flex justify-between items-center mb-3">
             <h1 className="text-xl font-bold flex items-center gap-2">
                <LayoutGrid className="h-6 w-6" />
                POS
             </h1>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => setRecentOpen(true)}>
                 <History className="h-4 w-4 mr-1" />
                 Riwayat (F5)
               </Button>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Cari produk... (F1)"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={barcodeInputRef}
                placeholder="Scan barcode... (F4)"
                className="pl-9 bg-background"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeScan((e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            <strong>F1:</strong> Cari | <strong>F2 / Enter:</strong> Pembayaran | <strong>F3:</strong> Bersihkan Keranjang | <strong>F4:</strong> Scan Barcode
          </p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product: any) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-md active:scale-95 duration-200"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden">
                    {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <Package className="h-8 w-8" />
                        </div>
                    )}
                  </div>
                  <p className="font-medium text-sm line-clamp-2 h-10 mb-1">{product.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">
                        {formatCurrency(product.sellingPrice)}
                    </p>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {product.currentStock || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Right Panel - Cart */}
      <div className="w-[400px] flex flex-col bg-card shadow-xl z-10">
        <div className="p-4 border-b">
           <h2 className="text-lg font-bold flex items-center gap-2">
             <ShoppingCart className="h-5 w-5" />
             Keranjang Belanja
           </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
                        <p>Belum ada produk</p>
                    </div>
                ) : (
                    <div className="p-3 space-y-3">
                        {cart.map((item) => (
                            <div key={item.productId} className="flex gap-3 group">
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                        <p className="font-medium text-sm ml-2">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{formatCurrency(item.price)} / unit</span>
                                        
                                        <div className="flex items-center gap-2 bg-muted rounded-md px-1 h-7">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 rounded-sm hover:bg-background"
                                                onClick={() => updateQuantity(item.productId, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-6 text-center font-medium text-foreground">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 rounded-sm hover:bg-background"
                                                onClick={() => updateQuantity(item.productId, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeFromCart(item.productId)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>

        {/* Footer Totals */}
        <div className="p-4 bg-muted/10 border-t space-y-3">
            <div className="flex justify-between items-end pt-2">
                <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Subtotal</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</p>
                </div>
                <Button 
                    size="lg" 
                    className="h-12 px-8 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    disabled={cart.length === 0}
                    onClick={() => navigate({ to: '/pos/checkout' })}
                >
                    Checkout (F2)
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
      </div>

      {/* Recent Transactions Dialog */}
      <Dialog open={recentOpen} onOpenChange={setRecentOpen}>
         <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              10 Transaksi Terakhir
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {recentTxs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada transaksi</p>
            ) : (
              recentTxs.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-mono font-medium text-sm">{tx.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(tx.finalAmount)}</p>
                    <Badge variant="outline" className="text-xs">{tx.paymentMethod}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handlePrint(tx)}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecentOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Package(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22v-8" />
    </svg>
  )
}
