import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateReturn } from '@/features/returns/api/returns'
import { api } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { Search, Loader2, Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface CreateReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TransactionItem {
  id: string
  productId: string
  quantity: number
  price: string
  product: {
    id: string
    name: string
    sku: string
  }
}

interface Transaction {
  id: string
  number: string
  date: string
  items: TransactionItem[]
}

interface ReturnItem {
  transactionItemId: string
  productId: string
  productName: string
  productSku: string
  maxQty: number
  quantity: number
  price: number
}

export function CreateReturnDialog({ open, onOpenChange }: CreateReturnDialogProps) {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([])
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  
  const createReturn = useCreateReturn()
  
  const searchTransaction = async () => {
    if (!search.trim()) return
    
    setSearching(true)
    try {
      const result = await api.get<{ data: Transaction[] }>('/api/transactions', {
        search: search.trim()
      })
      
      // Find exact match by number
      const found = result.data.find(t => t.number.toLowerCase() === search.trim().toLowerCase())
      
      if (found) {
        setTransaction(found)
        // Initialize return items from transaction items
        setReturnItems(found.items.map(item => ({
          transactionItemId: item.id,
          productId: item.productId,
          productName: item.product.name,
          productSku: item.product.sku,
          maxQty: item.quantity,
          quantity: 0,
          price: Number(item.price),
        })))
      } else {
        toast.error('Transaction not found')
        setTransaction(null)
        setReturnItems([])
      }
    } catch {
      toast.error('Failed to search transaction')
    } finally {
      setSearching(false)
    }
  }
  
  const updateItemQty = (productId: string, delta: number) => {
    setReturnItems(items => items.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, Math.min(item.maxQty, item.quantity + delta))
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }
  
  const totalAmount = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const hasItems = returnItems.some(item => item.quantity > 0)
  
  const handleSubmit = async () => {
    if (!transaction || !hasItems) return
    
    const itemsToReturn = returnItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        transactionItemId: item.transactionItemId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))
    
    try {
      await createReturn.mutateAsync({
        transactionId: transaction.id,
        items: itemsToReturn,
        reason,
        notes,
      })
      
      toast.success('Return created successfully')
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create return')
    }
  }
  
  const resetForm = () => {
    setSearch('')
    setTransaction(null)
    setReturnItems([])
    setReason('')
    setNotes('')
  }
  
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sales Return</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Transaction */}
          <div className="space-y-2">
            <Label>Transaction Number</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter transaction number (e.g. TRX-...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTransaction()}
              />
              <Button onClick={searchTransaction} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Transaction Found */}
          {transaction && (
            <>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono font-medium">{transaction.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setTransaction(null); setReturnItems([]) }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Items to Return */}
              <div className="space-y-2">
                <Label>Select Items to Return</Label>
                <div className="border rounded-lg divide-y">
                  {returnItems.map((item) => (
                    <div key={item.productId} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.productSku} · {formatCurrency(item.price)} × max {item.maxQty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateItemQty(item.productId, -1)}
                          disabled={item.quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateItemQty(item.productId, 1)}
                          disabled={item.quantity >= item.maxQty}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Enter return reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              
              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>Total Refund</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
              
              {/* Submit */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSubmit}
                disabled={!hasItems || createReturn.isPending}
              >
                {createReturn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Return
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
