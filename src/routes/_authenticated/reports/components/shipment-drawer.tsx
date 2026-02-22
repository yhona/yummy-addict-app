import { ShipmentItem } from '@/features/reports/api/reports'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Copy, MapPin, Truck, CheckCircle2, PackageSearch, ExternalLink } from 'lucide-react'

interface ShipmentDrawerProps {
  shipment: ShipmentItem | null
  onClose: () => void
}

export function ShipmentDrawer({ shipment, onClose }: ShipmentDrawerProps) {
  
  const copyResi = () => {
    if (shipment?.tracking_number) {
      navigator.clipboard.writeText(shipment.tracking_number)
      // A toast could go here
    }
  }

  return (
    <Sheet open={!!shipment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Detail Pengiriman
          </SheetTitle>
          <SheetDescription>
            Riwayat logistik untuk transaksi penerima.
          </SheetDescription>
        </SheetHeader>

        {shipment && (
          <div className="space-y-6">
            
            {/* Resi & Status */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nomor Resi</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">
                      {shipment.tracking_number || 'TRX-UNKNOWN'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyResi}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Badge className={
                    shipment.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    shipment.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                    shipment.status === 'PROCESSED' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                  {shipment.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kurir</span>
                <span className="font-medium">{shipment.courier} ({shipment.service_type})</span>
              </div>
            </div>

            <Separator />

            {/* Recipient */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Informasi Penerima
              </h4>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground">Nama:</span>
                  <span className="col-span-2 font-medium">{shipment.recipient_name || 'Pelanggan'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground">Lokasi:</span>
                  <span className="col-span-2">{shipment.recipient_address || '-'}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Detail Biaya</h4>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-sm space-y-2 border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Berat Terukur</span>
                  <span className="font-medium">{shipment.weight_kg} Kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Biaya Ongkir</span>
                  <span className="font-medium">{formatCurrency(Number(shipment.shipping_cost))}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="text-muted-foreground">Tanggungan Pihak</span>
                  <Badge variant="outline">
                    {shipment.charged_to === 'store' ? 'Toko' : 'Pembeli'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tracking Timeline Mock */}
            <div className="space-y-4 pt-4">
              <h4 className="font-semibold text-sm">Log Perjalanan Waktu</h4>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                
                {shipment.status === 'DELIVERED' && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 px-2 py-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Paket Diterima</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(shipment.delivered_date || shipment.order_date), 'dd MMM yvyy, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {(shipment.status === 'DELIVERED' || shipment.status === 'IN_TRANSIT') && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Truck className="h-3 w-3" />
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 px-2 py-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Pesanan dibawa Kurir</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(new Date(shipment.order_date).getTime() + 86400000), 'dd MMM yvyy, 09:00')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <PackageSearch className="h-3 w-3" />
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 px-2 py-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">Pesanan Diproses / Pickup</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(shipment.order_date), 'dd MMM yvyy, HH:mm')}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-6">
              <Button className="w-full" variant="outline" onClick={() => window.open(`https://cekresi.com/?noresi=${shipment.tracking_number}`, '_blank')}>
                Cek Asli Website Kurir
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
