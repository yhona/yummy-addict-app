import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Package, MapPin, Phone, Calendar, ArrowRightLeft, Star, Edit, Warehouse as WarehouseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useWarehouse, useSetWarehouseDefault } from '@/features/inventory/api'
import { TransferStockDialog } from '@/features/inventory/components/transfer-stock-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/warehouses/$warehouseId')({
  component: WarehouseDetailPage,
})

function WarehouseDetailPage() {
  const { warehouseId } = Route.useParams()
  const { data: warehouse, isLoading } = useWarehouse(warehouseId)
  const setDefault = useSetWarehouseDefault()
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferProduct, setTransferProduct] = useState<{id: string, name: string, sku: string, currentStock: number} | null>(null)

  const handleSetDefault = async () => {
    if (!warehouse || warehouse.isDefault) return
    try {
      await setDefault.mutateAsync(warehouse.id)
      toast.success(`"${warehouse.name}" is now the default warehouse`)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to set default')
    }
  }

  const handleTransfer = (product: any, quantity: number) => {
    setTransferProduct({
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: quantity
    })
    setTransferDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <h1 className="text-lg font-semibold">Loading...</h1>
        </Header>
        <Main>
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading warehouse...</div>
          </div>
        </Main>
      </>
    )
  }

  if (!warehouse) {
    return (
      <>
        <Header fixed>
          <h1 className="text-lg font-semibold">Warehouse Not Found</h1>
        </Header>
        <Main>
          <div className="flex h-[400px] flex-col items-center justify-center">
            <WarehouseIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Warehouse not found</p>
            <Button asChild className="mt-4">
              <Link to="/inventory/warehouses">Back to Warehouses</Link>
            </Button>
          </div>
        </Main>
      </>
    )
  }

  // @ts-ignore - The api might return these fields even if not typed
  const stockItems: any[] = warehouse.productStock || []
  const totalStock = stockItems.reduce((sum: number, s: any) => sum + s.quantity, 0)
  const uniqueProducts = new Set(stockItems.map((s: any) => s.productId)).size

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/inventory/warehouses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Warehouses
          </Link>
        </Button>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <PageHeaderHeading>
            <div className="flex items-center gap-3">
              <PageHeaderTitle>{warehouse.name}</PageHeaderTitle>
              {warehouse.isDefault && (
                <Badge className="bg-yellow-500/10 text-yellow-600">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Default
                </Badge>
              )}
              <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <PageHeaderDescription className="font-mono mt-1">
              {warehouse.code}
            </PageHeaderDescription>
          </PageHeaderHeading>
          <div className="flex gap-2">
            {!warehouse.isDefault && (
              <Button variant="outline" onClick={handleSetDefault} disabled={setDefault.isPending}>
                <Star className="mr-2 h-4 w-4" />
                Set as Default
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/inventory/warehouses">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueProducts}</div>
              <p className="text-xs text-muted-foreground">unique SKUs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">units</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="line-clamp-2">{warehouse.address || '-'}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{warehouse.phone || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Stock Table */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Stock in this Warehouse</h3>
          <Button variant="outline" asChild>
            <Link to="/inventory/movements" search={{ warehouseId: warehouse.id }}>
              View Movement History
            </Link>
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.length > 0 ? (
                stockItems.filter((s: any) => s.quantity > 0).map((stock: any) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      {stock.product?.name || 'Unknown Product'}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {stock.product?.sku}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {stock.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTransfer(stock.product, stock.quantity)}
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No stock in this warehouse</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          <Calendar className="inline h-3 w-3 mr-1" />
          Created on {formatDate(warehouse.createdAt)}
        </div>
      </Main>

      {/* Transfer Dialog */}
      <TransferStockDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        fromWarehouseId={warehouse.id}
        fromWarehouseName={warehouse.name}
        product={transferProduct}
      />
    </>
  )
}
