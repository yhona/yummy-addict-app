import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowRight, Package } from 'lucide-react'
import { useBreakDownStock } from '@/features/inventory/api/products'
import { toast } from 'sonner'

interface BreakDownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bulkProduct: any
  variants: any[]
}

export function BreakDownDialog({ open, onOpenChange, bulkProduct, variants }: BreakDownDialogProps) {
  const [quantity, setQuantity] = useState('1')
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || '')
  
  const { mutate: breakDown, isPending } = useBreakDownStock()

  const selectedVariant = variants.find(v => v.id === selectedVariantId)
  const ratio = Number(selectedVariant?.conversionRatio || 1)
  const resultQuantity = Number(quantity) * ratio

  const handleConfirm = () => {
    if (!bulkProduct || !selectedVariantId) return

    breakDown(
      { 
        id: bulkProduct.id, 
        data: { 
          quantity: Number(quantity), 
          targetVariantId: selectedVariantId 
        } 
      },
      {
        onSuccess: () => {
          toast.success('Stock broken down successfully')
          onOpenChange(false)
          setQuantity('1')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to break down stock')
        }
      }
    )
  }

  const currentBulkStock = bulkProduct?.currentStock || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Break Down Stock
          </DialogTitle>
          <DialogDescription>
            Convert bulk units into retail units. Stock will be automatically adjusted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Source</p>
              <p className="font-semibold">{bulkProduct?.name}</p>
              <p className="text-xs text-muted-foreground">Available: {currentBulkStock} {bulkProduct?.unitName}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Target</p>
              {variants.length > 1 ? (
                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                        {variants.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              ) : (
                <>
                    <p className="font-semibold">{selectedVariant?.name || 'No Variant'}</p>
                    <p className="text-xs text-muted-foreground">Ratio: 1 : {ratio}</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
             <Label>Quantity to Break Down ({bulkProduct?.unitName})</Label>
             <div className="flex items-center gap-4">
                <Input 
                    type="number" 
                    min="1"
                    max={currentBulkStock}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="flex-1"
                />
                <div className="text-sm font-medium text-muted-foreground">
                    = <span className="text-foreground font-bold text-lg">{resultQuantity}</span> {selectedVariant?.unitName || 'Units'}
                </div>
             </div>
             {Number(quantity) > currentBulkStock && (
                <p className="text-xs text-red-500 font-medium">
                    Exceeds available stock ({currentBulkStock})
                </p>
             )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isPending || !selectedVariantId || Number(quantity) <= 0 || Number(quantity) > currentBulkStock}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Break Down
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
