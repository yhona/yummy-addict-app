import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, MapPin, Phone, Package, Star, Search, ArrowUpDown, Warehouse, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WarehouseDialog } from '@/features/inventory/components/warehouse-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { WarehouseFormValues } from '@/features/inventory/schema/warehouse-schema'
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse, useSetWarehouseDefault } from '@/features/inventory/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ApiWarehouse } from '@/lib/api-types'

export const Route = createFileRoute('/_authenticated/inventory/warehouses/')({
  component: WarehousesPage,
})

type SortOption = 'name' | 'stock' | 'created'

function WarehousesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<ApiWarehouse | undefined>()
  const [deletingWarehouse, setDeletingWarehouse] = useState<ApiWarehouse | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')

  // Fetch warehouses from API
  const { data: warehousesData, isLoading } = useWarehouses()

  // Mutations
  const createWarehouse = useCreateWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const deleteWarehouse = useDeleteWarehouse()
  const setDefault = useSetWarehouseDefault()

  const warehouses = warehousesData || []

  // Filter and sort
  const filteredWarehouses = useMemo(() => {
    let result = [...warehouses]
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(wh => 
        wh.name.toLowerCase().includes(term) || 
        wh.code.toLowerCase().includes(term)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'stock':
          return (b.totalStock || 0) - (a.totalStock || 0)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    
    return result
  }, [warehouses, searchTerm, sortBy])

  const handleAddWarehouse = () => {
    setEditingWarehouse(undefined)
    setDialogOpen(true)
  }

  const handleEditWarehouse = (warehouse: ApiWarehouse) => {
    setEditingWarehouse(warehouse)
    setDialogOpen(true)
  }

  const handleSetDefault = async (warehouse: ApiWarehouse) => {
    if (warehouse.isDefault) return
    try {
      await setDefault.mutateAsync(warehouse.id)
      toast.success(`"${warehouse.name}" is now the default warehouse`)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to set default')
    }
  }

  const handleSubmit = async (data: WarehouseFormValues) => {
    try {
      if (editingWarehouse) {
        await updateWarehouse.mutateAsync({
          id: editingWarehouse.id,
          data,
        })
        toast.success('Warehouse updated successfully!')
      } else {
        await createWarehouse.mutateAsync(data)
        toast.success('Warehouse created successfully!')
      }

      setDialogOpen(false)
      setEditingWarehouse(undefined)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to save warehouse')
    }
  }

  const handleDeleteWarehouse = async () => {
    if (!deletingWarehouse) return

    if (deletingWarehouse.isDefault) {
      toast.error('Cannot delete the default warehouse')
      setDeletingWarehouse(undefined)
      return
    }

    try {
      await deleteWarehouse.mutateAsync(deletingWarehouse.id)
      toast.success(`Warehouse "${deletingWarehouse.name}" deleted successfully`)
      setDeletingWarehouse(undefined)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete warehouse')
    }
  }

  const isSaving = createWarehouse.isPending || updateWarehouse.isPending
  const isDeleting = deleteWarehouse.isPending

  // Calculate totals
  const totalProducts = warehouses.reduce((sum, wh) => sum + (wh.productCount || 0), 0)
  const totalStock = warehouses.reduce((sum, wh) => sum + (wh.totalStock || 0), 0)
  const activeWarehouses = warehouses.filter((wh) => wh.isActive).length



  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Warehouses</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2">
          <PageHeaderHeading>
            <PageHeaderTitle>Warehouses</PageHeaderTitle>
            <PageHeaderDescription>
              Manage your warehouse locations
            </PageHeaderDescription>
          </PageHeaderHeading>
          <div className="flex gap-2">
            <Button onClick={handleAddWarehouse}>
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading warehouses...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{warehouses.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeWarehouses} active
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">SKUs across all warehouses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Units in all warehouses</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Sort */}
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[160px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stock">Stock (High → Low)</SelectItem>
                  <SelectItem value="created">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Empty State */}
            {filteredWarehouses.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed">
                <Warehouse className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No warehouses found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Get started by adding your first warehouse'}
                </p>
                {!searchTerm && (
                  <Button className="mt-4" onClick={handleAddWarehouse}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Warehouse
                  </Button>
                )}
              </div>
            ) : (
              /* Warehouse Cards */
              (<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWarehouses.map((warehouse) => (
                  <Card
                    key={warehouse.id}
                    className={cn(
                      'relative group',
                      !warehouse.isActive && 'opacity-60'
                    )}
                  >
                    {/* Header Badges */}
                    <div className="absolute right-3 top-3 flex gap-2">
                      {warehouse.isDefault && (
                        <Badge className="bg-yellow-500/10 text-yellow-600">
                          <Star className="mr-1 h-3 w-3 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Link 
                            to="/inventory/warehouses/$warehouseId" 
                            params={{ warehouseId: warehouse.id }}
                            className="hover:underline"
                          >
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                          </Link>
                          <CardDescription className="font-mono">
                            {warehouse.code}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {warehouse.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span className="line-clamp-2">{warehouse.address}</span>
                        </div>
                      )}
                      {warehouse.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{warehouse.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{warehouse.productCount || 0}</span>
                          <span className="text-xs text-muted-foreground">SKUs</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{(warehouse.totalStock || 0).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">units</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                          {warehouse.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex gap-1">
                          {/* Set Default Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetDefault(warehouse)}
                            disabled={warehouse.isDefault || setDefault.isPending}
                            title={warehouse.isDefault ? 'Already default' : 'Set as default'}
                          >
                            <Star className={cn(
                              "h-4 w-4",
                              warehouse.isDefault ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWarehouse(warehouse)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingWarehouse(warehouse)}
                            className="text-destructive hover:text-destructive"
                            disabled={warehouse.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>)
            )}
          </>
        )}
      </Main>
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingWarehouse ? {
          id: editingWarehouse.id,
          code: editingWarehouse.code,
          name: editingWarehouse.name,
          address: editingWarehouse.address || undefined,
          phone: editingWarehouse.phone || undefined,
          isDefault: editingWarehouse.isDefault,
          isActive: editingWarehouse.isActive,
          createdAt: editingWarehouse.createdAt,
          updatedAt: editingWarehouse.updatedAt,
        } : undefined}
        onSubmit={handleSubmit}
        isLoading={isSaving}
      />
      <ConfirmDeleteDialog
        open={!!deletingWarehouse}
        onOpenChange={(open) => !open && setDeletingWarehouse(undefined)}
        title="Delete Warehouse"
        itemName={deletingWarehouse?.name}
        description={
          deletingWarehouse?.isDefault
            ? 'Cannot delete the default warehouse. Please set another warehouse as default first.'
            : undefined
        }
        onConfirm={handleDeleteWarehouse}
        isLoading={isDeleting}
      />
    </>
  )
}
