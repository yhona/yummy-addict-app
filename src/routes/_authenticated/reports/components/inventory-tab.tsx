import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventoryStockTab } from './inventory-stock-tab'
import { InventoryMovementTab } from './inventory-movement-tab'
import { InventoryAlertsTab } from './inventory-alerts-tab'

export function InventoryTab() {
  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Laporan Inventori & Stok</h2>
          <p className="text-sm text-muted-foreground">Kelola ketersediaan fisik, pantau pergerakan, dan peringatan batas minimum.</p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="bg-muted text-muted-foreground">
          <TabsTrigger value="stock">Stok Saat Ini</TabsTrigger>
          <TabsTrigger value="movement">Pergerakan Stok</TabsTrigger>
          <TabsTrigger value="alerts">Peringatan Stok</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock" className="mt-4">
          <InventoryStockTab />
        </TabsContent>
        
        <TabsContent value="movement" className="mt-4">
          <InventoryMovementTab />
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-4">
          <InventoryAlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
