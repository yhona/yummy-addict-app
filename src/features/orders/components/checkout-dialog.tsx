import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Check, User, Banknote, QrCode, CreditCard, Truck, Package } from 'lucide-react'
import { useCustomers } from '@/features/customers/api/customers'
import { useCouriers } from '@/features/settings/api/couriers'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: any[]
  totalAmount: number
  onConfirm: (data: any) => Promise<void>
  isPending: boolean
}

export function CheckoutDialog({ 
  open, 
  onOpenChange, 
  items, 
  totalAmount: itemsTotal, 
  onConfirm, 
  isPending 
}: CheckoutDialogProps) {
  
  // -- Customer State --
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  
  // New Customer Form
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')

  // -- Shipping State --
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [courierName, setCourierName] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

   // -- Payment State --
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [notes, setNotes] = useState('')

  // -- Data --
  const { data: customersData } = useCustomers({ limit: 100 })
  const customers = (customersData as any)?.data || []
  
  const { data: couriers } = useCouriers({ isActive: true })

  // -- Computations --
  const finalShippingCost = Number(shippingCost) || 0
  const finalDiscount = Number(discountAmount) || 0
  const finalTotal = Math.max(0, (itemsTotal + finalShippingCost) - finalDiscount)
  
  const changeAmount = paymentMethod === 'cash' ? (Number(cashAmount) - finalTotal) : 0
  const isCashSufficient = paymentMethod !== 'cash' || Number(cashAmount) >= finalTotal

  // -- Handlers --
  const handleConfirm = () => {
    // Validation
    if (customerType === 'new') {
       if (!newCustomerName) {
          toast.error('Customer Name is required')
          return
       }
    }

    if (deliveryMethod === 'delivery') {
        if (!courierName) {
            toast.error('Courier Name is required for delivery')
            return
        }
    }

    if (paymentMethod === 'cash' && Number(cashAmount) < finalTotal) {
        toast.error('Cash amount is insufficient')
        return
    }

    const payload: any = {
      paymentMethod,
      cashAmount: paymentMethod === 'cash' ? Number(cashAmount) : undefined,
      discountAmount: finalDiscount,
      notes,
      items: items.map(i => ({
         productId: i.productId,
         quantity: i.quantity,
         price: i.price
      })),
      // Shipping Fields
      deliveryMethod,
      shippingCost: finalShippingCost,
      courierName: deliveryMethod === 'delivery' ? couriers?.find((c: any) => c.name === courierName)?.name || courierName : undefined,
      trackingNumber: deliveryMethod === 'delivery' ? trackingNumber : undefined,
    }

    // Attach Customer Info
    if (customerType === 'existing') {
       if (selectedCustomerId && selectedCustomerId !== 'walk-in') {
          payload.customerId = selectedCustomerId
          payload.customerName = customers.find((c: any) => c.id === selectedCustomerId)?.name
       } else {
          payload.customerName = 'Walk-in Customer'
       }
    } else {
       payload.customerName = newCustomerName
       payload.customerPhone = newCustomerPhone
       payload.customerAddress = newCustomerAddress
    }

    onConfirm(payload)
  }

  // Reset form when dialog opens/closes
  useEffect(() => {
     if (open) {
        setCashAmount('')
        // setDeliveryMethod('pickup') // Optional: reset or keep last choice?
     }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
             <CreditCard className="h-6 w-6 text-primary" />
             Checkout
          </DialogTitle>
          <DialogDescription>
             Review order details, shipping, and complete payment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
           {/* Section 1: Customer Information */}
           <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                 <User className="h-4 w-4" /> Customer Information
              </Label>
              <Tabs value={customerType} onValueChange={(v: any) => setCustomerType(v)} className="w-full">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing / Walk-in</TabsTrigger>
                    <TabsTrigger value="new">New Customer</TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="existing" className="space-y-4 pt-4 px-1">
                    <div className="space-y-2">
                       <Label>Select Customer</Label>
                       <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger>
                             <SelectValue placeholder="Select customer..." />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="walk-in">Walk-in Customer (Guest)</SelectItem>
                             {customers.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                 </TabsContent>

                 <TabsContent value="new" className="space-y-4 pt-4 px-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                       <div className="space-y-2">
                          <Label>Name <span className="text-red-500">*</span></Label>
                          <Input 
                             placeholder="Customer Name" 
                             value={newCustomerName}
                             onChange={e => setNewCustomerName(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input 
                             placeholder="08..." 
                             value={newCustomerPhone}
                             onChange={e => setNewCustomerPhone(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2 sm:col-span-2">
                          <Label>Address</Label>
                          <Textarea 
                             placeholder="Full Address" 
                             className="min-h-[60px]"
                             value={newCustomerAddress}
                             onChange={e => setNewCustomerAddress(e.target.value)}
                          />
                       </div>
                    </div>
                 </TabsContent>
              </Tabs>
           </div>

           <Separator />

           {/* Section 2: Shipping Method */}
           <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                 <Truck className="h-4 w-4" /> Delivery Method
              </Label>
              <div className="grid grid-cols-2 gap-4">
                 <div 
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50 ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                    onClick={() => setDeliveryMethod('pickup')}
                 >
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <span className="font-semibold">Store Pickup</span>
                 </div>
                 <div 
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50 ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                    onClick={() => setDeliveryMethod('delivery')}
                 >
                    <Truck className="h-8 w-8 text-muted-foreground" />
                    <span className="font-semibold">Delivery Service</span>
                 </div>
              </div>

              {deliveryMethod === 'delivery' && (
                 <div className="grid gap-4 sm:grid-cols-2 animate-in slide-in-from-top-2 pt-2">
                    <div className="space-y-2">
                       <Label>Courier / Service <span className="text-red-500">*</span></Label>
                       <Select 
                          value={courierName} 
                          onValueChange={(val) => {
                             setCourierName(val)
                             // Auto-fill cost if available and not set
                             const selected = couriers?.find((c: any) => c.name === val)
                             if (selected?.defaultCost && !shippingCost) {
                                setShippingCost(String(selected.defaultCost))
                             }
                          }}
                       >
                          <SelectTrigger>
                             <SelectValue placeholder="Select courier..." />
                          </SelectTrigger>
                          <SelectContent>
                             {couriers?.map((c: any) => (
                                <SelectItem key={c.id} value={c.name}>
                                   {c.name} {c.defaultCost > 0 && `(Est. ${formatCurrency(c.defaultCost)})`}
                                </SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label>Shipping Cost (Rp)</Label>
                       <Input 
                          type="number"
                          placeholder="0" 
                          value={shippingCost}
                          onChange={e => setShippingCost(e.target.value)}
                       />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                       <Label>Tracking Number (Optional)</Label>
                       <Input 
                          placeholder="Resi Number..." 
                          value={trackingNumber}
                          onChange={e => setTrackingNumber(e.target.value)}
                       />
                    </div>
                 </div>
              )}
           </div>

           <Separator />

           {/* Section 3: Value Summary */}
           <div className="bg-muted/30 p-4 rounded-lg space-y-2 border">
              <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Items Subtotal</span>
                 <span>{formatCurrency(itemsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Shipping Cost</span>
                 <span>{formatCurrency(finalShippingCost)}</span>
              </div>
              
              {/* Discount Input */}
              <div className="flex justify-between items-center text-sm pt-1">
                 <span className="text-muted-foreground flex items-center gap-1">
                    Discount
                    <span className="text-xs text-muted-foreground/50">(Rp)</span>
                 </span>
                 <div className="w-[120px]">
                    <Input 
                        type="number" 
                        className="h-7 text-right px-2" 
                        placeholder="0"
                        value={discountAmount}
                        onChange={e => setDiscountAmount(e.target.value)}
                    />
                 </div>
              </div>
              
              <Separator className="my-2"/>
              <div className="flex justify-between items-center">
                 <span className="font-bold">Total Amount</span>
                 <span className="text-2xl font-bold text-primary">{formatCurrency(finalTotal)}</span>
              </div>
           </div>

           {/* Section 4: Payment */}
           <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                 <Banknote className="h-4 w-4" /> Payment
              </Label>
              <div className="space-y-3">
                 <Label>Method</Label>
                 <div className="grid grid-cols-3 gap-3">
                    <div 
                       className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50 ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                       onClick={() => setPaymentMethod('cash')}
                    >
                       <Banknote className="h-5 w-5" />
                       <span className="text-xs font-semibold">Cash</span>
                    </div>
                    <div 
                       className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50 ${paymentMethod === 'qris' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                       onClick={() => setPaymentMethod('qris')}
                    >
                       <QrCode className="h-5 w-5" />
                       <span className="text-xs font-semibold">QRIS</span>
                    </div>
                    <div 
                       className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50 ${paymentMethod === 'transfer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                       onClick={() => setPaymentMethod('transfer')}
                    >
                       <CreditCard className="h-5 w-5" />
                       <span className="text-xs font-semibold">Transfer</span>
                    </div>
                 </div>
              </div>

              {paymentMethod === 'cash' && (
                 <div className="space-y-3 animate-in slide-in-from-top-2">
                    <Label>Cash Received</Label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
                       <Input 
                          type="number" 
                          placeholder="0" 
                          className="pl-10 text-lg font-mono"
                          value={cashAmount}
                          onChange={e => setCashAmount(e.target.value)}
                       />
                    </div>
                    
                    {/* Quick Suggestions */}
                    <div className="flex gap-2 flex-wrap">
                       {[finalTotal, 50000, 100000].map(amt => (
                          amt >= finalTotal && (
                             <Badge 
                                key={amt} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => setCashAmount(amt.toString())}
                             >
                                {formatCurrency(amt)}
                             </Badge>
                          )
                       ))}
                    </div>

                    {Number(cashAmount) > 0 && (
                       <div className={`p-3 rounded-md flex justify-between items-center ${Number(cashAmount) >= finalTotal ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          <span className="font-medium text-sm">{Number(cashAmount) >= finalTotal ? 'Change Due' : 'Shortage'}</span>
                          <span className="font-bold text-lg">{formatCurrency(Math.abs(changeAmount))}</span>
                       </div>
                    )}
                 </div>
              )}
              
              <div className="space-y-2">
                 <Label>Order Notes (Optional)</Label>
                 <Textarea 
                    placeholder="Additional notes..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="h-20 resize-none"
                 />
              </div>
           </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isPending || !isCashSufficient} className="w-full sm:w-auto">
             {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
             Confirm Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Badge({ children, variant, className, onClick }: any) {
  return (
     <div 
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'outline' ? 'text-foreground' : 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'} ${className}`}
        onClick={onClick}
     >
        {children}
     </div>
  )
}
