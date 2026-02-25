import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSupplier, useDeleteSupplier, useUpdateSupplier, useSupplierStats } from '@/features/purchasing/api/suppliers'
import { usePurchases } from '@/features/purchasing/api/purchases'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash, Mail, Phone, MapPin, Building2, User, Plus, ShoppingBag, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SupplierForm } from '@/features/purchasing/components/supplier-form'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/purchasing/suppliers/$id')({
  component: SupplierDetailPage,
})

function SupplierDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const { data: supplier, isLoading } = useSupplier(id)
  const { data: stats } = useSupplierStats(id)
  const { data: purchasesResult } = usePurchases({ supplierId: id, limit: 20 })
  const deleteSupplier = useDeleteSupplier()
  const updateSupplier = useUpdateSupplier()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const handleDelete = () => {
    deleteSupplier.mutate(id, {
      onSuccess: () => {
        toast.success("Supplier berhasil dihapus")
        navigate({ to: '/purchasing/suppliers' })
      },
      onError: (err: any) => toast.error("Gagal menghapus", { description: err.message }),
    })
  }

  const handleUpdate = (values: any) => {
    updateSupplier.mutate({ id, data: values }, {
      onSuccess: () => {
        toast.success("Supplier berhasil diupdate")
        setEditOpen(false)
      },
      onError: (err: any) => toast.error("Gagal update", { description: err.message }),
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (!supplier) {
    return <div className="p-6 text-center">Supplier tidak ditemukan</div>
  }

  const purchases = purchasesResult?.data || []
  const filteredPurchases = statusFilter === 'all'
    ? purchases
    : purchases.filter(p => p.status === statusFilter)

  const outstanding = Number(stats?.outstanding || 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/purchasing/suppliers' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {supplier.name}
              <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                {supplier.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </h1>
            <p className="text-muted-foreground font-mono text-sm">{supplier.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/purchasing/orders/new' })}>
            <Plus className="mr-2 h-4 w-4" /> Buat PO
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========== LEFT: Profile ========== */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Profil Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Kontak Person
              </span>
              <p>{supplier.contactPerson || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </span>
              <p>{supplier.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" /> No HP
              </span>
              <p>{supplier.phone || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Alamat
              </span>
              <p className="text-sm">{supplier.address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* ========== RIGHT: Stats + PO History ========== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-slate-400">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Total PO</p>
                <p className="text-2xl font-bold">{stats?.totalPurchases ?? '—'}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Total Pembelian</p>
                <p className="text-xl font-bold">{stats ? formatCurrency(Number(stats.totalAmount)) : '—'}</p>
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${outstanding > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Wallet className="h-3 w-3" /> Hutang
                </p>
                <p className={`text-xl font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats ? formatCurrency(outstanding) : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PO History */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Riwayat Purchase Order
              </CardTitle>
              <div className="flex gap-1">
                {['all', 'ordered', 'received', 'cancelled'].map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Semua' : s === 'ordered' ? 'Menunggu' : s === 'received' ? 'Diterima' : 'Dibatalkan'}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredPurchases.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Belum ada riwayat PO</p>
                  <Button variant="link" onClick={() => navigate({ to: '/purchasing/orders/new' })}>
                    + Buat PO Pertama
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No PO</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status PO</TableHead>
                      <TableHead>Status Bayar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map(po => (
                      <TableRow
                        key={po.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate({ to: '/purchasing/orders/$id', params: { id: po.id } })}
                      >
                        <TableCell className="font-mono text-sm">{po.number}</TableCell>
                        <TableCell className="text-sm">{format(new Date(po.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(Number(po.totalAmount))}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={po.status}
                            map={{
                              ordered: { label: 'Menunggu', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
                              received: { label: 'Diterima', cls: 'bg-green-500/10 text-green-600 border-green-200' },
                              cancelled: { label: 'Dibatalkan', cls: 'bg-slate-500/10 text-slate-500 border-slate-200' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={po.paymentStatus}
                            map={{
                              UNPAID: { label: 'Belum Bayar', cls: 'bg-red-500/10 text-red-600 border-red-200' },
                              PARTIAL: { label: 'Sebagian', cls: 'bg-orange-500/10 text-orange-600 border-orange-200' },
                              PAID: { label: 'Lunas', cls: 'bg-green-500/10 text-green-600 border-green-200' },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm
            key={supplier.id}
            onSubmit={handleUpdate}
            isLoading={updateSupplier.isPending}
            defaultValues={supplier}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus supplier "{supplier.name}" secara permanen.
              Pastikan tidak ada PO aktif yang terhubung ke supplier ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {deleteSupplier.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Generic status badge helper
function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; cls: string }> }) {
  const cfg = map[status] || { label: status, cls: '' }
  return <Badge variant="outline" className={cfg.cls}>{cfg.label}</Badge>
}
