import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Package } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useWarehouses, useWarehouseStock, useTransferStock } from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/transfer/new')({
  component: NewTransferPage,
})

function NewTransferPage() {
  const navigate = useNavigate()

  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [notes, setNotes] = useState('')

  const { data: warehouses } = useWarehouses()
  const { data: sourceStock } = useWarehouseStock(fromWarehouseId)
  const transferStock = useTransferStock()

  // Only sellable + active warehouses
  const sellableWarehouses = useMemo(
    () => (warehouses ?? []).filter((wh: any) => wh.type !== 'rejected' && wh.isActive),
    [warehouses]
  )

  // Products available in source warehouse
  const availableProducts = useMemo(
    () => (sourceStock ?? []).filter((s: any) => s.quantity > 0),
    [sourceStock]
  )

  // Selected product info
  const selectedProduct = availableProducts.find((s: any) => s.productId === productId)
  const maxQty = selectedProduct?.quantity ?? 0

  // Destination stock for preview
  const { data: destStock } = useWarehouseStock(toWarehouseId)
  const destProductStock = useMemo(
    () => (destStock ?? []).find((s: any) => s.productId === productId),
    [destStock, productId]
  )

  const destQty = destProductStock?.quantity ?? 0

  const canSubmit = fromWarehouseId && toWarehouseId && productId && quantity > 0 && quantity <= maxQty && fromWarehouseId !== toWarehouseId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit) return

    try {
      await transferStock.mutateAsync({
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        notes: notes || undefined,
      })
      toast.success('Transfer stok berhasil!')
      navigate({ to: '/inventory/transfer' })
    } catch {
      toast.error('Gagal melakukan transfer stok')
    }
  }

  // Reset product when warehouse changes
  const handleFromWarehouseChange = (id: string) => {
    setFromWarehouseId(id)
    setProductId('')
    setQuantity(0)
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/inventory/transfer' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Transfer Stok Baru</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Transfer Stok Baru</h2>
          <p className="text-muted-foreground">Pindahkan stok barang dari satu gudang ke gudang lainnya</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* STEP 1: Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Pilih Produk & Gudang Asal</CardTitle>
              <CardDescription>Pilih gudang asal, lalu pilih produk yang akan ditransfer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Gudang Asal *</Label>
                <Select value={fromWarehouseId} onValueChange={handleFromWarehouseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gudang asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellableWarehouses.map((wh: any) => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name} ({wh.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fromWarehouseId && (
                <div className="space-y-2">
                  <Label>Produk *</Label>
                  <Select value={productId} onValueChange={(v) => { setProductId(v); setQuantity(0) }}>
                    <SelectTrigger>
                      <SelectValue placeholder={availableProducts.length === 0 ? 'Tidak ada stok di gudang ini' : 'Pilih produk'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((s: any) => (
                        <SelectItem key={s.productId} value={s.productId}>
                          {s.product?.sku} — {s.product?.name} (Stok: {s.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedProduct && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Stok tersedia: <span className="font-bold text-foreground">{maxQty} pcs</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 2: Destination */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Tujuan & Jumlah</CardTitle>
              <CardDescription>Pilih gudang tujuan dan masukkan jumlah yang akan dipindahkan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Gudang Tujuan *</Label>
                <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gudang tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellableWarehouses
                      .filter((wh: any) => wh.id !== fromWarehouseId)
                      .map((wh: any) => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name} ({wh.code})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {fromWarehouseId === toWarehouseId && toWarehouseId && (
                  <p className="text-xs text-destructive">Gudang asal dan tujuan tidak boleh sama</p>
                )}
              </div>

              {toWarehouseId && productId && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Stok di gudang tujuan saat ini: <span className="font-bold text-foreground">{destQty} pcs</span>
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Jumlah Transfer *</Label>
                <Input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder={`Maksimal ${maxQty}`}
                />
                {quantity > maxQty && (
                  <p className="text-xs text-destructive">Qty melebihi stok tersedia ({maxQty})</p>
                )}
              </div>

              {/* Preview */}
              {productId && quantity > 0 && toWarehouseId && (
                <div className="rounded-md border p-4 space-y-2">
                  <p className="text-sm font-medium mb-3">Preview Perubahan:</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-28">Gudang Asal:</span>
                    <span>{maxQty}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={quantity <= maxQty ? 'text-red-500 font-medium' : 'text-destructive font-bold'}>
                      {maxQty - quantity}
                    </span>
                    <span className="text-red-500 text-xs">(-{quantity})</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-28">Gudang Tujuan:</span>
                    <span>{destQty}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-green-500 font-medium">{destQty + quantity}</span>
                    <span className="text-green-500 text-xs">(+{quantity})</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea
                  placeholder="Alasan transfer, keterangan tambahan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" disabled={!canSubmit || transferStock.isPending}>
              {transferStock.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Sekarang
            </Button>
            <Button type="button" variant="outline"
              onClick={() => navigate({ to: '/inventory/transfer' })}>
              Batal
            </Button>
          </div>
        </form>
      </Main>
    </>
  )
}
