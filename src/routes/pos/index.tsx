import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useProducts, useCategories } from '@/features/inventory/api'
import { useCartStore } from '@/features/pos/store/cart-store'
import { ProductCard } from '@/features/pos/components/product-card'
import { CartPanel } from '@/features/pos/components/cart-panel'
import { CheckoutDialog } from '@/features/pos/components/checkout-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Search, Loader2, ScanBarcode } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { useBarcodeScanner } from '@/features/pos/hooks/use-barcode-scanner'
import { toast } from 'sonner'

export const Route = createFileRoute('/pos/')({
  component: PosPage,
})

function PosPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  
  
  const { data: productsData, isLoading } = useProducts({ 
      search: debouncedSearch,
      categoryId: selectedCategory,
      limit: 100 
  })
  
  const { data: categories } = useCategories()
  
  const addToCart = useCartStore(state => state.addToCart)

  const handleScan = (code: string) => {
      const found = productsData?.data.find(p => p.sku === code || (p as any).barcode === code)
      if (found) {
          addToCart(found)
          toast.success(`Added ${found.name}`)
      } else {
          toast.error(`Product not found: ${code}`)
      }
  }

  useBarcodeScanner(handleScan)



  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Product Grid Area */}
      <div className="flex-1 bg-muted/20 flex flex-col h-full min-w-0">
        {/* Header / Search */}
        <div className="p-4 bg-background border-b z-10 shadow-sm space-y-4">
             <div className="flex items-center gap-4">
                 <a href="/" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <ScanBarcode className="h-6 w-6"/> POS
                 </a>
                 <Button variant="ghost" size="sm" asChild>
                   <a href="/">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                     Menu
                   </a>
                 </Button>
                 <div className="relative flex-1 max-w-md">
                     <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input 
                        placeholder="Search products..." 
                        className="pl-9 h-10 w-full bg-muted/50 focus:bg-background transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                     />
                 </div>
                 <div className="ml-auto flex items-center gap-2">

                 </div>
             </div>
             
             <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-2 pb-2">
                    <Button 
                        variant={!selectedCategory ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setSelectedCategory(undefined)} 
                        className="rounded-full"
                    >
                        All Items
                    </Button>
                    {categories?.map(cat => (
                        <Button 
                            key={cat.id} 
                            variant={selectedCategory === cat.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                            className="rounded-full"
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
        
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading products...
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-20">
                     {productsData?.data.map((product) => (
                         <div key={product.id} className="h-full">
                             <ProductCard product={product} onAdd={addToCart} />
                         </div>
                     ))}
                     {productsData?.data.length === 0 && (
                         <div className="col-span-full flex flex-col items-center justify-center h-60 text-muted-foreground">
                             <p className="text-lg font-medium">No products found</p>
                             <p className="text-sm">Try adjusting your search</p>
                         </div>
                     )}
                </div>
            )}
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-[400px] h-full flex-shrink-0">
         <CartPanel onCheckout={() => setCheckoutOpen(true)} />
      </div>
      
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  )
}
