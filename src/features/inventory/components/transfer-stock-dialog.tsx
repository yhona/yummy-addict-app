import { useState, useEffect } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useWarehouses, useTransferStock } from '@/features/inventory/api'
import { toast } from 'sonner'

interface TransferStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromWarehouseId: string
  fromWarehouseName: string
  product: {
    id: string
    name: string
    sku: string
    currentStock: number
  } | null
}

export function TransferStockDialog({
  open,
  onOpenChange,
  fromWarehouseId,
  fromWarehouseName,
  product,
}: TransferStockDialogProps) {
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const { data: warehouses } = useWarehouses()
  const transfer = useTransferStock()

  // Filter out current warehouse
  const availableWarehouses = (warehouses || []).filter(w => w.id !== fromWarehouseId && w.isActive)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setToWarehouseId('')
      setQuantity(1)
      setNotes('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!product || !toWarehouseId || quantity <= 0) {
      toast.error('Please fill all required fields')
      return
    }

    if (quantity > product.currentStock) {
      toast.error('Quantity exceeds available stock')
      return
    }

    try {
      await transfer.mutateAsync({
        productId: product.id,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        notes: notes || undefined,
      })
      toast.success(`Successfully transferred ${quantity} units`)
      onOpenChange(false)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to transfer stock')
    }
  }

  const selectedWarehouse = availableWarehouses.find(w => w.id === toWarehouseId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Stock
          </DialogTitle>
          <DialogDescription>
            Transfer stock from {fromWarehouseName} to another warehouse
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="space-y-4 py-4">
            {/* Product Info */}
            <div className="rounded-lg bg-muted p-4">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
              <p className="text-sm mt-1">
                Available: <span className="font-medium">{product.currentStock}</span> units
              </p>
            </div>

            {/* Destination Warehouse */}
            <div className="space-y-2">
              <Label>Transfer To</Label>
              <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {availableWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                      {warehouse.type === 'rejected' && ' (Rejected)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                max={product.currentStock}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(product.currentStock, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              {quantity > product.currentStock && (
                <p className="text-sm text-destructive">Exceeds available stock</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Reason for transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Summary */}
            {toWarehouseId && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Transfer Summary</p>
                <p className="text-muted-foreground mt-1">
                  Move <span className="font-semibold text-foreground">{quantity}</span> units of{' '}
                  <span className="font-semibold text-foreground">{product.sku}</span>
                </p>
                <p className="text-muted-foreground">
                  From: <span className="font-medium text-foreground">{fromWarehouseName}</span>
                </p>
                <p className="text-muted-foreground">
                  To: <span className="font-medium text-foreground">{selectedWarehouse?.name}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={transfer.isPending || !toWarehouseId || quantity <= 0 || quantity > (product?.currentStock || 0)}
          >
            {transfer.isPending ? 'Transferring...' : 'Transfer Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
