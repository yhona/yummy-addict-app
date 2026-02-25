import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { usePurchases, type PurchasesParams } from '@/features/purchasing/api/purchases'
import { formatCurrency } from '@/lib/utils'
import { format, isPast } from 'date-fns'
import { Plus, ShoppingCart, Search, FilterX, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/purchasing/orders/')({
  component: PurchaseOrderListPage,
})

// ==========================================
// STATUS BADGE HELPERS
// ==========================================

function POStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ordered: { label: 'Menunggu', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
    received: { label: 'Diterima', className: 'bg-green-500/10 text-green-600 border-green-200' },
    cancelled: { label: 'Dibatalkan', className: 'bg-slate-500/10 text-slate-500 border-slate-200' },
  }
  const cfg = map[status] || map.ordered
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    UNPAID: { label: 'Belum Bayar', className: 'bg-red-500/10 text-red-600 border-red-200' },
    PARTIAL: { label: 'Sebagian', className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
    PAID: { label: 'Lunas', className: 'bg-green-500/10 text-green-600 border-green-200' },
  }
  const cfg = map[status] || map.UNPAID
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

function PurchaseOrderListPage() {
  const navigate = useNavigate()

  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Build API params
  const params: PurchasesParams = {
    page,
    limit,
    ...(search && { search }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(paymentFilter !== 'all' && { paymentStatus: paymentFilter }),
  }

  const { data: result, isLoading } = usePurchases(params)
  const purchases = result?.data || []
  const summary = result?.summary
  const pagination = result?.pagination

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Order</h1>
          <p className="text-sm text-muted-foreground">Kelola pemesanan barang dari supplier</p>
        </div>
        <Button onClick={() => navigate({ to: '/purchasing/orders/new' })}>
          <Plus className="mr-2 h-4 w-4" />
          Buat PO Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-yellow-500 ${statusFilter === 'ordered' ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'ordered' ? 'all' : 'ordered'); setPage(1) }}
        >
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-yellow-600 uppercase">Menunggu Penerimaan</p>
            <p className="text-2xl font-bold">{summary?.totalOrdered ?? '—'}</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-green-500 ${statusFilter === 'received' ? 'ring-2 ring-green-400' : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'received' ? 'all' : 'received'); setPage(1) }}
        >
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-green-600 uppercase">Sudah Diterima</p>
            <p className="text-2xl font-bold">{summary?.totalReceived ?? '—'}</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-red-500 ${paymentFilter === 'UNPAID' ? 'ring-2 ring-red-400' : ''}`}
          onClick={() => { setPaymentFilter(paymentFilter === 'UNPAID' ? 'all' : 'UNPAID'); setPage(1) }}
        >
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-red-600 uppercase">Belum Dibayar</p>
            <p className="text-2xl font-bold">{summary?.totalOrdered != null ? (summary.totalOrdered + summary.totalReceived - (summary.totalCancelled || 0)) : '—'}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Hutang</p>
            <p className="text-2xl font-bold text-red-600">
              {summary ? formatCurrency(Number(summary.totalOutstanding)) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari No PO atau Supplier..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status PO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ordered">Menunggu</SelectItem>
            <SelectItem value="received">Diterima</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status Bayar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bayar</SelectItem>
            <SelectItem value="UNPAID">Belum Bayar</SelectItem>
            <SelectItem value="PARTIAL">Sebagian</SelectItem>
            <SelectItem value="PAID">Lunas</SelectItem>
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
      ) : purchases.length === 0 ? (
        <Card className="border-dashed bg-muted/40 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-xl font-bold">Belum ada Purchase Order</h3>
            <p className="text-muted-foreground max-w-md">
              Mulai dengan membuat pesanan pembelian pertama ke supplier Anda.
            </p>
            <Button onClick={() => navigate({ to: '/purchasing/orders/new' })}>
              <Plus className="mr-2 h-4 w-4" /> Buat PO Pertama
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No PO</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status PO</TableHead>
                  <TableHead>Status Bayar</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((po) => {
                  const isDuePast = po.dueDate && isPast(new Date(po.dueDate)) && po.paymentStatus !== 'PAID'
                  return (
                    <TableRow
                      key={po.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate({ to: '/purchasing/orders/$id', params: { id: po.id } })}
                    >
                      <TableCell className="font-mono text-sm font-medium">{po.number}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{po.supplier?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{po.supplier?.code}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(po.date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(po.totalAmount))}
                      </TableCell>
                      <TableCell><POStatusBadge status={po.status} /></TableCell>
                      <TableCell><PaymentStatusBadge status={po.paymentStatus} /></TableCell>
                      <TableCell>
                        {po.dueDate ? (
                          <span className={`text-sm ${isDuePast ? 'text-red-600 font-bold' : ''}`}>
                            {format(new Date(po.dueDate), 'dd MMM yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({ to: '/purchasing/orders/$id', params: { id: po.id } })
                          }}
                        >
                          Lihat →
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
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
                Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, pagination.total)} dari {pagination.total} PO
              </p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {page} / {pagination.totalPages}
                </span>
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
