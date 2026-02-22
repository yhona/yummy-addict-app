import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, ClipboardList, CheckCircle2, Clock, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useOpnames, useDeleteOpname, useWarehouses } from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/opname/')({
  component: OpnameListPage,
})

function OpnameListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const params = {
    page,
    limit: 10,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(warehouseFilter !== 'all' && { warehouseId: warehouseFilter }),
  }

  const { data, isLoading } = useOpnames(params)
  const { data: warehousesData } = useWarehouses()
  const deleteOpname = useDeleteOpname()

  const sessions = data?.data ?? []
  const pagination = data?.pagination

  // Stats
  const totalSessions = pagination?.total ?? 0
  const countingSessions = sessions.filter(s => s.status === 'counting').length
  const finalizedSessions = sessions.filter(s => s.status === 'finalized').length

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteOpname.mutateAsync(deleteId)
      toast.success('Sesi opname berhasil dihapus')
      setDeleteId(null)
    } catch {
      toast.error('Gagal menghapus sesi opname')
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20">Draft</Badge>
      case 'counting':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Sedang Dihitung</Badge>
      case 'finalized':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Selesai</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Stock Opname</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Stock Opname</h2>
            <p className="text-muted-foreground">Penghitungan fisik stok barang di gudang</p>
          </div>
          <Button onClick={() => navigate({ to: '/inventory/opname/new' })}>
            <Plus className="mr-2 h-4 w-4" />
            Mulai Opname Baru
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sesi Opname</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sedang Berjalan</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{countingSessions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{finalizedSessions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="counting">Sedang Dihitung</SelectItem>
              <SelectItem value="finalized">Selesai</SelectItem>
            </SelectContent>
          </Select>

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
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Opname</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-center">Selisih</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada sesi opname
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate({ to: '/inventory/opname/$id', params: { id: session.id } })}>
                    <TableCell className="font-mono font-medium">{session.number}</TableCell>
                    <TableCell>{session.warehouseName}</TableCell>
                    <TableCell>{format(new Date(session.createdAt), 'dd MMM yyyy HH:mm')}</TableCell>
                    <TableCell>{statusBadge(session.status)}</TableCell>
                    <TableCell className="text-center">
                      {session.countedItems}/{session.totalItems}
                    </TableCell>
                    <TableCell className="text-center">
                      {session.itemsWithDifference > 0 ? (
                        <span className="text-red-500 font-medium">{session.itemsWithDifference} item</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => navigate({ to: '/inventory/opname/$id', params: { id: session.id } })}
                        >
                          {session.status === 'finalized' ? 'Lihat' : 'Lanjutkan'}
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                        {session.status !== 'finalized' && (
                          <Button variant="ghost" size="icon" className="text-destructive"
                            onClick={() => setDeleteId(session.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} sesi)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Sesi Opname?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Semua data penghitungan fisik di sesi ini akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
