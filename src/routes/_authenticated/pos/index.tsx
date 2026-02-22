import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useProducts } from '@/features/inventory/api/products'
import { useCustomers } from '@/features/customers/api/customers'
import { useCreateTransaction, useTransactions } from '@/features/pos/api/transactions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  LayoutGrid,
  ShoppingCart,
  CreditCard,
  Loader2,
  Check,
  X,
  History,
  Printer,
  Barcode
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/pos/')({
  component: PosPage,
})

interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  image?: string
}

function PosPage() {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  
  // Customer state (optional for standard POS)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  
  // Payment state
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  
  // Barcode scanner
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const cashInputRef = useRef<HTMLInputElement>(null)
  
  // Recent transactions
  const [recentOpen, setRecentOpen] = useState(false)
  const { data: recentData } = useTransactions({ limit: 10 })
  const recentTxs = recentData?.data || []
  
  // Completed transaction for receipt
  const [completedTx, setCompletedTx] = useState<any>(null)
  
  // Queries
  const { data: productsData } = useProducts({ search: productSearch, limit: 50 })
  const { data: customersData } = useCustomers({ search: customerSearch, limit: 10 })
  const createTx = useCreateTransaction()
  
  const products = productsData?.data || []
  const customers = customersData?.data || []
  
  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])
  
  const discountAmount = Number(discount) || 0
  const total = subtotal - discountAmount
  const changeAmount = Number(cashAmount) - total
  
  // Cart operations
  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.sellingPrice),
        quantity: 1,
        image: product.image,
      }]
    })
  }, [])
  
  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }, [])
  
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }, [])
  
  const clearCart = useCallback(() => {
    setCart([])
    setSelectedCustomer(null)
    setNotes('')
    setDiscount('')
    setCashAmount('')
    setPaymentMethod('cash')
  }, [])
  
  // Barcode Scanner Handler
  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find((p: any) => p.sku === barcode || p.barcode === barcode)
    if (product) {
      addToCart(product)
      toast.success(`Added: ${product.name}`)
    } else {
      toast.error(`Product not found: ${barcode}`)
    }
  }, [products, addToCart])
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      
      if (e.key === 'F1') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'F2') {
        e.preventDefault()
        if (cart.length > 0) setPaymentOpen(true)
      } else if (e.key === 'F3') {
        e.preventDefault()
        clearCart()
        toast.info('Cart cleared')
      } else if (e.key === 'F4') {
        e.preventDefault()
        barcodeInputRef.current?.focus()
      } else if (e.key === 'F5') {
        e.preventDefault()
        setRecentOpen(true)
      } else if (e.key === 'Enter' && paymentOpen && !isInput) {
        e.preventDefault()
        if (paymentMethod !== 'cash' || Number(cashAmount) >= total) {
          handleCheckout()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, paymentOpen, paymentMethod, cashAmount, total, clearCart])
  
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

  // Process Transaction
  const handleCheckout = async () => {
    if (cart.length === 0) return
    
    try {
      const result = await createTx.mutateAsync({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerId: selectedCustomer?.id,
        paymentMethod,
        cashAmount: paymentMethod === 'cash' ? Number(cashAmount) : undefined,
        discountAmount,
        notes,
      })
      
      toast.success('Transaction successful!')
      setCompletedTx(result)
      setPaymentOpen(false)
      clearCart()
    } catch (error) {
      toast.error((error as Error).message || 'Checkout failed')
    }
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
                 Recent
               </Button>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search products... (F1)"
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
          
          <p className="text-xs text-muted-foreground">
            F1: Search | F2: Pay | F3: Clear | F4: Barcode | F5: Recent
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
      
      {/* Right Panel - Cart & Checkout */}
      <div className="w-[400px] flex flex-col bg-card shadow-xl z-10">
        {/* Customer Select (Optional) */}
        <div className="p-3 border-b">
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
                <Button
                variant={selectedCustomer ? "secondary" : "outline"}
                role="combobox"
                className="w-full justify-between"
                >
                <span className="flex items-center gap-2 truncate">
                    <User className="h-4 w-4" />
                    {selectedCustomer ? selectedCustomer.name : 'Select Customer (Optional)'}
                </span>
                {selectedCustomer && (
                    <X 
                        className="h-4 w-4 text-muted-foreground hover:text-foreground z-10" 
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCustomer(null)
                        }}
                    />
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end">
                <Command>
                <CommandInput 
                    placeholder="Search customer..." 
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                />
                <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                    {customers.map((c: any) => (
                        <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                            setSelectedCustomer(c)
                            setCustomerOpen(false)
                        }}
                        >
                        <div className="flex flex-col">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{c.phone}</span>
                        </div>
                        {selectedCustomer?.id === c.id && (
                            <Check className="ml-auto h-4 w-4" />
                        )}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        </div>

        {/* Cart Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 bg-muted/30 border-b flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Current Order
                </h3>
                <span className="text-xs text-muted-foreground">{cart.length} items</span>
            </div>
            
            <ScrollArea className="flex-1">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
                        <p>No items added</p>
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
            <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-end pt-2 border-t">
                <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                </div>
                <Button 
                    size="lg" 
                    className="h-12 px-8 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    disabled={cart.length === 0}
                    onClick={() => setPaymentOpen(true)}
                >
                    Checkout
                    <CreditCard className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Transaction</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Guest Customer'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
             <div className="bg-primary/5 p-4 rounded-lg text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">Total to Pay</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="qris">QRIS</SelectItem>
                            
                            <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Discount</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                    />
                </div>
             </div>
            
            {paymentMethod === 'cash' && (
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label>Cash Received</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
                            <Input
                                type="number"
                                placeholder="0"
                                className="pl-9 text-lg"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    {Number(cashAmount) > 0 && (
                        <div className={`p-3 rounded-md flex justify-between items-center ${Number(cashAmount) >= total ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <span className="font-medium">{Number(cashAmount) >= total ? 'Change Due' : 'Shortage'}</span>
                            <span className="font-bold text-lg">{formatCurrency(Math.abs(changeAmount))}</span>
                        </div>
                    )}
                </div>
            )}
            
            <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input 
                    placeholder="Transaction notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)} 
                />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button 
                onClick={handleCheckout} 
                disabled={createTx.isPending || (paymentMethod === 'cash' && Number(cashAmount) < total)}
                className="w-full sm:w-auto"
            >
                {createTx.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Recent Transactions Dialog */}
      <Dialog open={recentOpen} onOpenChange={setRecentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Transactions
            </DialogTitle>
            <DialogDescription>Last 10 transactions</DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {recentTxs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
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
            <Button variant="outline" onClick={() => setRecentOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success & Print Receipt Dialog */}
      <Dialog open={!!completedTx} onOpenChange={(open) => !open && setCompletedTx(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <Check className="h-12 w-12 mx-auto mb-2" />
              Transaction Successful!
            </DialogTitle>
            <DialogDescription className="text-center">
              {completedTx?.number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <p className="text-2xl font-bold text-primary mb-2">
              {formatCurrency(completedTx?.finalAmount)}
            </p>
            {completedTx?.paymentMethod === 'cash' && (
              <p className="text-green-600 font-medium">
                Change: {formatCurrency(completedTx?.changeAmount)}
              </p>
            )}
          </div>
          
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setCompletedTx(null)}>
              Close
            </Button>
            <Button onClick={() => handlePrint(completedTx)}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
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
