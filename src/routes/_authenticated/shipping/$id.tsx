import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useShipment, useUpdateShipment } from '@/features/shipping/api/shipping'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowLeft, Loader2, AlertCircle, Package, MapPin, Phone, User,
  Truck, ExternalLink, Save
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/shipping/$id')({
  component: ShippingDetailPage,
})

// ==========================================
// STATUS CONFIG
// ==========================================

const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  pending: { label: 'Perlu Diproses', className: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: '📦' },
  shipped: { label: 'Dalam Perjalanan', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: '🚚' },
  delivered: { label: 'Diterima', className: 'bg-green-500/10 text-green-600 border-green-200', icon: '✅' },
  returned: { label: 'Retur', className: 'bg-red-500/10 text-red-600 border-red-200', icon: '↩️' },
  failed: { label: 'Gagal', className: 'bg-red-500/10 text-red-600 border-red-200', icon: '❌' },
}

// Tracking URL mapping
const trackingUrls: Record<string, string> = {
  JNE: 'https://www.jne.co.id/id/tracking/trace',
  'J&T': 'https://jet.co.id/track',
  SICEPAT: 'https://www.sicepat.com/checkAwb',
  ANTERAJA: 'https://anteraja.id/tracking',
}

function getTrackingUrl(courierName?: string, trackingNumber?: string): string | null {
  if (!trackingNumber) return null
  const upperCourier = (courierName || '').toUpperCase()
  for (const [key, url] of Object.entries(trackingUrls)) {
    if (upperCourier.includes(key)) return url
  }
  return `https://www.google.com/search?q=tracking+${trackingNumber}`
}

// ==========================================
// MAIN COMPONENT
// ==========================================

function ShippingDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const { data: shipment, isLoading } = useShipment(id)
  const updateMutation = useUpdateShipment()

  // Form state
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)

  // Status dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')

  // Initialize form values when data loads
  if (shipment && !formInitialized) {
    setCourierName(shipment.courierName || '')
    setTrackingNumber(shipment.trackingNumber || '')
    setShippingCost(String(shipment.shippingCost || ''))
    setFormInitialized(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Pengiriman tidak ditemukan</h2>
        <Button variant="outline" onClick={() => navigate({ to: '/shipping' })}>
          ← Kembali
        </Button>
      </div>
    )
  }

  const cfg = statusConfig[shipment.shippingStatus] || statusConfig.pending
  const trackingUrl = getTrackingUrl(shipment.courierName, shipment.trackingNumber)

  const handleSaveInfo = () => {
    updateMutation.mutate({
      id,
      data: {
        courierName: courierName || undefined,
        trackingNumber: trackingNumber || undefined,
        shippingCost: shippingCost ? Number(shippingCost) : undefined,
      },
    }, {
      onSuccess: () => toast.success('Info pengiriman berhasil disimpan'),
      onError: (e: any) => toast.error(e.message || 'Gagal menyimpan'),
    })
  }

  const handleUpdateStatus = () => {
    if (!newStatus) return
    updateMutation.mutate({
      id,
      data: {
        shippingStatus: newStatus as any,
        statusNote: statusNote || undefined,
      },
    }, {
      onSuccess: () => {
        toast.success('Status pengiriman berhasil diupdate')
        setShowStatusDialog(false)
        setNewStatus('')
        setStatusNote('')
      },
      onError: (e: any) => toast.error(e.message || 'Gagal update status'),
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/shipping' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengiriman #{shipment.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {shipment.customerName} — {format(new Date(shipment.orderDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`px-3 py-1 text-sm ${cfg.className}`}>
          {cfg.icon} {cfg.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ========== LEFT COLUMN ========== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Info Pesanan */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Info Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">No Order</p>
                  <p className="font-mono font-semibold">{shipment.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Order</p>
                  <p className="font-medium">{format(new Date(shipment.orderDate), 'dd MMMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Pesanan</p>
                  <p className="font-semibold">{formatCurrency(shipment.finalAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Metode</p>
                  <Badge variant="secondary">{shipment.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</Badge>
                </div>
              </div>

              {shipment.items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipment.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.sku}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Card: Info Penerima */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Info Penerima
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{shipment.customerName || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{shipment.customerPhone || '—'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">{shipment.customerAddress || '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========== RIGHT COLUMN ========== */}
        <div className="space-y-6">
          {/* Card: Status Pengiriman */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>Status Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="text-center">
                <Badge variant="outline" className={`px-4 py-2 text-base ${cfg.className}`}>
                  {cfg.icon} {cfg.label}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                {shipment.statusHistory.map((h, idx) => {
                  const hcfg = statusConfig[h.status] || statusConfig.pending
                  return (
                    <div key={idx} className="flex items-start gap-3 relative pl-6 pb-4 last:pb-0">
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${
                        idx === shipment.statusHistory.length - 1
                          ? 'bg-primary border-primary'
                          : 'bg-muted border-muted-foreground/30'
                      }`} />
                      {idx < shipment.statusHistory.length - 1 && (
                        <div className="absolute left-[7px] top-5 w-0.5 h-full bg-muted-foreground/20" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{hcfg.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(h.date), 'dd MMM yyyy HH:mm')}
                        </p>
                        {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {shipment.shippingStatus !== 'delivered' && shipment.shippingStatus !== 'returned' && (
                <Button className="w-full" onClick={() => setShowStatusDialog(true)}>
                  Update Status
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card: Info Kurir & Resi */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" /> Info Kurir & Resi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Nama Kurir</Label>
                <Input
                  placeholder="Contoh: JNE, J&T, SiCepat"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>No Resi</Label>
                <Input
                  placeholder="Masukkan no resi"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ongkos Kirim</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleSaveInfo} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Simpan Perubahan
              </Button>

              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline pt-2"
                >
                  <ExternalLink className="h-4 w-4" /> Lacak di website kurir →
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== UPDATE STATUS DIALOG ========== */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Pengiriman</DialogTitle>
            <DialogDescription>
              Pilih status baru untuk pengiriman #{shipment.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status Baru *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipped">🚚 Dikirim</SelectItem>
                  <SelectItem value="delivered">✅ Diterima</SelectItem>
                  <SelectItem value="returned">↩️ Retur</SelectItem>
                  <SelectItem value="failed">❌ Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                placeholder="Catatan perubahan status..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Batal</Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
