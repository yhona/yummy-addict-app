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
import { Printer } from 'lucide-react'
import { TransactionReportItem, useTransactionItems } from '@/features/reports/api/reports'
import { formatCurrency } from '@/lib/utils'

interface TransactionDrawerProps {
  transaction: TransactionReportItem | null
  open: boolean
  onClose: () => void
}

export function TransactionDrawer({ transaction, open, onClose }: TransactionDrawerProps) {
  const { data: itemsResponse, isLoading } = useTransactionItems(transaction?.id || null)

  if (!transaction) return null

  const items = itemsResponse?.data || []

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-green-100 text-green-700'
      case 'CANCELLED':
      case 'VOID':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Detail Transaksi</SheetTitle>
            <Badge className={getStatusColor(transaction.status)} variant="outline">
              {transaction.status.toUpperCase()}
            </Badge>
          </div>
          <SheetDescription className="text-base text-black dark:text-white font-mono mt-1">
            {transaction.invoice_number}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-sm">
          {/* Info Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-1">Tanggal</p>
              <p className="font-medium">{format(new Date(transaction.date), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Kasir</p>
              <p className="font-medium">{transaction.cashier_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Pelanggan</p>
              <p className="font-medium">{transaction.customer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Metode Bayar</p>
              <p className="font-medium capitalize">{transaction.payment_method}</p>
            </div>
          </div>

          <Separator />

          {/* Items Section */}
          <div>
            <h4 className="font-semibold mb-3">Item Pesanan</h4>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.qty} x {formatCurrency(item.price)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-xs text-red-500">Diskon: -{formatCurrency(item.discount)}</p>
                      )}
                    </div>
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-center py-4">Tidak ada item ditemukan.</p>
            )}
          </div>

          <Separator />

          {/* Totals Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(transaction.gross_total)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon Transaksi</span>
                <span>-{formatCurrency(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <span>Total Akhir</span>
              <span>{formatCurrency(transaction.net_total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak Struk
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
