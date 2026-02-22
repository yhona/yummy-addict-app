import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProducts } from '@/features/inventory/api/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Search,
  Package,
  ChevronRight,
  ChevronDown,
  Boxes,
  Plus,
  Edit,
  TrendingDown,
  DollarSign,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { BreakDownDialog } from '@/features/inventory/components/break-down-dialog'

export const Route = createFileRoute('/_authenticated/inventory/bulk-products')({
  component: BulkProductsPage,
})

function BulkProductsPage() {
  const [search, setSearch] = useState('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const { data: productsData, isLoading } = useProducts({ limit: 200 })
  const [breakDownProduct, setBreakDownProduct] = useState<any>(null)

  const products = (productsData as any)?.data || []

  // Filter only bulk products (isBulk = true)
  const bulkProducts = products.filter((p: any) => p.isBulk === true)

  // Find variants (products with parentId)
  const getVariants = (parentId: string) => {
    return products.filter((p: any) => p.parentId === parentId)
  }

  // Calculate total inventory value
  const totalBulkValue = bulkProducts.reduce((sum: number, p: any) => {
    const stock = p.currentStock || p.stock?.reduce((s: number, st: any) => s + st.quantity, 0) || 0
    return sum + stock * Number(p.sellingPrice || 0)
  }, 0)

  // Count low stock items
  const lowStockCount = bulkProducts.filter((p: any) => {
    const stock = p.currentStock || p.stock?.reduce((s: number, st: any) => s + st.quantity, 0) || 0
    return stock <= (p.minStock || 5)
  }).length

  // Filter by search
  const filteredBulkProducts = bulkProducts.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStockLevel = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'destructive', percent: 0 }
    if (stock <= minStock) return { label: 'Low Stock', color: 'warning', percent: 25 }
    if (stock <= minStock * 2) return { label: 'Medium', color: 'default', percent: 60 }
    return { label: 'In Stock', color: 'success', percent: 100 }
  }

  return (
    <TooltipProvider>
      <>
        <Header fixed>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Bulk Products</h1>
              <p className="text-xs text-muted-foreground">
                Manage wholesale inventory
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button asChild>
              <Link to="/inventory/products/new" search={{ parentId: undefined }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bulk Product
              </Link>
            </Button>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>

        <Main>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bulk Products
                </CardTitle>
                <Boxes className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bulkProducts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Parent items
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Variants
                </CardTitle>
                <Layers className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter((p: any) => p.parentId).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Linked retail products
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inventory Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {totalBulkValue.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total bulk stock value
                </p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${lowStockCount > 0 ? 'from-orange-500/10 to-orange-600/5 border-orange-500/20' : 'from-gray-500/10 to-gray-600/5'}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Alert
                </CardTitle>
                {lowStockCount > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockCount > 0 ? 'Items need restocking' : 'All stock levels OK'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bulk products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Bulk Products List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : filteredBulkProducts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Bulk Products Found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create a bulk product by enabling "This is a Bulk Product" toggle in the product form.
                </p>
                <Button asChild>
                  <Link to="/inventory/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Bulk Product
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBulkProducts.map((bulk: any) => {
                const variants = getVariants(bulk.id)
                const stock = bulk.currentStock || bulk.stock?.reduce((s: number, st: any) => s + st.quantity, 0) || 0
                const minStock = bulk.minStock || 5
                const stockLevel = getStockLevel(stock, minStock)
                const isExpanded = expandedCards.has(bulk.id)

                return (
                  <Card key={bulk.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <Package className="h-7 w-7 text-white" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-lg truncate">{bulk.name}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {bulk.sku}
                              </Badge>
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
                                Bulk Product
                              </Badge>
                              {bulk.categoryName && (
                                <Badge variant="outline">{bulk.categoryName}</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" asChild>
                                <Link to="/inventory/products/$id/edit" params={{ id: bulk.id }}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Product</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" asChild>
                                <Link to="/inventory/products/new" search={{ parentId: bulk.id }}>
                                  <Plus className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add Variant</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Stock</div>
                          <div className="text-lg font-semibold flex items-center gap-2">
                            {stock} {bulk.unitName || 'unit'}
                            <Badge
                              variant={stockLevel.color as any}
                              className="text-xs"
                            >
                              {stockLevel.label}
                            </Badge>
                          </div>
                          <Progress value={Math.min(stockLevel.percent, 100)} className="h-1.5 mt-2" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Selling Price</div>
                          <div className="text-lg font-semibold">
                            Rp {Number(bulk.sellingPrice || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Stock Value</div>
                          <div className="text-lg font-semibold text-green-600">
                            Rp {(stock * Number(bulk.sellingPrice || 0)).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Variants</div>
                          <div className="text-lg font-semibold">{variants.length}</div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Variants Section */}
                    {variants.length > 0 && (
                      <CardContent className="pt-0">
                        <Collapsible open={isExpanded} onOpenChange={() => toggleCard(bulk.id)}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between bg-muted/50 hover:bg-muted"
                            >
                              <span className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                {variants.length} Variant{variants.length > 1 ? 's' : ''} Linked
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border rounded-lg mt-3 divide-y">
                              {variants.map((variant: any) => {
                                const variantStock = variant.currentStock || variant.stock?.reduce((s: number, st: any) => s + st.quantity, 0) || 0
                                const variantStockLevel = getStockLevel(variantStock, variant.minStock || 10)

                                return (
                                  <div
                                    key={variant.id}
                                    className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <div className="font-medium flex items-center gap-2">
                                          {variant.name}
                                          <Badge
                                            variant={variantStockLevel.color as any}
                                            className="text-xs"
                                          >
                                            {variantStockLevel.label}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                                          <span className="font-mono">{variant.sku}</span>
                                          <span>•</span>
                                          <Tooltip>
                                            <TooltipTrigger className="cursor-help underline decoration-dotted">
                                              Ratio: {variant.conversionRatio || 1}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              {variant.conversionRatio || 1} units of this = 1 bulk unit
                                            </TooltipContent>
                                          </Tooltip>
                                          <span>•</span>
                                          <span>Stock: {variantStock}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <div className="font-medium">
                                          Rp {Number(variant.sellingPrice || 0).toLocaleString('id-ID')}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Value: Rp {(variantStock * Number(variant.sellingPrice || 0)).toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <Link to="/inventory/products/$id/edit" params={{ id: variant.id }}>
                                              <ExternalLink className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit Variant</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    )}

                    {variants.length === 0 && (
                      <CardContent className="pt-0">
                        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 flex items-center justify-between">
                          <span>No variants linked yet</span>
                          <Button variant="link" size="sm" className="h-auto p-0" asChild>
                            <Link to="/inventory/products/new" search={{ parentId: bulk.id }}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Variant
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </Main>


        {breakDownProduct && (
            <BreakDownDialog 
                open={!!breakDownProduct} 
                onOpenChange={(open) => !open && setBreakDownProduct(null)}
                bulkProduct={breakDownProduct}
                variants={getVariants(breakDownProduct.id)}
            />
        )}
      </>
    </TooltipProvider>
  )
}
