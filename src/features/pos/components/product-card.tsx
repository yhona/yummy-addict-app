import { ApiProduct } from '@/lib/api-types'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { Package } from 'lucide-react'
import { useState, useCallback } from 'react'

interface ProductCardProps {
  product: ApiProduct
  onAdd: (product: ApiProduct) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  // Construct image URL safely
  const getImageUrl = (path?: string | null) => {
      if (!path) return null
      if (path.startsWith('http')) return path
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
      const cleanPath = path.startsWith('/') ? path : `/${path}`
      return `${baseUrl}${cleanPath}`
  }

  const imageUrl = getImageUrl(product.image)
  const stock = product.currentStock || 0
  const hasStock = stock > 0

  const handleAdd = useCallback(() => {
    if (!hasStock) return;
    
    // Trigger animation state
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 200); // Reset after 200ms
    
    // Call original handler
    onAdd(product);
  }, [hasStock, onAdd, product]);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:ring-2 ring-primary overflow-hidden h-full flex flex-col group",
        !hasStock && "opacity-60 grayscale",
        isAdding && "scale-95 opacity-80 ring-4" // Animation effect
      )} 
      onClick={handleAdd}
    >
       <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
         {imageUrl && !imgError ? (
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
              onError={() => setImgError(true)}
            />
         ) : (
            <Package className="h-10 w-10 text-muted-foreground" />
         )}
         {!hasStock && (
             <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                 <span className="bg-destructive text-destructive-foreground px-2 py-1 text-xs font-bold rounded shadow-sm">Stok Habis</span>
             </div>
         )}
       </div>
       <CardContent className="p-3 flex-1 flex flex-col gap-1">
         <h3 className="font-semibold truncate text-sm leading-tight" title={product.name}>{product.name}</h3>
         <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
         <div className="mt-auto pt-2 flex justify-between items-center">
            <span className="font-bold text-sm text-primary">{formatCurrency(Number(product.sellingPrice))}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", hasStock ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive")}>
                Stok: {stock}
            </span>
         </div>
       </CardContent>
    </Card>
  )
}
