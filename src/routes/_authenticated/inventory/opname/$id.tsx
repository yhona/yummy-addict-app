import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle2, Loader2, Search, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useOpname, useUpdateOpnameItems, useFinalizeOpname } from '@/features/inventory/api'
import type { OpnameItem } from '@/features/inventory/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/opname/$id')({
  component: OpnameDetailPage,
})

function OpnameDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)

  const { data: opname, isLoading } = useOpname(id)
  const updateItems = useUpdateOpnameItems(id)
  const finalizeOpname = useFinalizeOpname(id)

  // ── Inline save on blur ──────────────────────

  const handleQtyBlur = useCallback(async (item: OpnameItem, value: string) => {
    const physicalQty = parseInt(value)
    if (isNaN(physicalQty) || physicalQty < 0) return
    if (physicalQty === item.physicalQty) return // no change

    try {
      await updateItems.mutateAsync({
        items: [{ id: item.id, physicalQty, notes: item.notes || undefined }],
      })
    } catch {
      toast.error('Gagal menyimpan qty fisik')
    }
  }, [updateItems])

  const handleNotesBlur = useCallback(async (item: OpnameItem, value: string) => {
    if (value === (item.notes || '')) return // no change
    if (item.physicalQty === null) return // can't save notes without qty

    try {
      await updateItems.mutateAsync({
        items: [{ id: item.id, physicalQty: item.physicalQty!, notes: value || undefined }],
      })
    } catch {
      toast.error('Gagal menyimpan catatan')
    }
  }, [updateItems])

  // ── Finalize ─────────────────────────────────

  const handleFinalize = async () => {
    try {
      const result = await finalizeOpname.mutateAsync()
      toast.success(
        `Opname selesai! ${result.summary.adjustedItems} item disesuaikan. +${result.summary.totalAdded} / -${result.summary.totalSubtracted}`
      )
      setShowFinalizeDialog(false)
    } catch {
      toast.error('Gagal memfinalisasi opname')
    }
  }

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <h1 className="text-lg font-semibold">Detail Opname</h1>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Main>
      </>
    )
  }

  if (!opname) {
    return (
      <>
        <Header fixed>
          <h1 className="text-lg font-semibold">Detail Opname</h1>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <p className="text-center text-muted-foreground py-20">Sesi opname tidak ditemukan</p>
        </Main>
      </>
    )
  }

  const items: OpnameItem[] = opname.items ?? []
  const progress = opname.totalItems > 0 ? (opname.countedItems / opname.totalItems) * 100 : 0
  const allCounted = opname.countedItems === opname.totalItems && opname.totalItems > 0
  const isFinalized = opname.status === 'finalized'

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (!item.productSku?.toLowerCase().includes(term) && !item.productName?.toLowerCase().includes(term)) {
        return false
      }
    }
    // Filter mode
    switch (filterMode) {
      case 'uncounted': return item.physicalQty === null
      case 'different': return item.difference !== null && item.difference !== 0
      case 'match': return item.difference === 0
      default: return true
    }
  })

  // Items with difference for finalize dialog
  const itemsWithDiff = items.filter(i => i.difference !== null && i.difference !== 0)

  const statusBadge = () => {
    switch (opname.status) {
      case 'draft':
        return <Badge className="bg-slate-500/10 text-slate-500">Draft</Badge>
      case 'counting':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Sedang Dihitung</Badge>
      case 'finalized':
        return <Badge className="bg-green-500/10 text-green-500">Selesai</Badge>
      default:
        return <Badge variant="outline">{opname.status}</Badge>
    }
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/inventory/opname' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">{opname.number}</h1>
        <div className="ml-2">{statusBadge()}</div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* Header Info */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{opname.number}</h2>
            <p className="text-muted-foreground">
              Gudang: <span className="font-medium text-foreground">{opname.warehouseName}</span>
              {' · '}
              Dibuat: {format(new Date(opname.createdAt), 'dd MMM yyyy HH:mm')}
              {opname.finalizedAt && (
                <> {' · '} Selesai: {format(new Date(opname.finalizedAt), 'dd MMM yyyy HH:mm')}</>
              )}
            </p>
          </div>

          {!isFinalized && allCounted && (
            <Button onClick={() => setShowFinalizeDialog(true)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finalisasi Opname
            </Button>
          )}
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progres Hitung: {opname.countedItems} / {opname.totalItems} item
              </span>
              <span className="text-sm text-muted-foreground">
                {opname.itemsWithDifference > 0 && (
                  <span className="text-red-500 font-medium mr-3">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    {opname.itemsWithDifference} item selisih
                  </span>
                )}
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari SKU atau nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterMode} onValueChange={setFilterMode}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua ({items.length})</SelectItem>
              <SelectItem value="uncounted">Belum Dihitung ({items.filter(i => i.physicalQty === null).length})</SelectItem>
              <SelectItem value="different">Ada Selisih ({items.filter(i => i.difference !== null && i.difference !== 0).length})</SelectItem>
              <SelectItem value="match">Sesuai ({items.filter(i => i.difference === 0).length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead className="text-center w-[100px]">Stok Sistem</TableHead>
                <TableHead className="text-center w-[120px]">Stok Fisik</TableHead>
                <TableHead className="text-center w-[100px]">Selisih</TableHead>
                <TableHead className="w-[200px]">Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || filterMode !== 'all' ? 'Tidak ada item sesuai filter' : 'Tidak ada item'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.productSku}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      {isFinalized ? (
                        <span className="font-medium">{item.physicalQty ?? '—'}</span>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-20 text-center mx-auto"
                          defaultValue={item.physicalQty ?? ''}
                          placeholder="—"
                          onBlur={(e) => handleQtyBlur(item, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <DifferenceDisplay difference={item.difference} />
                    </TableCell>
                    <TableCell>
                      {isFinalized ? (
                        <span className="text-xs text-muted-foreground">{item.notes || '—'}</span>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          defaultValue={item.notes || ''}
                          placeholder="Catatan..."
                          onBlur={(e) => handleNotesBlur(item, e.target.value)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Finalization Dialog */}
        <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Konfirmasi Finalisasi</DialogTitle>
              <DialogDescription>
                {itemsWithDiff.length > 0
                  ? `${itemsWithDiff.length} item akan disesuaikan stoknya secara otomatis.`
                  : 'Semua stok fisik sesuai dengan stok sistem. Tidak ada penyesuaian yang diperlukan.'}
              </DialogDescription>
            </DialogHeader>

            {itemsWithDiff.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Sistem</TableHead>
                      <TableHead className="text-center">Fisik</TableHead>
                      <TableHead className="text-center">Selisih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsWithDiff.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.productName}</TableCell>
                        <TableCell className="text-center">{item.systemQty}</TableCell>
                        <TableCell className="text-center">{item.physicalQty}</TableCell>
                        <TableCell className="text-center">
                          <DifferenceDisplay difference={item.difference} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>
                Batalkan
              </Button>
              <Button onClick={handleFinalize} disabled={finalizeOpname.isPending}
                className="bg-green-600 hover:bg-green-700">
                {finalizeOpname.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalisasi & Terapkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  )
}

// ── Helper Component ───────────────────────────

function DifferenceDisplay({ difference }: { difference: number | null }) {
  if (difference === null) {
    return <span className="text-muted-foreground text-xs">Belum</span>
  }
  if (difference === 0) {
    return <span className="text-green-500 font-medium">✓</span>
  }
  if (difference > 0) {
    return <span className="text-green-500 font-medium">+{difference}</span>
  }
  return <span className="text-red-500 font-medium">{difference}</span>
}
