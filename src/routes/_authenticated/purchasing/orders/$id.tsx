import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { usePurchase, usePurchasePayments, useReceivePurchase, useCancelPurchase, useAddPayment } from '@/features/purchasing/api/purchases'
import { formatCurrency } from '@/lib/utils'
import { format, isPast } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Check, X, Plus, Loader2, AlertCircle, CheckCircle2, Package, CreditCard, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/purchasing/orders/$id')({
  component: PurchaseDetailPage,
})

function PurchaseDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const { data: purchase, isLoading } = usePurchase(id)
  const { data: payments } = usePurchasePayments(id)
  const receiveMutation = useReceivePurchase()
  const cancelMutation = useCancelPurchase()
  const addPaymentMutation = useAddPayment()

  // Dialog states
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // Payment form state
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('transfer')
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [payNotes, setPayNotes] = useState('')

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Purchase Order tidak ditemukan</h2>
        <Button variant="outline" onClick={() => navigate({ to: '/purchasing/orders' })}>
          ← Kembali
        </Button>
      </div>
    )
  }

  const totalAmount = Number(purchase.totalAmount) || 0
  const amountPaid = Number(purchase.amountPaid) || 0
  const remaining = totalAmount - amountPaid
  const paymentPercent = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0
  const isDuePast = purchase.dueDate && isPast(new Date(purchase.dueDate)) && purchase.paymentStatus !== 'PAID'

  const handleReceive = () => {
    receiveMutation.mutate(id, {
      onSuccess: () => {
        toast.success('PO ditandai sebagai diterima. Stok telah diupdate.')
        setShowReceiveDialog(false)
      },
      onError: (e: any) => toast.error(e.message || 'Gagal menerima PO'),
    })
  }

  const handleCancel = () => {
    cancelMutation.mutate(id, {
      onSuccess: () => {
        toast.success('PO berhasil dibatalkan.')
        setShowCancelDialog(false)
      },
      onError: (e: any) => toast.error(e.message || 'Gagal membatalkan PO'),
    })
  }

  const handleAddPayment = () => {
    const amount = Number(payAmount)
    if (!amount || amount <= 0) return toast.error('Jumlah bayar harus lebih dari 0')
    if (amount > remaining + 0.01) return toast.error(`Jumlah melebihi sisa hutang (${formatCurrency(remaining)})`)

    addPaymentMutation.mutate({
      id,
      data: { amount, paymentMethod: payMethod, date: payDate, notes: payNotes || undefined }
    }, {
      onSuccess: () => {
        toast.success('Pembayaran berhasil dicatat.')
        setShowPaymentDialog(false)
        setPayAmount('')
        setPayNotes('')
      },
      onError: (e: any) => toast.error(e.message || 'Gagal mencatat pembayaran'),
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/purchasing/orders' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail PO #{purchase.number}</h1>
            <p className="text-sm text-muted-foreground">
              {purchase.supplier?.name} — {format(new Date(purchase.date), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <StatusBadgeLarge status={purchase.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ========== LEFT COLUMN (2/3) ========== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Info PO */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Info Purchase Order
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">No PO</p>
                  <p className="font-mono font-semibold">{purchase.number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Order</p>
                  <p className="font-medium">{format(new Date(purchase.date), 'dd MMMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p
                    className="font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => navigate({ to: '/purchasing/suppliers/$id', params: { id: purchase.supplierId } })}
                  >
                    {purchase.supplier?.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadgeLarge status={purchase.status} />
                </div>
              </div>
              {purchase.notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
                  <p className="text-muted-foreground mb-1">Catatan:</p>
                  <p>{purchase.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Daftar Item */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Daftar Item</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Harga Modal</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items?.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.product?.name || '—'}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{item.product?.sku || '—'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(item.costPrice))}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(item.subtotal))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end p-4 border-t bg-muted/30">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Nilai PO</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========== RIGHT COLUMN (1/3) ========== */}
        <div className="space-y-6">
          {/* Card: Aksi & Status */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-center">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-center">
                <StatusBadgeLarge status={purchase.status} />
              </div>

              {purchase.status === 'ordered' && (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => setShowReceiveDialog(true)}>
                    <Check className="mr-2 h-4 w-4" /> Tandai Barang Diterima
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <X className="mr-2 h-4 w-4" /> Batalkan PO
                  </Button>
                </div>
              )}

              {purchase.status === 'received' && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">Stok telah diupdate otomatis</p>
                </div>
              )}

              {purchase.status === 'cancelled' && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">PO ini telah dibatalkan</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Status Pembayaran */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total PO</span>
                  <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sudah Dibayar</span>
                  <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa Hutang</span>
                  <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>

              <Progress value={paymentPercent} className="h-2" />

              {purchase.dueDate && (
                <div className={`flex items-center gap-2 text-sm ${isDuePast ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                  <CalendarDays className="h-4 w-4" />
                  Jatuh Tempo: {format(new Date(purchase.dueDate), 'dd MMM yyyy')}
                </div>
              )}

              <PaymentBadge status={purchase.paymentStatus} />

              {purchase.status === 'received' && purchase.paymentStatus !== 'PAID' && (
                <Button className="w-full" variant="outline" onClick={() => setShowPaymentDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Catat Pembayaran
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card: Riwayat Pembayaran */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!payments || payments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Belum ada pembayaran
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-md text-sm">
                      <div>
                        <p className="font-medium">{formatCurrency(Number(p.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(p.date), 'dd MMM yyyy')} · {p.paymentMethod}
                        </p>
                        {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== DIALOGS ========== */}

      {/* Receive Confirm */}
      <AlertDialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penerimaan</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin mau tandai PO ini sebagai diterima? Stok akan diupdate otomatis sesuai item di PO ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReceive} disabled={receiveMutation.isPending}>
              {receiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Tandai Diterima
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirm */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin mau batalkan PO ini? Aksi ini tidak bisa diurungkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Batalkan PO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>
              Sisa hutang: <strong className="text-red-600">{formatCurrency(remaining)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Jumlah Bayar *</Label>
              <Input
                type="number"
                placeholder="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={remaining}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Bayar</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="giro">Giro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Catatan pembayaran..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Batal</Button>
            <Button onClick={handleAddPayment} disabled={addPaymentMutation.isPending}>
              {addPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatusBadgeLarge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ordered: { label: 'Menunggu Penerimaan', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
    received: { label: 'Diterima', className: 'bg-green-500/10 text-green-600 border-green-200' },
    cancelled: { label: 'Dibatalkan', className: 'bg-slate-500/10 text-slate-500 border-slate-200' },
  }
  const cfg = map[status] || map.ordered
  return <Badge variant="outline" className={`px-3 py-1 text-sm ${cfg.className}`}>{cfg.label}</Badge>
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    UNPAID: { label: 'Belum Bayar', className: 'bg-red-500/10 text-red-600 border-red-200' },
    PARTIAL: { label: 'Sebagian', className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
    PAID: { label: 'Lunas', className: 'bg-green-500/10 text-green-600 border-green-200' },
  }
  const cfg = map[status] || map.UNPAID
  return <Badge variant="outline" className={`w-full justify-center py-1 ${cfg.className}`}>{cfg.label}</Badge>
}
