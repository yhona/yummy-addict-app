import { createFileRoute } from '@tanstack/react-router'
import { InventoryTab } from './components/inventory-tab'
import { ReportsLayout } from './components/reports-layout'

export const Route = createFileRoute('/_authenticated/reports/inventory')({
  component: InventoryReportPage,
})

function InventoryReportPage() {
  return (
    <ReportsLayout 
      title="Laporan Inventori & Stok" 
      description="Kelola ketersediaan fisik, pantau pergerakan, dan peringatan batas minimum."
    >
      <div className="pt-6">
        <InventoryTab />
      </div>
    </ReportsLayout>
  )
}
