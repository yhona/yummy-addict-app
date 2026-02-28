import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Search, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useSearchTransaction, useCreateReturn } from '@/features/returns/api/returns'
import { Transaction } from '@/features/returns/types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/_authenticated/returns/new')({
  component: NewReturnPage,
})

function NewReturnPage() {
  const navigate = useNavigate()
  const searchMutation = useSearchTransaction()
  const createMutation = useCreateReturn()

  const [searchQuery, setSearchQuery] = useState('')
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  
  // State for items to return: item id -> qty to return
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    searchMutation.mutate(searchQuery.trim(), {
      onSuccess: (data) => {
        setTransaction(data)
        // Auto-initialize return qtys to 0
        const initialQtys: Record<string, number> = {}
        data.items?.forEach((req: any) => {
          initialQtys[req.id] = 0
        })
        setReturnQtys(initialQtys)
        toast.success('Transaksi ditemukan')
      },
      onError: () => {
        setTransaction(null)
        toast.error('Gagal mencari transaksi. Pastikan Nomor Nota benar (cotoh: TRX-17...).')
      }
    })
  }

  const handleQtyChange = (itemId: string, maxQty: number, value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) {
      setReturnQtys(prev => ({ ...prev, [itemId]: 0 }))
      return
    }
    
    if (num > maxQty) {
      setReturnQtys(prev => ({ ...prev, [itemId]: maxQty }))
      toast.warning(`Maksimal retur untuk item ini adalah ${maxQty}`)
      return
    }

    setReturnQtys(prev => ({ ...prev, [itemId]: num }))
  }

  const handleCreateReturn = () => {
    if (!transaction) return

    // Filter out items with 0 return qty
    const itemsToReturn = transaction.items?.filter((item: any) => returnQtys[item.id] > 0)
    
    if (!itemsToReturn || itemsToReturn.length === 0) {
      toast.error('Pilih minimal 1 barang untuk diretur (Isi Qty Retur > 0)')
      return
    }

    const payload = {
      transactionId: transaction.id,
      reason: reason,
      items: itemsToReturn.map((item: any) => ({
        transactionItemId: item.id,
        productId: item.productId,
        quantity: returnQtys[item.id],
        price: Number(item.price), 
      }))
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Retur Penjualan berhasil dicatat')
        navigate({ to: '/returns' })
      },
      onError: (err: any) => {
        toast.error(err.message || 'Gagal membuat retur')
      }
    })
  }

  // Calculate total return amount
  const totalReturnAmount = transaction?.items?.reduce((sum: number, item: any) => {
    return sum + (Number(item.price) * (returnQtys[item.id] || 0))
  }, 0) || 0

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/returns' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Lihat Daftar Retur
        </Button>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Proses Retur Baru</h1>
          <p className="text-muted-foreground">
            Cari transaksi berdasarkan No. Nota, lalu pilih barang mana saja yang akan dikembalikan oleh pelanggan.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Search & Summary */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cari Transaksi</CardTitle>
                <CardDescription>Masukkan No. Struk Kasir (TRX-...)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input 
                    placeholder="Contoh: TRX-1704..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" disabled={searchMutation.isPending} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {transaction && (
              <Card className="border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Transaksi Ditemukan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No. Transaksi</p>
                    <p className="font-semibold">{transaction.number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tanggal</p>
                    <p>{format(new Date(transaction.date), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Nota Asli</p>
                    <p className="font-semibold">Rp {Number(transaction.finalAmount).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kasir</p>
                    <p>{transaction.cashier?.name || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Items and Form */}
          <div className="md:col-span-2 space-y-6">
            {!transaction ? (
              <Card className="h-full flex flex-col items-center justify-center p-12 border-dashed text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Belum Ada Transaksi Terpilih</h3>
                <p className="text-sm text-center mt-2 max-w-sm">
                  Cari transaksi di bar sebelah kiri untuk memunculkan daftar barang yang bisa diretur.
                </p>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pilih Barang Untuk Di-retur</CardTitle>
                  <CardDescription>Isi kolom 'Qty Retur' pada barang yang dikembalikan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-3 text-left font-medium">Produk</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Harga Jual</th>
                          <th className="p-3 text-right font-medium">Qty Beli</th>
                          <th className="p-3 text-right font-bold w-32 bg-amber-50 dark:bg-amber-950/20">Qty Retur</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Subtotal Retur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.items?.map((item: any) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-3">
                              <p className="font-medium">{item.product?.name}</p>
                            </td>
                            <td className="p-3 text-right">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                            <td className="p-3 text-right font-semibold">{item.quantity}</td>
                            <td className="p-3 bg-amber-50 dark:bg-amber-950/20">
                              <Input 
                                type="number" 
                                min="0" 
                                max={item.quantity}
                                className={`h-8 text-right bg-white dark:bg-background ${returnQtys[item.id] > 0 ? 'border-amber-500 font-bold text-amber-600' : ''}`}
                                value={returnQtys[item.id] || ''}
                                onChange={(e) => handleQtyChange(item.id, item.quantity, e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="p-3 text-right font-medium text-destructive">
                              {returnQtys[item.id] > 0 ? `Rp ${(Number(item.price) * returnQtys[item.id]).toLocaleString('id-ID')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Alasan Retur / Catatan Tambahan</Label>
                      <Textarea 
                        placeholder="Contoh: Barang cacat pabrik, salah ambil, dll." 
                        className="resize-none h-24"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col justify-end items-end space-y-4 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-900/30">
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Total Dana Yang Dikembalikan (Refund)</p>
                        <h2 className="text-3xl font-bold flex items-center justify-end text-red-600 dark:text-red-500">
                          Rp {totalReturnAmount.toLocaleString('id-ID')}
                        </h2>
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                        onClick={handleCreateReturn}
                        disabled={createMutation.isPending || totalReturnAmount === 0}
                      >
                        {createMutation.isPending ? 'Memproses...' : 'Proses & Simpan Retur'}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground w-full">
                        <AlertCircle className="inline h-3 w-3 mr-1 mb-0.5" />
                        Stok barang yang diretur akan otomatis ditambahkan kembali ke inventaris.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}
