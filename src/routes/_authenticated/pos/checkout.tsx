import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useEffect } from 'react'
import { useCartStore } from '@/features/pos/store/cart-store'
import { useCreateTransaction } from '@/features/pos/api/transactions'
import { useCouriers } from '@/features/settings/api/couriers'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomerSelector } from '@/features/pos/components/customer-selector'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Check, Loader2, Banknote, Building2, QrCode,
  Receipt, ShoppingBag, Minus, Plus, Trash2, Sparkles, StickyNote,
  Store, Truck, MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/pos/checkout')({
  component: CheckoutPage,
})

// Payment method data
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai', icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { value: 'qris', label: 'QRIS', icon: QrCode, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { value: 'transfer', label: 'Transfer', icon: Building2, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
  { value: 'debt', label: 'Tempo', icon: Receipt, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
] as const

// Delivery type data
const DELIVERY_TYPES = [
  { value: 'pickup', label: 'Ambil di Toko', icon: Store, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
  { value: 'delivery', label: 'Kirim', icon: Truck, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
] as const

function CheckoutPage() {
  const navigate = useNavigate()
  
  const { 
    cart, 
    selectedCustomer, setSelectedCustomer,
    paymentMethod, setPaymentMethod,
    cashAmount, setCashAmount,
    discount, setDiscount,
    notes, setNotes,
    clearCart,
    updateQuantity,
    removeFromCart,
    deliveryMethod, setDeliveryMethod,
    shippingCost, setShippingCost,
    courierName, setCourierName,
    shippingAddress, setShippingAddress,
  } = useCartStore()

  const createTx = useCreateTransaction()
  const { data: couriers } = useCouriers({ isActive: true })

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])
  const discountAmount = Number(discount) || 0
  const shippingAmount = deliveryMethod === 'delivery' ? (Number(shippingCost) || 0) : 0
  const total = subtotal - discountAmount + shippingAmount
  const changeAmount = Number(cashAmount) - total

  const getImageUrl = (path?: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${cleanPath}`
  }

  useEffect(() => {
    if (cart.length === 0 && !createTx.isSuccess) {
      navigate({ to: '/pos' })
    }
  }, [cart.length, navigate, createTx.isSuccess])

  // Auto-fill address from customer
  useEffect(() => {
    if (selectedCustomer?.address && deliveryMethod === 'delivery' && !shippingAddress) {
      setShippingAddress(selectedCustomer.address)
    }
  }, [selectedCustomer, deliveryMethod])

  // Auto-fill shipping cost from courier
  const handleCourierChange = (name: string) => {
    setCourierName(name)
    const courier = couriers?.find(c => c.name === name)
    if (courier?.defaultCost) {
      setShippingCost(String(courier.defaultCost))
    }
  }

  const handlePrint = (tx: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return
    const receiptHtml = `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:12px;width:58mm;margin:0;padding:10px;}.center{text-align:center;}.bold{font-weight:bold;}.line{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;}.items{margin:10px 0;}.item{margin:5px 0;}h2{margin:5px 0;font-size:16px;}</style></head><body><div class="center"><h2>RECEIPT</h2><p>${tx.number||'N/A'}</p><p>${format(new Date(tx.date||Date.now()),'dd/MM/yyyy HH:mm')}</p></div><div class="line"></div><p><strong>Customer:</strong> ${tx.customer?.name||'Walk-in'}</p>${tx.deliveryMethod==='delivery'?`<p><strong>Pengiriman:</strong> ${tx.courierName||'-'}</p>`:''}<div class="line"></div><div class="items">${(tx.items||[]).map((item:any)=>`<div class="item"><div>${item.product?.name||'Item'}</div><div class="row"><span>${item.quantity} x Rp ${Number(item.price).toLocaleString('id-ID')}</span><span>Rp ${(item.quantity*Number(item.price)).toLocaleString('id-ID')}</span></div></div>`).join('')}</div><div class="line"></div><div class="row"><span>Subtotal</span><span>Rp ${Number(tx.totalAmount).toLocaleString('id-ID')}</span></div>${Number(tx.discountAmount)>0?`<div class="row"><span>Diskon</span><span>-Rp ${Number(tx.discountAmount).toLocaleString('id-ID')}</span></div>`:''} ${Number(tx.shippingCost)>0?`<div class="row"><span>Ongkir</span><span>Rp ${Number(tx.shippingCost).toLocaleString('id-ID')}</span></div>`:''}<div class="row bold"><span>TOTAL</span><span>Rp ${Number(tx.finalAmount).toLocaleString('id-ID')}</span></div>${tx.paymentMethod==='cash'?`<div class="row"><span>Tunai</span><span>Rp ${Number(tx.cashAmount).toLocaleString('id-ID')}</span></div><div class="row"><span>Kembalian</span><span>Rp ${Number(tx.changeAmount).toLocaleString('id-ID')}</span></div>`:`<div class="row"><span>Bayar</span><span>${tx.paymentMethod?.toUpperCase()}</span></div>`}<div class="line"></div><p class="center">Terima Kasih!</p></body></html>`
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    try {
      const result = await createTx.mutateAsync({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        customerId: selectedCustomer?.id,
        paymentMethod,
        cashAmount: paymentMethod === 'cash' ? Number(cashAmount) : undefined,
        discountAmount,
        notes,
        deliveryMethod,
        shippingCost: shippingAmount,
        courierName: deliveryMethod === 'delivery' ? courierName : undefined,
        shippingAddress: deliveryMethod === 'delivery' ? shippingAddress : undefined,
      })
      toast.success('Transaksi Berhasil! 🎉', {
        description: 'Pembayaran telah direkam.',
        action: { label: 'Cetak Struk', onClick: () => handlePrint(result) }
      })
      clearCart()
      navigate({ to: '/pos' })
    } catch (error) {
      toast.error((error as Error).message || 'Gagal melakukan pembayaran')
    }
  }

  if (cart.length === 0) return null

  const isPaymentValid = paymentMethod === 'cash' 
    ? Number(cashAmount) >= total 
    : paymentMethod === 'debt' 
      ? !!selectedCustomer 
      : true

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="h-14 border-b flex items-center px-5 gap-3 bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: '/pos' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h1 className="font-semibold text-sm">Checkout</h1>
        <span className="text-xs text-muted-foreground">
          {totalItems} item · {format(new Date(), 'dd MMM yyyy')}
        </span>
      </header>

      {/* ─── Main Content: 2-panel ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══════ LEFT PANEL: Payment Form ══════ */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 space-y-6">

            {/* 1. Customer */}
            <section>
              <CustomerSelector 
                value={selectedCustomer?.id} 
                onChange={(id) => {
                  if (!id) setSelectedCustomer(null)
                  else setSelectedCustomer({ id } as any)
                }} 
              />
            </section>

            {/* 2. Delivery Type */}
            <section className="space-y-3">
              <Label className="text-sm font-semibold">Tipe Pesanan</Label>
              <div className="grid grid-cols-2 gap-3">
                {DELIVERY_TYPES.map(type => {
                  const Icon = type.icon
                  const isActive = deliveryMethod === type.value
                  return (
                    <button
                      key={type.value}
                      onClick={() => setDeliveryMethod(type.value as any)}
                      className={cn(
                        "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left",
                        isActive
                          ? `${type.bg} border-current ${type.color} shadow-sm`
                          : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", isActive ? "bg-white/60 dark:bg-white/10" : "bg-muted")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold block">{type.label}</span>
                        <span className="text-xs opacity-70">{type.value === 'pickup' ? 'Customer ambil sendiri' : 'Kirim via kurir'}</span>
                      </div>
                      {isActive && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 3. Delivery Details (conditional) */}
            {deliveryMethod === 'delivery' && (
              <section className="space-y-4 rounded-xl border bg-card p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="h-4 w-4 text-orange-500" />
                  Detail Pengiriman
                </div>

                {/* Courier */}
                <div className="space-y-2">
                  <Label className="text-sm">Kurir</Label>
                  <Select value={courierName} onValueChange={handleCourierChange}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue placeholder="Pilih kurir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {couriers?.map(c => (
                        <SelectItem key={c.id} value={c.name}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{c.name}</span>
                            {c.defaultCost ? (
                              <span className="text-xs text-muted-foreground">{formatCurrency(c.defaultCost)}</span>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="__other">Kurir Lainnya...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping Cost */}
                <div className="space-y-2">
                  <Label className="text-sm">Ongkos Kirim</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="pl-10 h-11 rounded-lg"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Alamat Pengiriman
                  </Label>
                  <Textarea 
                    placeholder="Masukkan alamat lengkap pengiriman..."
                    className="min-h-[80px] rounded-lg resize-none"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)} 
                  />
                </div>
              </section>
            )}

            {/* 4. Payment Method */}
            <section className="space-y-3">
              <Label className="text-sm font-semibold">Metode Pembayaran</Label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon
                  const isActive = paymentMethod === method.value
                  return (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                        isActive
                          ? `${method.bg} border-current ${method.color} shadow-sm scale-[1.02]`
                          : "border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold">{method.label}</span>
                      {isActive && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 5. Cash Input (conditional) */}
            {paymentMethod === 'cash' && (
              <section className="space-y-4 rounded-xl border bg-card p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-sm font-semibold">Uang Diterima</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Rp</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-12 h-16 text-3xl font-bold rounded-xl border-2 focus:border-primary"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[10000, 20000, 50000, 100000].map(amount => (
                    <Button 
                      key={amount} 
                      variant={cashAmount === String(amount) ? "default" : "outline"}
                      className="h-10 text-xs font-bold rounded-lg"
                      onClick={() => setCashAmount(String(amount))}
                    >
                      {amount / 1000}k
                    </Button>
                  ))}
                  <Button 
                    variant={cashAmount === String(total) ? "default" : "secondary"}
                    className="h-10 text-xs font-bold rounded-lg"
                    onClick={() => setCashAmount(String(total))}
                  >
                    Pas
                  </Button>
                </div>
                
                {Number(cashAmount) > 0 && (
                  <div className={cn(
                    "p-4 rounded-xl flex justify-between items-center animate-in fade-in duration-200",
                    Number(cashAmount) >= total 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  )}>
                    <span className="font-semibold text-sm">{Number(cashAmount) >= total ? '✓ Kembalian' : '✗ Kurang'}</span>
                    <span className="font-bold text-2xl tabular-nums">{formatCurrency(Math.abs(changeAmount))}</span>
                  </div>
                )}
              </section>
            )}

            {/* Debt warning */}
            {paymentMethod === 'debt' && !selectedCustomer && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2 animate-in fade-in">
                <Receipt className="h-4 w-4 shrink-0" />
                Pilih pelanggan terlebih dahulu untuk pembayaran tempo.
              </div>
            )}

            {/* 6. Discount */}
            <section className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                Diskon (Rp)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-10 h-11 rounded-lg"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </section>

            {/* 7. Notes */}
            <section className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                Catatan (Opsional)
              </Label>
              <Input 
                placeholder="Contoh: Titip di satpam, tanpa bon..."
                className="h-11 rounded-lg"
                value={notes}
                onChange={(e) => setNotes(e.target.value)} 
              />
            </section>
          </div>
        </div>

        {/* ══════ RIGHT PANEL: Order Summary ══════ */}
        <div className="w-[380px] border-l bg-card flex flex-col shrink-0">
          
          {/* Order items header */}
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Pesanan</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{totalItems} item</span>
          </div>

          {/* Scrollable item list */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-0.5">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                    {item.image ? (
                      <img src={getImageUrl(item.image)!} className="w-full h-full object-cover" alt={item.name} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button 
                      variant="ghost" size="icon" 
                      className="h-6 w-6 rounded hover:bg-muted"
                      onClick={() => {
                        if (item.quantity <= 1) removeFromCart(item.productId)
                        else updateQuantity(item.productId, -1)
                      }}
                    >
                      {item.quantity <= 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                    </Button>
                    <span className="text-xs w-6 text-center font-bold tabular-nums">{item.quantity}</span>
                    <Button 
                      variant="ghost" size="icon" 
                      className="h-6 w-6 rounded hover:bg-muted"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* ─── Bottom: Totals + Confirm ─── */}
          <div className="border-t bg-gradient-to-t from-muted/30 to-transparent p-5 space-y-4">
            
            {/* Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Diskon</span>
                  <span className="font-medium tabular-nums">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {shippingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Ongkir
                  </span>
                  <span className="font-medium tabular-nums">+{formatCurrency(shippingAmount)}</span>
                </div>
              )}
              {paymentMethod === 'cash' && Number(cashAmount) > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tunai</span>
                    <span className="font-medium tabular-nums">{formatCurrency(Number(cashAmount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kembalian</span>
                    <span className={cn("font-medium tabular-nums", changeAmount >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                      {changeAmount >= 0 ? formatCurrency(changeAmount) : `-${formatCurrency(Math.abs(changeAmount))}`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Grand total */}
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-muted-foreground">TOTAL</span>
              <span className="text-3xl font-black text-primary tabular-nums tracking-tight">{formatCurrency(total)}</span>
            </div>

            {/* Delivery badge */}
            {deliveryMethod === 'delivery' && courierName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Truck className="h-3.5 w-3.5" />
                <span>Kirim via <strong>{courierName}</strong></span>
              </div>
            )}

            {/* Confirm */}
            <Button 
              onClick={handleCheckout} 
              disabled={createTx.isPending || !isPaymentValid}
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              size="lg"
            >
              {createTx.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
              ) : (
                <Check className="mr-2 h-5 w-5"/>
              )}
              Bayar {formatCurrency(total)}
            </Button>

            {!isPaymentValid && paymentMethod === 'cash' && (
              <p className="text-xs text-center text-muted-foreground">Uang belum cukup</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
