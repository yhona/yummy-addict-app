import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useProducts } from '@/features/inventory/api/products'
import { useCategories } from '@/features/inventory/api/categories'
import { useCreateOrder, type CreateOrderRequest } from '@/features/orders/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { 
  Search, 
  Plus, 
  Minus, 
  Loader2, 
  ShoppingCart, 
  Package, 
  CreditCard,
  X
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { CheckoutDialog } from '@/features/orders/components/checkout-dialog'

export const Route = createFileRoute('/_authenticated/sales/orders/create')({
  component: MarketplaceOrderPage,
})

function MarketplaceOrderPage() {
  const navigate = useNavigate()
  const createOrderMut = useCreateOrder()
  
  // -- Data Fetching --
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 100, status: 'active' })
  const { data: categoriesData } = useCategories()
  
  const products = useMemo(() => (productsData as any)?.data || [], [productsData])
  const categories = useMemo(() => (categoriesData as any)?.data || [], [categoriesData])

  // -- State --
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Cart State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false) // For mobile sheet
  
  // Checkout Dialog State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // -- Derived State --
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }, [cartItems])

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  // -- Handlers --
  const getCartQuantity = (productId: string) => {
    return cartItems.find(item => item.productId === productId)?.quantity || 0
  }

  const handleAddToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: Number(product.sellingPrice),
        quantity: 1,
        sku: product.sku,
        image: product.image
      }]
    })
    toast.success(`Added ${product.name}`, { duration: 1500, icon: '🛒' })
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) }
      }
      return item
    }))
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId))
  }

  const handleInitialCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty')
      return
    }
    setIsCheckoutOpen(true)
  }

  const handleConfirmOrder = async (checkoutData: any) => {
    const orderData: CreateOrderRequest = {
      customerId: checkoutData.customerId || undefined,
      customerName: checkoutData.customerName,
      items: checkoutData.items,
      notes: checkoutData.notes,
      paymentMethod: checkoutData.paymentMethod,
      cashAmount: checkoutData.cashAmount,
      discountAmount: checkoutData.discountAmount
    }

    try {
      await createOrderMut.mutateAsync(orderData)
      toast.success('Order created successfully!')
      setIsCheckoutOpen(false)
      navigate({ to: '/sales/orders', search: { page: 1 } })
    } catch (error: any) {
      toast.error('Failed to create order: ' + (error?.message || 'Unknown error'))
    }
  }

  // Extracted Cart Component for reuse in Sidebar and Mobile Sheet
  const cartContentElement = (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 custom-scrollbar">
        {/* Cart Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
             <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cart Items ({cartCount})</Label>
             {cartItems.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setCartItems([])}>
                   Clear All
                </Button>
             )}
          </div>
          
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl border-muted-foreground/20 text-muted-foreground bg-muted/10">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs opacity-70">Start adding items from the left</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map(item => (
                <div key={item.productId} className="flex gap-3 bg-card border rounded-xl p-3 shadow-xs hover:shadow-sm transition-shadow group relative overflow-hidden">
                  <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden border">
                     {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 opacity-30" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                     <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-sm truncate leading-tight" title={item.productName}>{item.productName}</p>
                        <p className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                     </div>
                     <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                        
                        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border">
                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={() => handleUpdateQuantity(item.productId, -1)}>
                             <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={() => handleUpdateQuantity(item.productId, 1)}>
                             <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                     </div>
                  </div>
                  <button 
                     className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                     onClick={() => handleRemoveItem(item.productId)}
                  >
                     <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 space-y-4">
         <div className="space-y-3">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
               <span>Subtotal</span>
               <span className="font-mono">{formatCurrency(cartTotal)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl font-bold">
               <span>Total</span>
               <span className="text-primary font-mono">{formatCurrency(cartTotal)}</span>
            </div>
         </div>

         <Button className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all" size="lg" onClick={handleInitialCheckout} disabled={createOrderMut.isPending || cartItems.length === 0}>
            {createOrderMut.isPending ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-5 w-5" />}
            Checkout • {formatCurrency(cartTotal)}
         </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header fixed>
        <div className="flex items-center gap-4 w-full">
            <h1 className="text-lg font-bold hidden md:block nowrap tracking-tight">New Order</h1>
            
            {/* Extended Search Bar */}
            <div className="relative flex-1 max-w-2xl mx-auto">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                  placeholder="Search products by name or SKU..." 
                  className="pl-10 bg-muted/50 border-transparent focus:border-border focus:bg-background transition-all h-10 rounded-full"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
               />
               {searchQuery && (
                  <button 
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                     onClick={() => setSearchQuery('')}
                  >
                     <X className="h-3 w-3" />
                  </button>
               )}
            </div>

            <div className="flex items-center gap-2">
               <ThemeSwitch />
               <ProfileDropdown />
            </div>
        </div>
      </Header>

      <div className="flex flex-1 overflow-hidden">
         {/* Main Content - Product Grid */}
         <main className="flex-1 flex flex-col min-w-0 bg-muted/5 relative">
            {/* Category Tabs */}
            <div className="bg-background px-4 py-3 border-b shadow-sm z-10 sticky top-0">
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                 <Button 
                    variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    className={`rounded-full px-5 h-8 transition-all ${selectedCategory === 'all' ? 'shadow-md' : 'border-dashed'}`}
                    onClick={() => setSelectedCategory('all')}
                 >
                    All Items
                 </Button>
                 {categories.map((cat: any) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      className={`rounded-full px-5 h-8 whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'shadow-md' : 'border-dashed'}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                 ))}
               </div>
            </div>

            {/* Product Grid */}
            <ScrollArea className="flex-1 px-4 lg:px-6 py-6 pb-24 lg:pb-6">
               {isLoadingProducts ? (
                   <div className="flex flex-col items-center justify-center h-64 gap-3">
                      <Loader2 className="animate-spin text-primary h-8 w-8" />
                      <p className="text-sm text-muted-foreground animate-pulse">Loading products...</p>
                   </div>
               ) : filteredProducts.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                      <div className="bg-muted p-6 rounded-full mb-4">
                         <Package className="h-10 w-10 opacity-40" />
                      </div>
                      <p className="font-medium text-lg">No products found</p>
                      <p className="text-sm opacity-70 mb-4">Try adjusting your search or category</p>
                      <Button variant="outline" onClick={() => {setSearchQuery(''); setSelectedCategory('all')}}>
                         Clear All Filters
                      </Button>
                   </div>
               ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6 pb-20">
                      {filteredProducts.map((product: any) => {
                        const qtyInCart = getCartQuantity(product.id)
                        return (
                          <Card 
                               key={product.id} 
                               className={`group overflow-hidden border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col
                                  ${qtyInCart > 0 ? 'ring-2 ring-primary ring-offset-2' : ''}
                               `}
                               onClick={() => handleAddToCart(product)}
                          >
                              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                  {product.image ? (
                                     <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                     <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 bg-muted/50">
                                        <Package className="h-12 w-12" />
                                     </div>
                                  )}
                                  
                                  {/* Badges */}
                                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                    {qtyInCart > 0 && (
                                       <Badge className="bg-primary text-primary-foreground shadow-lg animate-in zoom-in font-bold text-xs h-6 px-2">
                                          {qtyInCart} in cart
                                       </Badge>
                                    )}
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px] font-mono h-5">
                                       Stock: {product.currentStock || 0}
                                    </Badge>
                                  </div>

                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                                     <div className="bg-white text-black px-4 py-2 rounded-full font-semibold shadow-lg transform scale-90 group-hover:scale-100 transition-transform flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> Add to Cart
                                     </div>
                                  </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col bg-card">
                                 <div className="mb-2">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 opacity-70">
                                       {product.sku}
                                    </p>
                                    <h3 className="font-semibold text-base leading-tight line-clamp-2 h-10" title={product.name}>
                                       {product.name}
                                    </h3>
                                 </div>
                                 <div className="mt-auto pt-2 flex items-center justify-between border-t border-dashed">
                                    <p className="font-bold text-lg text-primary">
                                       {formatCurrency(Number(product.sellingPrice))}
                                    </p>
                                 </div>
                              </div>
                          </Card>
                        )
                      })}
                   </div>
               )}
            </ScrollArea>
         </main>

         {/* Desktop Sidebar (Sticky Cart) */}
         <aside className="hidden lg:flex w-[400px] flex-col border-l bg-card shadow-xl z-30 h-full">
            <div className="p-4 border-b flex items-center justify-between bg-card text-card-foreground shadow-sm z-10">
               <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                     <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                     <h2 className="font-bold text-base leading-none">Order Summary</h2>
                     <p className="text-xs text-muted-foreground mt-1">Review and checkout</p>
                  </div>
               </div>
               <Badge variant="outline" className="font-mono">{cartCount} Items</Badge>
            </div>
            <div className="flex-1 overflow-hidden relative">
               {cartContentElement}
            </div>
         </aside>

         {/* Mobile Cart Button & Sheet */}
         <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
               <SheetTrigger asChild>
                  <Button size="lg" className="rounded-full h-14 w-14 shadow-2xl relative bg-primary hover:bg-primary/90 text-primary-foreground">
                     <ShoppingCart className="h-6 w-6" />
                     {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-6 min-w-6 px-1 rounded-full flex items-center justify-center border-2 border-background shadow-sm animate-in zoom-in">
                           {cartCount}
                        </span>
                     )}
                  </Button>
               </SheetTrigger>
               <SheetContent side="right" className="w-[90vw] sm:w-[400px] p-0 flex flex-col border-l-0">
                  <SheetHeader className="p-4 border-b text-left bg-muted/10">
                     <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Current Order
                     </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                     {cartContentElement}
                  </div>
               </SheetContent>
            </Sheet>
         </div>
      </div>
      
      {/* Checkout Dialog */}
      <CheckoutDialog 
         open={isCheckoutOpen} 
         onOpenChange={setIsCheckoutOpen}
         items={cartItems}
         totalAmount={cartTotal}
         onConfirm={handleConfirmOrder}
         isPending={createOrderMut.isPending}
      />
    </div>
  )
}
