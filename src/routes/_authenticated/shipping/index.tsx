import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useShipments, type ShipmentsParams } from '@/features/shipping/api/shipping'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Package, Search, FilterX, ChevronLeft, ChevronRight, Loader2,
  Truck, PackageCheck, PackageX, Clock
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/shipping/')({
  component: ShippingListPage,
})

// ==========================================
// STATUS BADGE
// ==========================================

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Perlu Diproses', className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  shipped: { label: 'Dikirim', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  delivered: { label: 'Diterima', className: 'bg-green-500/10 text-green-600 border-green-200' },
  returned: { label: 'Retur', className: 'bg-red-500/10 text-red-600 border-red-200' },
  failed: { label: 'Gagal', className: 'bg-red-500/10 text-red-600 border-red-200' },
}

function ShippingStatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.pending
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
}

// ==========================================
// MAIN PAGE
// ==========================================

function ShippingListPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const params: ShipmentsParams = {
    page,
    limit,
    ...(search && { search }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  }

  const { data: result, isLoading } = useShipments(params)
  const shipments = result?.data || []
  const summary = result?.summary
  const pagination = result?.pagination

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengiriman</h1>
          <p className="text-sm text-muted-foreground">Kelola status pengiriman pesanan delivery</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/shipping/bulk-update' })}>
          <Package className="mr-2 h-4 w-4" /> Update Resi Massal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-blue-500 ${statusFilter === 'pending' ? 'ring-2 ring-blue-400' : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); setPage(1) }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase">Perlu Diproses</p>
              <p className="text-2xl font-bold">{summary?.pending ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-yellow-500 ${statusFilter === 'shipped' ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped'); setPage(1) }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-xs font-semibold text-yellow-600 uppercase">Dalam Perjalanan</p>
              <p className="text-2xl font-bold">{summary?.shipped ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-green-500 ${statusFilter === 'delivered' ? 'ring-2 ring-green-400' : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered'); setPage(1) }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <PackageCheck className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase">Diterima</p>
              <p className="text-2xl font-bold">{summary?.delivered ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-red-500 ${statusFilter === 'returned' ? 'ring-2 ring-red-400' : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'returned' ? 'all' : 'returned'); setPage(1) }}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <PackageX className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase">Retur / Gagal</p>
              <p className="text-2xl font-bold">{(summary?.returned ?? 0) + (summary?.failed ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari No Order / Customer / No Resi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Perlu Diproses</SelectItem>
            <SelectItem value="shipped">Dalam Perjalanan</SelectItem>
            <SelectItem value="delivered">Diterima</SelectItem>
            <SelectItem value="returned">Retur</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={resetFilters} className="text-muted-foreground">
          <FilterX className="h-4 w-4 mr-2" /> Reset
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shipments.length === 0 ? (
        <Card className="border-dashed bg-muted/40 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Package className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-xl font-bold">
              {statusFilter === 'pending' ? 'Semua pesanan sudah diproses! 🎉' : 'Belum ada data pengiriman'}
            </h3>
            <p className="text-muted-foreground max-w-md">
              Data pengiriman akan muncul saat ada pesanan delivery.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Kurir</TableHead>
                  <TableHead>No Resi</TableHead>
                  <TableHead className="text-right">Ongkir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tgl Order</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: '/shipping/$id', params: { id: s.id } })}
                  >
                    <TableCell className="font-mono text-sm font-medium">{s.orderNumber}</TableCell>
                    <TableCell className="font-semibold">{s.customerName}</TableCell>
                    <TableCell>
                      {s.courierName ? (
                        <Badge variant="secondary" className="text-xs">{s.courierName}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.trackingNumber ? (
                        <span className="font-mono text-sm">{s.trackingNumber}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(s.shippingCost)}</TableCell>
                    <TableCell><ShippingStatusBadge status={s.shippingStatus} /></TableCell>
                    <TableCell className="text-sm">{format(new Date(s.orderDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({ to: '/shipping/$id', params: { id: s.id } })
                        }}
                      >
                        Detail →
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per halaman:</span>
                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
