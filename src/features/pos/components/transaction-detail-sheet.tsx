import { format } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Printer, Ban, Banknote, QrCode, Building2, Receipt,
  Truck, Store, User, Calendar, Hash, StickyNote,
  Copy, CheckCircle2, Loader2
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useVoidTransaction } from '@/features/pos/api/transactions'
import { toast } from 'sonner'
import { useState } from 'react'

interface TransactionDetailSheetProps {
  transaction: any
  open: boolean
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
  unpaid: { label: 'Belum Lunas', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: Receipt },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: Ban },
}

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  qris: QrCode,
  transfer: Building2,
  debt: Receipt,
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  debt: 'Tempo',
}

export function TransactionDetailSheet({ transaction, open, onClose }: TransactionDetailSheetProps) {
  const voidTx = useVoidTransaction()
  const [confirmVoid, setConfirmVoid] = useState(false)

  if (!transaction) return null

  const tx = transaction
  const statusKey = tx.status?.toLowerCase() || 'completed'
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.completed
  const StatusIcon = statusCfg.icon
  const PaymentIcon = PAYMENT_ICONS[tx.paymentMethod] || Banknote
  const isVoided = statusKey === 'cancelled'
  const isDelivery = tx.deliveryMethod === 'delivery'
  const items = tx.items || []

  const handleVoid = async () => {
    try {
      await voidTx.mutateAsync(tx.id)
      toast.success(`Transaksi ${tx.number} berhasil dibatalkan`)
      setConfirmVoid(false)
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Gagal membatalkan transaksi')
    }
  }

  const copyNumber = () => {
    navigator.clipboard.writeText(tx.number)
    toast.success('Nomor transaksi disalin')
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return
    const receiptHtml = `<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:'Courier New',monospace;font-size:12px;width:58mm;margin:0;padding:10px;}.center{text-align:center;}.bold{font-weight:bold;}.line{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;}.items{margin:10px 0;}.item{margin:5px 0;}h2{margin:5px 0;font-size:16px;}</style></head><body><div class="center"><h2>RECEIPT</h2><p>${tx.number}</p><p>${format(new Date(tx.date), 'dd/MM/yyyy HH:mm')}</p></div><div class="line"></div><p><strong>Pelanggan:</strong> ${tx.customer?.name || 'Walk-in'}</p>${isDelivery ? `<p><strong>Pengiriman:</strong> ${tx.courierName || '-'}</p>` : ''}<div class="line"></div><div class="items">${items.map((item: any) => `<div class="item"><div>${item.product?.name || 'Item'}</div><div class="row"><span>${item.quantity} x Rp ${Number(item.price).toLocaleString('id-ID')}</span><span>Rp ${(item.quantity * Number(item.price)).toLocaleString('id-ID')}</span></div></div>`).join('')}</div><div class="line"></div><div class="row"><span>Subtotal</span><span>Rp ${Number(tx.totalAmount).toLocaleString('id-ID')}</span></div>${Number(tx.discountAmount) > 0 ? `<div class="row"><span>Diskon</span><span>-Rp ${Number(tx.discountAmount).toLocaleString('id-ID')}</span></div>` : ''}${Number(tx.shippingCost) > 0 ? `<div class="row"><span>Ongkir</span><span>Rp ${Number(tx.shippingCost).toLocaleString('id-ID')}</span></div>` : ''}<div class="row bold"><span>TOTAL</span><span>Rp ${Number(tx.finalAmount).toLocaleString('id-ID')}</span></div>${tx.paymentMethod === 'cash' ? `<div class="row"><span>Tunai</span><span>Rp ${Number(tx.cashAmount).toLocaleString('id-ID')}</span></div><div class="row"><span>Kembalian</span><span>Rp ${Number(tx.changeAmount).toLocaleString('id-ID')}</span></div>` : `<div class="row"><span>Bayar</span><span>${(PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod).toUpperCase()}</span></div>`}<div class="line"></div><p class="center">Terima Kasih!</p></body></html>`
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) { setConfirmVoid(false); onClose() } }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">

        {/* ─── Header ─── */}
        <div className="p-6 pb-4 bg-gradient-to-b from-muted/40 to-background">
          <SheetHeader className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-lg">Detail Pesanan</SheetTitle>
                <SheetDescription className="mt-1">
                  <button onClick={copyNumber} className="flex items-center gap-1 font-mono text-sm text-foreground hover:text-primary transition-colors cursor-pointer" title="Salin">
                    {tx.number}
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </SheetDescription>
              </div>
              <Badge className={cn("shrink-0 flex items-center gap-1 px-2.5 py-1", statusCfg.className)} variant="outline">
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </Badge>
            </div>
          </SheetHeader>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={Calendar} label="Tanggal" value={format(new Date(tx.date), 'dd MMM yyyy, HH:mm')} />
            <InfoCard icon={User} label="Kasir" value={tx.cashier?.name || '-'} />
            <InfoCard icon={User} label="Pelanggan" value={tx.customer?.name || 'Umum'} />
            <InfoCard icon={PaymentIcon} label="Pembayaran" value={PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod} />
          </div>
        </div>

        <div className="px-6 space-y-5 pb-6">

          {/* ─── Debt Guide Banner (if unpaid debt) ─── */}
          {tx.paymentMethod === 'debt' && statusKey === 'unpaid' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200">
              <div className="flex gap-3">
                <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-sm">Tertunda / Kasbon</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    Transaksi ini menggunakan metode Tempo (Hutang). Untuk mencatat pelunasan atau cicilan, silakan menuju menu Piutang.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-900 dark:hover:bg-amber-800 dark:border-amber-700 dark:text-amber-100 h-8"
                    onClick={() => {
                      onClose()
                      window.location.href = '/finance/receivables'
                    }}
                  >
                    Buka Menu Piutang &rarr;
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Delivery Info ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              {isDelivery ? <Truck className="h-4 w-4 text-orange-500" /> : <Store className="h-4 w-4 text-sky-500" />}
              <span className="text-sm font-semibold">{isDelivery ? 'Pengiriman' : 'Ambil di Toko'}</span>
            </div>
            {isDelivery && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                {tx.courierName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kurir</span>
                    <span className="font-medium">{tx.courierName}</span>
                  </div>
                )}
                {tx.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Resi</span>
                    <span className="font-mono font-medium">{tx.trackingNumber}</span>
                  </div>
                )}
                {Number(tx.shippingCost) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ongkir</span>
                    <span className="font-medium">{formatCurrency(Number(tx.shippingCost))}</span>
                  </div>
                )}
              </div>
            )}
          </section>

          <Separator />

          {/* ─── Items ─── */}
          <section>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              Item Pesanan ({items.length})
            </h4>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name || 'Item'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.product?.sku || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(Number(item.price))}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0 ml-3">
                      {formatCurrency(Number(item.subtotal || item.price * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-center py-4 text-sm">Tidak ada item.</p>
            )}
          </section>

          <Separator />

          {/* ─── Totals ─── */}
          <section className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(Number(tx.totalAmount))}</span>
            </div>
            {Number(tx.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatCurrency(Number(tx.discountAmount))}</span>
              </div>
            )}
            {Number(tx.shippingCost) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Ongkir</span>
                <span className="tabular-nums">+{formatCurrency(Number(tx.shippingCost))}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold pt-1">
              <span>Total</span>
              <span className="tabular-nums text-primary">{formatCurrency(Number(tx.finalAmount))}</span>
            </div>
            {tx.paymentMethod === 'cash' && Number(tx.cashAmount) > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Tunai</span>
                  <span className="tabular-nums">{formatCurrency(Number(tx.cashAmount))}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Kembalian</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(Number(tx.changeAmount))}</span>
                </div>
              </>
            )}
          </section>

          {/* ─── Notes ─── */}
          {tx.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  Catatan
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">{tx.notes}</p>
              </section>
            </>
          )}

          <Separator />

          {/* ─── Actions ─── */}
          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak Struk
            </Button>

            {!isVoided && (
              <>
                {!confirmVoid ? (
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmVoid(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Batalkan Transaksi
                  </Button>
                ) : (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 animate-in fade-in duration-200">
                    <p className="text-sm text-destructive font-medium text-center">
                      Yakin membatalkan transaksi ini?<br/>Stok akan dikembalikan.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm" onClick={() => setConfirmVoid(false)}>
                        Batal
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1" 
                        size="sm"
                        disabled={voidTx.isPending}
                        onClick={handleVoid}
                      >
                        {voidTx.isPending ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Memproses...</>
                        ) : 'Ya, Batalkan'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  )
}
