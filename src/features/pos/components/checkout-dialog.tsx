import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { useCreateTransaction } from '@/features/pos/api/transactions'
import { useCartStore } from '@/features/pos/store/cart-store'
import { toast } from 'sonner'
import { Banknote, Building2, QrCode, XIcon } from 'lucide-react'

import { CustomerSelector } from './customer-selector'

import { ReceiptDialog } from './receipt-dialog'

export function CheckoutDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { cart, clearCart } = useCartStore()
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [customerId, setCustomerId] = useState<string | undefined>()
  const [discount, setDiscount] = useState('')
  const [receiptData, setReceiptData] = useState<any>(null)
  
  const createTransaction = useCreateTransaction()

  const handlePayment = () => {
      // Validate
      const cashVal = parseFloat(cashGiven || '0')
      const discountVal = parseFloat(discount || '0')
      const finalTotal = total - discountVal
      
      if (paymentMethod === 'cash' && cashVal < finalTotal) {
          toast.error('Insufficient cash amount', { description: `Shortage: ${formatCurrency(finalTotal - cashVal)}` })
          return
      }
      
      createTransaction.mutate({
          items: cart.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price
          })),
          paymentMethod,
          cashAmount: paymentMethod === 'cash' ? cashVal : undefined,
          discountAmount: discountVal,
          customerId, 
      }, {
          onSuccess: (data) => {
              toast.success(`Transaction Completed!`)
              clearCart()
              onOpenChange(false)
              setCashGiven('')
              setCustomerId(undefined)
              setDiscount('')
              setReceiptData(data)
          },
          onError: (err: any) => {
              console.error(err)
              toast.error('Transaction Failed', { description: err.message || 'Unknown error occurred' })
          }
      })
  }
  
  const discountVal = parseFloat(discount || '0')
  const finalTotal = Math.max(0, total - discountVal)
  const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(cashGiven || '0') - finalTotal) : 0

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="w-full sm:max-w-xl p-4 sm:p-6 mx-auto sm:mx-0 max-h-[90vh] overflow-y-auto" showCloseButton={false}>
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
               <span>Payment</span>
               <div className="ml-auto flex items-center gap-4">
                   <div className="flex flex-col items-end">
                       <span className="text-xl text-primary">{formatCurrency(finalTotal)}</span>
                       {discountVal > 0 && <span className="text-xs text-muted-foreground line-through">{formatCurrency(total)}</span>}
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => onOpenChange(false)}>
                       <XIcon className="h-4 w-4" />
                   </Button>
               </div>
           </DialogTitle>
           <DialogDescription>Select payment method to proceed</DialogDescription>
         </DialogHeader>
         
         <div className="py-2 space-y-4">
            <CustomerSelector value={customerId} onChange={setCustomerId} />
            <div className="space-y-2">
                <Label>Diskon (Rp)</Label>
                <Input 
                    type="number" 
                    placeholder="0" 
                    value={discount} 
                    onChange={e => setDiscount(e.target.value)} 
                />
            </div>
         </div>
         
         <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
           <TabsList className="grid w-full grid-cols-3 mb-4">
             <TabsTrigger value="cash" className="flex items-center gap-2"><Banknote className="w-4 h-4"/> Cash</TabsTrigger>
             <TabsTrigger value="qris" className="flex items-center gap-2"><QrCode className="w-4 h-4"/> QRIS</TabsTrigger>
             <TabsTrigger value="transfer" className="flex items-center gap-2"><Building2 className="w-4 h-4"/> Transfer</TabsTrigger>
           </TabsList>
           
           <div className="py-2 min-h-[150px]">
               {paymentMethod === 'cash' && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                       <div className="space-y-2">
                           <Label>Cash Received</Label>
                           <div className="relative">
                               <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                               <Input 
                                   type="number" 
                                   value={cashGiven} 
                                   onChange={e => setCashGiven(e.target.value)} 
                                   placeholder="0"
                                   className="pl-10 text-lg font-mono"
                                   autoFocus
                                />
                           </div>
                           <div className="flex flex-wrap gap-2">
                               {[10000, 20000, 50000, 100000].map(amount => (
                                   <Button 
                                      key={amount} 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 min-w-[80px] text-xs"
                                      onClick={() => setCashGiven(String(amount))}
                                   >
                                       {amount / 1000}k
                                   </Button>
                               ))}
                                <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 min-w-[80px] text-xs bg-muted"
                                      onClick={() => setCashGiven(String(finalTotal))}
                                   >
                                       Exact
                                   </Button>
                           </div>
                       </div>
                       <div className="flex justify-between text-lg font-medium p-4 bg-muted/50 rounded-lg border">
                           <span>Change</span>
                           <span className={change < 0 ? 'text-destructive' : 'text-green-600 font-bold'}>{formatCurrency(change)}</span>
                       </div>
                   </div>
               )}
               {paymentMethod === 'qris' && (
                   <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                       <div className="h-48 w-48 bg-white p-2 rounded-lg border-2 border-dashed flex items-center justify-center shadow-sm">
                           <QrCode className="h-32 w-32 text-slate-800" />
                       </div>
                       <p className="text-sm text-muted-foreground animate-pulse">Waiting for payment confirmation...</p>
                   </div>
               )}
                {paymentMethod === 'transfer' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <Building2 className="h-16 w-16 text-muted-foreground/50" />
                        <p className="text-center text-muted-foreground max-w-[200px]">
                            Please transfer to bank account and click confirm after payment.
                        </p>
                    </div>
                )}
           </div>
         </Tabs>
         
         <DialogFooter className="gap-2 sm:gap-0">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handlePayment} disabled={createTransaction.isPending} size="lg" className="w-full sm:w-auto">
               {createTransaction.isPending ? 'Processing...' : 'Complete Payment'}
           </Button>
         </DialogFooter>
       </DialogContent>
    </Dialog>
    
    <ReceiptDialog 
        open={!!receiptData} 
        onOpenChange={(v: boolean) => !v && setReceiptData(null)} 
        transaction={receiptData} 
    />
    </>
  )
}
