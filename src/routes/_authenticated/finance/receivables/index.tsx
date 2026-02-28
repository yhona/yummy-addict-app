import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useMemo } from 'react'
import { useReceivableList } from '@/features/receivables/api/receivables'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Wallet, Search, ArrowRight, Clock, AlertCircle, Plus, Info, ChevronDown, ChevronUp } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/finance/receivables/')({
  component: ReceivablesPage,
})

function ReceivablesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [showGuide, setShowGuide] = useState(false)
  
  const { data: response, isLoading } = useReceivableList({ 
    search: search !== '' ? search : undefined,
    status: status !== 'all' ? status : undefined,
  })

  // Calculations for summary cards
  const summary = useMemo(() => {
    if (!response?.data) return { totalDebt: 0, totalPaid: 0, unpaidCount: 0 }
    
    // We compute summary based on the current page for simplicity,
    // although ideally a separate stats endpoint is better for large data.
    return response.data.reduce((acc, row) => {
      const remaining = Number(row.remainingAmount)
      const amount = Number(row.amount)
      const paid = amount - remaining
      
      acc.totalDebt += remaining
      acc.totalPaid += paid
      if (row.status !== 'paid') acc.unpaidCount += 1
      
      return acc
    }, { totalDebt: 0, totalPaid: 0, unpaidCount: 0 })
  }, [response])

  const columns = [
    {
      accessorKey: 'number',
      header: 'No. Tagihan',
      cell: ({ row }: any) => (
        <div className="font-semibold text-primary">{row.original.number}</div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Tgl Jatuh Tempo',
      cell: ({ row }: any) => (
        <div className="flex items-center text-muted-foreground whitespace-nowrap">
          <Clock className="mr-2 h-4 w-4" />
          {row.original.dueDate ? format(new Date(row.original.dueDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}
        </div>
      )
    },
    {
      accessorKey: 'customer',
      header: 'Pelanggan',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.customerName || 'Anonim'}</div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Total Hutang',
      cell: ({ row }: any) => (
        <div className="text-right font-medium">
          {formatCurrency(Number(row.original.amount))}
        </div>
      ),
    },
    {
      accessorKey: 'remaining',
      header: 'Sisa Hutang',
      cell: ({ row }: any) => (
        <div className={`text-right font-bold ${row.original.status !== 'paid' ? 'text-destructive' : 'text-emerald-600'}`}>
          {formatCurrency(Number(row.original.remainingAmount))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const s = row.original.status
        if (s === 'paid') return <Badge variant="default" className="bg-emerald-500">Lunas</Badge>
        if (s === 'partial') return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Dicicil</Badge>
        return <Badge variant="destructive">Belum Bayar</Badge>
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: `/finance/receivables/${row.original.id}` })}
          >
            Detail <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 md:hidden" />
          <h2 className="text-lg font-semibold whitespace-nowrap">Piutang / Kasbon</h2>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Piutang Pelanggan</h1>
            <p className="text-muted-foreground">Kelola catatan hutang / kasbon dari pelanggan toko.</p>
          </div>
          <Button
            className="w-full md:w-auto shadow-sm"
            onClick={() => navigate({ to: '/finance/receivables/new' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Catat Piutang Manual
          </Button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Info className="hidden sm:block h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Info className="sm:hidden h-4 w-4 text-blue-600 dark:text-blue-400" />
                Apa itu Piutang / Kasbon?
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed max-w-4xl">
                Modul ini otomatis mencatat pelanggan yang berhutang (membeli dengan opsi "Tempo / Kasbon" di Kasir) atau hutang yang Anda catat manual. 
                Anda bisa memantau sisa hutang dan mencatat riwayat Uang Masuk (cicilan). Tagihan yang sudah 0 otomatis menjadi <b>Lunas</b>.
              </p>
              
              <Button 
                variant="link" 
                className="h-auto p-0 text-blue-700 hover:text-blue-800 dark:text-blue-400 p-0 font-medium flex items-center gap-1 mt-1"
                onClick={() => setShowGuide(!showGuide)}
              >
                {showGuide ? 'Sembunyikan Panduan Singkat' : 'Lihat Cara Penggunaan'}
                {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showGuide && (
                <div className="mt-3 text-sm text-blue-800 dark:text-blue-300 space-y-3 pl-3 border-l-2 border-blue-300 dark:border-blue-700 max-w-4xl">
                  <div>
                    <strong className="block mb-1">Cara 1: Lewat Kasir (Otomatis)</strong>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Di halaman POS, pilih menu Checkout.</li>
                      <li>Ubah metode pembayaran menjadi "Tempo / Kasbon".</li>
                      <li>Pilih Nama Pelanggan (Wajib).</li>
                      <li>Selesaikan pesanan. Tagihan akan otomatis masuk ke daftar Piutang ini.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block mb-1">Cara 2: Lewat Tombol Manual</strong>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Klik tombol <b>Catat Piutang Manual</b> di pojok kanan atas.</li>
                      <li>Masukkan nama pelanggan, nominal, serta tanggal jatuh tempo.</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="block mb-1">Cara Melunasi / Tambah Uang Masuk</strong>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Cari tagihan pelanggan di tabel bawah, klik tombol <b>Detail</b>.</li>
                      <li>Klik <b>Tambah Pembayaran</b>, isi nominal cicilan/pelunasan. Sisa hutang akan otomatis dipotong.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sisa Piutang</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summary.totalDebt)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari {summary.unpaidCount} tagihan tertunda
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uang Masuk (Cicilan)</CardTitle>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total cicilan yang telah dibayarkan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div className="flex flex-1 items-center space-x-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="unpaid">Belum Bayar</SelectItem>
                <SelectItem value="partial">Dicicil</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <Card className="shadow-none border-t border-b sm:border rounded-none sm:rounded-lg">
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={response?.data || []}
              isLoading={isLoading}
              pagination={true}
            />
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
