import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Loader2, Warehouse } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateOpname, useWarehouses } from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/opname/new')({
  component: NewOpnamePage,
})

function NewOpnamePage() {
  const navigate = useNavigate()
  const [warehouseId, setWarehouseId] = useState('')
  const [notes, setNotes] = useState('')

  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses()
  const createOpname = useCreateOpname()

  const sellableWarehouses = (warehouses ?? []).filter((wh: any) => wh.type !== 'rejected' && wh.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!warehouseId) {
      toast.error('Pilih gudang terlebih dahulu')
      return
    }

    try {
      const result = await createOpname.mutateAsync({
        warehouseId,
        notes: notes || undefined,
      })
      toast.success(`Sesi opname ${result.number} berhasil dibuat!`)
      navigate({ to: '/inventory/opname/$id', params: { id: result.id } })
    } catch {
      toast.error('Gagal membuat sesi opname')
    }
  }

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Mulai Opname Baru</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Buat Sesi Opname Baru</h2>
          <p className="text-muted-foreground">
            Pilih gudang untuk memulai penghitungan fisik. Sistem akan otomatis memasukkan semua produk aktif beserta stok tercatat.
          </p>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Detail Opname
            </CardTitle>
            <CardDescription>
              Semua produk aktif di gudang yang dipilih akan secara otomatis dimuat ke dalam sesi opname.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Gudang *</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder={loadingWarehouses ? 'Memuat gudang...' : 'Pilih gudang'} />
                  </SelectTrigger>
                  <SelectContent>
                    {sellableWarehouses.map((wh: any) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Contoh: Opname bulanan Januari 2026..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createOpname.isPending || !warehouseId}>
                  {createOpname.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Buat & Mulai Hitung
                </Button>
                <Button type="button" variant="outline"
                  onClick={() => navigate({ to: '/inventory/opname' })}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
