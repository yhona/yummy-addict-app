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
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Printer, Ban, Banknote, QrCode, Building2, Receipt,
  Truck, Store, User, Calendar, Hash, MapPin, StickyNote, Copy, CheckCircle2
} from 'lucide-react'
import { TransactionReportItem, useTransactionItems } from '@/features/reports/api/reports'
import { useVoidTransaction } from '@/features/pos/api/transactions'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

interface TransactionDrawerProps {
  transaction: TransactionReportItem | null
  open: boolean
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
  success: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: Ban },
  void: { label: 'Void', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: Ban },
  unpaid: { label: 'Belum Lunas', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: Receipt },
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

export function TransactionDrawer({ transaction, open, onClose }: TransactionDrawerProps) {
  const { data: itemsResponse, isLoading } = useTransactionItems(transaction?.id || null)
  const voidTx = useVoidTransaction()
  const [confirmVoid, setConfirmVoid] = useState(false)

  if (!transaction) return null

  const items = itemsResponse?.data || []
  const statusKey = transaction.status.toLowerCase()
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.completed
  const StatusIcon = statusCfg.icon
  const PaymentIcon = PAYMENT_ICONS[transaction.payment_method] || Banknote
  const isVoided = statusKey === 'cancelled' || statusKey === 'void'
  const isDelivery = transaction.delivery_method === 'delivery'

  const handleVoid = async () => {
    try {
      await voidTx.mutateAsync(transaction.id)
      toast.success('Transaksi berhasil dibatalkan')
      setConfirmVoid(false)
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Gagal membatalkan transaksi')
    }
  }

  const copyInvoice = () => {
    navigator.clipboard.writeText(transaction.invoice_number)
    toast.success('Nomor invoice disalin')
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">

        {/* ─── Header ─── */}
        <div className="p-6 pb-4 bg-gradient-to-b from-muted/40 to-background">
          <SheetHeader className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-lg">Detail Transaksi</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 mt-1">
                  <button onClick={copyInvoice} className="flex items-center gap-1 font-mono text-sm text-foreground hover:text-primary transition-colors cursor-pointer" title="Salin">
                    {transaction.invoice_number}
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
            <InfoCard icon={Calendar} label="Tanggal" value={format(new Date(transaction.date), 'dd MMM yyyy, HH:mm')} />
            <InfoCard icon={User} label="Kasir" value={transaction.cashier_name || '-'} />
            <InfoCard icon={User} label="Pelanggan" value={transaction.customer_name} />
            <InfoCard icon={PaymentIcon} label="Pembayaran" value={PAYMENT_LABELS[transaction.payment_method] || transaction.payment_method} />
          </div>
        </div>

        <div className="px-6 space-y-5 pb-6">

          {/* ─── Delivery Info ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              {isDelivery ? <Truck className="h-4 w-4 text-orange-500" /> : <Store className="h-4 w-4 text-sky-500" />}
              <span className="text-sm font-semibold">{isDelivery ? 'Pengiriman' : 'Ambil di Toko'}</span>
            </div>
            {isDelivery && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                {transaction.courier_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kurir</span>
                    <span className="font-medium">{transaction.courier_name}</span>
                  </div>
                )}
                {transaction.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Resi</span>
                    <span className="font-mono font-medium">{transaction.tracking_number}</span>
                  </div>
                )}
                {(transaction.shipping_cost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ongkir</span>
                    <span className="font-medium">{formatCurrency(transaction.shipping_cost!)}</span>
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
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.qty} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0 ml-3">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-center py-4 text-sm">Tidak ada item ditemukan.</p>
            )}
          </section>

          <Separator />

          {/* ─── Totals ─── */}
          <section className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(transaction.gross_total)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatCurrency(transaction.discount)}</span>
              </div>
            )}
            {(transaction.shipping_cost ?? 0) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Ongkir</span>
                <span className="tabular-nums">+{formatCurrency(transaction.shipping_cost!)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold pt-1">
              <span>Total</span>
              <span className="tabular-nums text-primary">{formatCurrency(transaction.net_total)}</span>
            </div>
            {transaction.payment_method === 'cash' && (transaction.cash_amount ?? 0) > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Tunai</span>
                  <span className="tabular-nums">{formatCurrency(transaction.cash_amount!)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Kembalian</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(transaction.change_amount!)}</span>
                </div>
              </>
            )}
          </section>

          {/* ─── Notes ─── */}
          {transaction.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                  Catatan
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">{transaction.notes}</p>
              </section>
            </>
          )}

          <Separator />

          {/* ─── Actions ─── */}
          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
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
                    <p className="text-sm text-destructive font-medium text-center">Yakin membatalkan transaksi ini? Stok akan dikembalikan.</p>
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
                        {voidTx.isPending ? 'Memproses...' : 'Ya, Batalkan'}
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

// Small info card component
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
