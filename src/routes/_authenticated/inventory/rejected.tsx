import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Search, AlertTriangle, RefreshCw, Trash2, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdjustStock, useTransferStock } from '@/features/inventory/api/stock'

export const Route = createFileRoute('/_authenticated/inventory/rejected')({
  component: RejectedItemsPage,
})

function RejectedItemsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [actionType, setActionType] = useState<'dispose' | 'restore' | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const adjustStock = useAdjustStock()
  const transferStock = useTransferStock()

  // Fetch Rejected Warehouse first
  const { data: rejectedWh } = useQuery({
    queryKey: ['warehouse-rejected'],
    queryFn: async () => {
      // Ensure it exists first
      try {
        await api.post('/api/warehouses/init-rejected')
      } catch (e) {
        // ignore
      }
      const res = await api.get<any[]>('/api/warehouses')
      return res.find((w: any) => w.type === 'rejected')
    }
  })

  // Fetch Default Warehouse (for restore)
  const { data: defaultWh } = useQuery({
    queryKey: ['warehouse-default'],
    queryFn: async () => {
        const res = await api.get<any[]>('/api/warehouses')
        return res.find((w: any) => w.isDefault) || res.find((w: any) => w.type === 'sellable')
    }
  })

  // Fetch Stock in Rejected Warehouse
  const { data: stockData, isLoading, refetch } = useQuery({
    queryKey: ['stock-rejected', rejectedWh?.id],
    queryFn: async () => {
      if (!rejectedWh?.id) return []
      const res = await api.get<any[]>(`/api/stock/warehouse/${rejectedWh.id}`)
      return res
    },
    enabled: !!rejectedWh?.id
  })

  const filteredStock = stockData?.filter(item => 
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const totalValue = filteredStock.reduce((acc, item) => {
    return acc + (Number(item.product.costPrice || 0) * item.quantity)
  }, 0)

  const handleAction = (item: any, type: 'dispose' | 'restore') => {
      setSelectedItem(item)
      setActionType(type)
      setQuantity(item.quantity) // Default to full quantity
      setNotes('')
      setIsDialogOpen(true)
  }

  const handleConfirm = async () => {
      if (!selectedItem || !actionType || !rejectedWh) return

      try {
          if (actionType === 'dispose') {
              await adjustStock.mutateAsync({
                  productId: selectedItem.productId,
                  warehouseId: rejectedWh.id,
                  adjustmentType: 'subtract',
                  quantity: quantity,
                  reason: 'Disposal', // Corrected reason
                  notes: notes || 'Disposed from rejected stock'
              })
              toast.success('Items disposed successfully')
          } else if (actionType === 'restore') {
              if (!defaultWh) {
                  toast.error('No sellable warehouse found to restore to')
                  return
              }
              await transferStock.mutateAsync({
                  productId: selectedItem.productId,
                  fromWarehouseId: rejectedWh.id,
                  toWarehouseId: defaultWh.id,
                  quantity: quantity,
                  notes: notes || 'Restored from rejected stock'
              })
              toast.success('Items restored to sellable stock')
          }
          setIsDialogOpen(false)
          refetch()
      } catch (error) {
          toast.error('Failed to process action')
          console.error(error)
      }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rejected Items</h2>
          <p className="text-muted-foreground">
            Monitor damaged, expired, or returned goods.
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rejected Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStock.reduce((acc, s) => acc + s.quantity, 0)}</div>
            <p className="text-xs text-muted-foreground">Across {filteredStock.length} products</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loss Value</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">$</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Based on cost price</p>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Total Loss</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No rejected items found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                        {item.product.name}
                    </TableCell>
                    <TableCell>{item.product.sku}</TableCell>
                    <TableCell>
                        <Badge variant="destructive">
                            {item.quantity} {item.product.unit?.name}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {formatCurrency(Number(item.product.costPrice))}
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                        {formatCurrency(Number(item.product.costPrice) * item.quantity)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" title="Restore to Sellable" onClick={() => handleAction(item, 'restore')}>
                                <RotateCcw className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Dispose Permanently" onClick={() => handleAction(item, 'dispose')}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{actionType === 'restore' ? 'Restore Item' : 'Dispose Item'}</DialogTitle>
                  <DialogDescription>
                      {actionType === 'restore' 
                        ? 'Move items back to sellable inventory (Default Warehouse).' 
                        : 'Permanently remove items from inventory. This action cannot be undone.'}
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="product" className="text-right">Product</Label>
                      <Input id="product" value={selectedItem?.product?.name} disabled className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="qty" className="text-right">Quantity</Label>
                      <Input 
                        id="qty" 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))} 
                        max={selectedItem?.quantity}
                        min={1}
                        className="col-span-3" 
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right">Notes</Label>
                      <Input 
                        id="notes" 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        placeholder="Optional notes..."
                        className="col-span-3" 
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button 
                    variant={actionType === 'dispose' ? "destructive" : "default"} 
                    onClick={handleConfirm}
                  >
                      {actionType === 'restore' ? 'Restore Stock' : 'Confirm Disposal'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  )
}
