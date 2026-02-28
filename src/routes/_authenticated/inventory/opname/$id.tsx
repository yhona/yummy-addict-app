import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo } from 'react'
import { ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, RefreshCcw } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { useOpnameDetail, useFinalizeOpname } from '@/features/inventory/api/opname'
import { createDetailColumns } from '@/features/inventory/components/opname-detail/columns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export const Route = createFileRoute('/_authenticated/inventory/opname/$id')({
  component: OpnameDetailPage,
})

function OpnameDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)

  const { data: session, isLoading, refetch } = useOpnameDetail(id)
  const finalizeMutation = useFinalizeOpname()

  const isFinalized = session?.status === 'finalized'
  const columns = useMemo(
    () => {
      if (!session) return []
      return createDetailColumns(session.id, isFinalized)
    },
    [session?.id, isFinalized]
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Sesi Opname Tidak Ditemukan</h2>
        <Button className="mt-4" onClick={() => navigate({ to: '/inventory/opname' })}>
          Kembali ke Daftar
        </Button>
      </div>
    )
  }

  const uncounted = session.items.filter((i) => i.physicalQty === null).length
  const isReadyToFinalize = uncounted === 0

  const handleFinalize = () => {
    finalizeMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`Sesi Opname ${session.number} berhasil diselesaikan.`)
        setShowFinalizeDialog(false)
        refetch()
      },
      onError: (error: any) => {
        toast.error(error.message || 'Gagal menyelesaikan opname.')
        setShowFinalizeDialog(false)
      },
    })
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/inventory/opname' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Daftar Opname
        </Button>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{session.number}</h2>
              {isFinalized ? (
                <Badge variant="default" className="bg-emerald-500">Selesai</Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">Proses Hitung</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Gudang: <strong>{session.warehouseName}</strong> • Dibuat:{' '}
              {format(new Date(session.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
            </p>
            {session.notes && (
              <p className="text-sm italic text-muted-foreground mt-2">"{session.notes}"</p>
            )}
          </div>

          {!isFinalized && (
            <Button
              size="lg"
              className={`bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 ${!isReadyToFinalize && 'opacity-50'}`}
              onClick={() => setShowFinalizeDialog(true)}
              disabled={!isReadyToFinalize}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Finalisasi Sesi
            </Button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{session.totalItems} Produk</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sudah Dihitung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{session.countedItems}</div>
              <p className="text-xs text-muted-foreground">{uncounted} belum dihitung</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Selisih Ditemukan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {session.itemsWithDifference} Item
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Banner */}
        {!isFinalized && uncounted > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Masih ada produk yang belum dihitung</h4>
              <p className="text-sm mt-1">Anda harus menghitung seluruh {uncounted} produk tersisa dan mengisi stok fisiknya (meskipun 0) sebelum bisa menekan tombol finalisasi.</p>
            </div>
          </div>
        )}

        {/* Data Grid */}
        <Card className="shadow-none border-t border-b sm:border rounded-none sm:rounded-lg">
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={session.items}
              searchable={true}
              searchKey="productName"
              pagination={false}
            />
          </CardContent>
        </Card>

        {/* Finalize Dialog */}
        <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Selesaikan Opname?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan melakukan finalisasi untuk sesi <strong>{session.number}</strong>. <br />
                Dengan menekan 'Selesaikan', sistem akan menimpa stok barang di gudang sesuai dengan hasil hitung di atas, dan mencatat perubahannya ke riwayat kartu stok selamanya. Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={finalizeMutation.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={(e) => {
                  e.preventDefault()
                  handleFinalize()
                }}
                disabled={finalizeMutation.isPending}
              >
                {finalizeMutation.isPending ? 'Selesai Diproses...' : 'Selesaikan Opname'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
