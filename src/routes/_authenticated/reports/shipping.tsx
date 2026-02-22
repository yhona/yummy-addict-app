import { createFileRoute } from '@tanstack/react-router'
import { ShippingTab } from './components/shipping-tab'
import { ReportsLayout } from './components/reports-layout'

export const Route = createFileRoute('/_authenticated/reports/shipping')({
  component: ShippingReportPage,
})

function ShippingReportPage() {
  return (
    <ReportsLayout 
      title="Laporan Pengiriman Ekspedisi" 
      description="Evaluasi biaya ongkir, rasio asuransi, dan kinerja kurir pengiriman."
    >
      <div className="pt-6">
        <ShippingTab />
      </div>
    </ReportsLayout>
  )
}
