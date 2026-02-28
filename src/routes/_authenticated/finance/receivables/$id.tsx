import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { useReceivableDetail, useCreatePayment } from '@/features/receivables/api/receivables'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { ArrowLeft, AlertCircle, Clock, Wallet, History, Receipt } from 'lucide-react'
import { toast } from 'sonner'
export const Route = createFileRoute('/_authenticated/finance/receivables/$id')({
  component: ReceivableDetailPage,
})

function ReceivableDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  
  const { data: receivable, isLoading, refetch } = useReceivableDetail(id)
  const createPaymentMutation = useCreatePayment()

  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash')
  const [payNotes, setPayNotes] = useState('')

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!receivable) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Data Piutang Tidak Ditemukan</h2>
        <Button className="mt-4" onClick={() => navigate({ to: '/finance/receivables' })}>
          Kembali ke Daftar
        </Button>
      </div>
    )
  }

  const handlePayment = () => {
    const amountNum = Number(payAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Nominal pembayaran tidak valid')
      return
    }

    if (amountNum > Number(receivable.remainingAmount)) {
      toast.error(`Maksimal pembayaran adalah ${formatCurrency(Number(receivable.remainingAmount))}`)
      return
    }

    createPaymentMutation.mutate(
      {
        id: receivable.id,
        data: {
          amount: amountNum,
          paymentMethod: payMethod,
          notes: payNotes,
        }
      },
      {
        onSuccess: () => {
          toast.success('Pembayaran cicilan berhasil dicatat!')
          setIsPaymentOpen(false)
          setPayAmount('')
          setPayNotes('')
          refetch()
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || 'Gagal memproses pembayaran')
        }
      }
    )
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/finance/receivables' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Daftar Piutang
        </Button>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{receivable.number}</h2>
              {receivable.status === 'paid' && <Badge className="bg-emerald-500">Lunas</Badge>}
              {receivable.status === 'partial' && <Badge className="bg-blue-500/10 text-blue-600">Dicicil</Badge>}
              {receivable.status === 'unpaid' && <Badge variant="destructive">Belum Bayar</Badge>}
            </div>
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tgl Buat: {format(new Date(receivable.createdAt), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
              {receivable.dueDate && (
                <>
                   <span className="mx-2">•</span> 
                   Jatuh Tempo: {format(new Date(receivable.dueDate), 'dd MMMM yyyy', { locale: idLocale })}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {receivable.transactionId && (
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => navigate({ to: '/transactions', search: { search: receivable.transaction?.number || '' } })}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Lihat Transaksi Asal
              </Button>
            )}
            
            {receivable.status !== 'paid' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setIsPaymentOpen(true)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Tambah Pembayaran
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>Ringkasan Piutang</CardTitle>
              <CardDescription>Informasi detail pelanggan dan nilai hutang</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Pelanggan</span>
                  <p className="font-semibold">{receivable.customer?.name} ({receivable.customer?.phone || 'No HP Kosong'})</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Catatan / Alasan</span>
                  <p className="text-sm">{receivable.notes || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Total Hutang Awal</span>
                  <p className="text-lg font-bold">{formatCurrency(Number(receivable.amount))}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Sisa Hutang Saat Ini</span>
                  <p className={`text-xl font-bold ${receivable.status === 'paid' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {formatCurrency(Number(receivable.remainingAmount))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <History className="mr-2 h-5 w-5 text-primary" />
                Total Terbayar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary mb-2">
                {formatCurrency(Number(receivable.amount) - Number(receivable.remainingAmount))}
              </div>
              <p className="text-sm text-muted-foreground">
                Dari {receivable.payments?.length || 0} kali transaksi cicilan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* History of Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
            <CardDescription>Daftar cicilan yang telah dibayarkan oleh pelanggan.</CardDescription>
          </CardHeader>
          <CardContent>
            {receivable.payments && receivable.payments.length > 0 ? (
              <div className="space-y-4">
                {receivable.payments.map((payment, i) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 shrink-0 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full font-bold">
                        #{receivable.payments!.length - i}
                      </div>
                      <div>
                        <p className="font-semibold">{formatCurrency(Number(payment.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.paymentDate), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                          {' • '} Via {payment.paymentMethod.toUpperCase()}
                          {payment.notes && ` • Catatan: ${payment.notes}`}
                        </p>
                      </div>
                    </div>
                    {payment.receivedByUser && (
                      <div className="text-xs text-right text-muted-foreground bg-muted px-2 py-1 rounded hidden sm:block">
                        Penerima: {payment.receivedByUser.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                Belum ada riwayat pembayaran / cicilan untuk piutang ini.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mencatat Pembayaran Hutang</DialogTitle>
              <DialogDescription>
                Sisa Hutang Pelanggan: <strong>{formatCurrency(Number(receivable.remainingAmount))}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nominal Pembayaran (Rp)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    min="1"
                    max={receivable.remainingAmount.toString()}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={() => setPayAmount(receivable.remainingAmount.toString())}
                  >
                    Lunas
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Metode Pembayaran</label>
                <Select value={payMethod} onValueChange={(val: any) => setPayMethod(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai (Cash)</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Catatan Refensi (Opsional)</label>
                <Textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Transfer Bank BCA an. Budi..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Batal</Button>
              <Button onClick={handlePayment} disabled={createPaymentMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {createPaymentMutation.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}
