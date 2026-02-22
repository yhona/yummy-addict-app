import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, ArrowRightLeft, Loader2, Calendar as CalendarIcon, Search } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useMovements, useMovementStats, useWarehouses } from '@/features/inventory/api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/transfer/')({
  component: TransferListPage,
})

function TransferListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const params = {
    page,
    limit: 15,
    type: 'transfer' as const,
    ...(searchTerm && { search: searchTerm }),
    ...(warehouseFilter !== 'all' && { warehouseId: warehouseFilter }),
    ...(dateFrom && { dateFrom: format(dateFrom, 'yyyy-MM-dd') }),
    ...(dateTo && { dateTo: format(dateTo, 'yyyy-MM-dd') }),
  }

  const { data, isLoading } = useMovements(params)
  const { data: warehousesData } = useWarehouses()
  const { data: stats } = useMovementStats({ period: 'month' })

  const movements = data?.data ?? []
  const pagination = data?.pagination

  // Group movements by referenceNumber (1 transfer = 2 movements: OUT + IN)
  const grouped = new Map<string, { out: typeof movements[0]; in?: typeof movements[0] }>()
  for (const m of movements) {
    const ref = m.referenceNumber || m.id
    if (m.movementType === 'out') {
      grouped.set(ref, { out: m, ...(grouped.get(ref) || {}) })
    } else if (m.movementType === 'in') {
      const existing = grouped.get(ref)
      if (existing) existing.in = m
      else grouped.set(ref, { out: m, in: m })
    }
  }

  const transferRecords = Array.from(grouped.values())

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Transfer Stok</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Transfer Stok</h2>
            <p className="text-muted-foreground">Pindahkan stok barang antar gudang dan lihat riwayatnya</p>
          </div>
          <Button onClick={() => navigate({ to: '/inventory/transfer/new' })}>
            <Plus className="mr-2 h-4 w-4" />
            Transfer Baru
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transfer Bulan Ini</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.movementCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Qty Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+{stats?.totalIn ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Qty Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">-{stats?.totalOut ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Gudang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gudang</SelectItem>
              {(warehousesData ?? []).map((wh: any) => (
                <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[140px] text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Dari'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[140px] text-left font-normal', !dateTo && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'dd/MM/yy') : 'Sampai'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Referensi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Gudang Asal</TableHead>
                <TableHead>Gudang Tujuan</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : transferRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat transfer
                  </TableCell>
                </TableRow>
              ) : (
                transferRecords.map((record) => {
                  const m = record.out
                  return (
                    <TableRow key={m.referenceNumber || m.id}>
                      <TableCell className="font-mono text-xs">
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-200">
                          {m.referenceNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(m.createdAt), 'dd MMM yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{m.product?.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({m.product?.sku})</span>
                        </div>
                      </TableCell>
                      <TableCell>{m.warehouse?.name ?? '—'}</TableCell>
                      <TableCell>{record.in?.warehouse?.name ?? '—'}</TableCell>
                      <TableCell className="text-center font-medium">{m.quantityChange}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {m.notes || '—'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} record)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}>Selanjutnya</Button>
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
