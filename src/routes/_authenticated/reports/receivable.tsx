import { createFileRoute } from '@tanstack/react-router'
import { DebtsTab } from './components/debts-tab'
import { ReportsLayout } from './components/reports-layout'

export const Route = createFileRoute('/_authenticated/reports/receivable')({
  component: ReceivableReportPage,
})

function ReceivableReportPage() {
  return (
    <ReportsLayout 
      title="Laporan Piutang Pelanggan (Receivable)" 
      description="Daftar tagihan yang belum dibayar oleh pelanggan B2B Anda."
    >
      <div className="pt-6">
        <DebtsTab />
      </div>
    </ReportsLayout>
  )
}
