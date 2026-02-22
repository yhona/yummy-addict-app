import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Product } from '@/features/inventory/types'
import { useProduct } from '@/features/inventory/api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/products/$id/')({
  component: ProductDetailPage,
})

// Format currency to IDR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = Route.useParams()
  const [imageError, setImageError] = useState(false)
  // Fetch product from API
  const { data: apiProduct, isLoading, error } = useProduct(id)

  useEffect(() => {
    setImageError(false)
  }, [id])

  const product = apiProduct ? {
      ...apiProduct,
      productType: 'inventory' as const, // Default for now as backend doesn't have it
      wholesalePrice: 0, // Not in backend
      memberPrice: 0, // Not in backend
      costPrice: parseFloat(apiProduct.costPrice || '0'), // Convert string/decimal
      sellingPrice: parseFloat(apiProduct.sellingPrice),
  } : null

  const handleBack = () => {
    navigate({ to: '/inventory/products' })
  }

  const handleEdit = () => {
    navigate({ to: '/inventory/products/$id/edit', params: { id } })
  }

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading product...</div>
          </div>
        </Main>
      </>
    )
  }

  if (error || (!isLoading && !product)) {
    return (
      <>
        <Header fixed>
          <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Product Details</h1>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex h-[400px] flex-col items-center justify-center gap-4">
            <div className="text-muted-foreground">Product not found</div>
            <Button onClick={handleBack}>Back to Products</Button>
          </div>
        </Main>
      </>
    )
  }

  if (!product) return null;

  const currentStock = product.currentStock || 0
  
  const stockStatus =
    currentStock === 0
      ? { label: 'Out of Stock', color: 'destructive' }
      : currentStock <= product.minStock
        ? { label: 'Low Stock', color: 'warning' }
        : { label: 'In Stock', color: 'success' }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="icon" className="mr-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Product Details</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {product.image && !imageError ? (
                  <div className="h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                    <img 
                      src={getImageUrl(product.image)} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="grid gap-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {product.name}
                  </h2>
                  <p className="text-base text-muted-foreground mt-1">
                    SKU: {product.sku}
                    {product.barcode && ` • Barcode: ${product.barcode}`}
                  </p>
                </div>
              </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{product.categoryName || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit</span>
                  <span>{product.unitName || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product Type</span>
                  <Badge variant="outline" className="capitalize">
                    {product.productType.replace('_', ' ')}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {product.parentId && (
                   <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Parent Product</span>
                      <Button variant="link" className="p-0 h-auto" onClick={() => navigate({ to: '/inventory/products/$id', params: { id: product.parentId! } })}>
                        View Parent
                      </Button>
                    </div>
                   </>
                )}
                {product.description && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground">Description</span>
                      <p className="mt-1 text-sm">{product.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stock Info */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Stock</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xl font-bold',
                        currentStock === 0 && 'text-destructive',
                        currentStock <= product.minStock &&
                          currentStock > 0 &&
                          'text-yellow-500'
                      )}
                    >
                      {currentStock}
                    </span>
                    <span className="text-muted-foreground">
                      {product.unitName}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock Status</span>
                  <Badge
                    className={cn(
                      stockStatus.color === 'success' &&
                        'bg-green-500/10 text-green-500',
                      stockStatus.color === 'warning' &&
                        'bg-yellow-500/10 text-yellow-500',
                      stockStatus.color === 'destructive' &&
                        'bg-red-500/10 text-red-500'
                    )}
                  >
                    {stockStatus.label}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Stock</span>
                  <span>{product.minStock}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum Stock</span>
                  <span>{product.maxStock || '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Track Inventory</span>
                  <Badge variant={product.trackInventory ? 'default' : 'secondary'}>
                    {product.trackInventory ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Product price configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Cost Price (HPP)</p>
                    <p className="text-xl font-bold">{formatCurrency(product.costPrice)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Selling Price</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Wholesale Price</p>
                    <p className="text-xl font-bold">
                      {product.wholesalePrice
                        ? formatCurrency(product.wholesalePrice)
                        : '-'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Member Price</p>
                    <p className="text-xl font-bold">
                      {product.memberPrice
                        ? formatCurrency(product.memberPrice)
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Profit Margin */}
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(product.sellingPrice - product.costPrice)} (
                      {(
                        ((product.sellingPrice - product.costPrice) /
                          product.costPrice) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Variants</CardTitle>
                  <CardDescription>Product variants available</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                           <th className="p-3 text-left font-medium">SKU</th>
                           <th className="p-3 text-left font-medium">Name</th>
                           <th className="p-3 text-right font-medium">Stock</th>
                           <th className="p-3 text-right font-medium">Price</th>
                           <th className="p-3 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((v) => (
                          <tr key={v.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="p-3 font-mono">{v.sku}</td>
                            <td className="p-3">{v.name}</td>
                            <td className="p-3 text-right">{v.stock?.reduce((acc: number, s: any) => acc + s.quantity, 0) || 0}</td>
                            <td className="p-3 text-right">{formatCurrency(parseFloat(v.sellingPrice))}</td>
                            <td className="p-3 text-right">
                               <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/inventory/products/$id', params: { id: v.id } })}>
                                 View
                               </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}
