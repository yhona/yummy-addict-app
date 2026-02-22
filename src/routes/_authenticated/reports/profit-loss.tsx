import { createFileRoute, useSearch } from '@tanstack/react-router'
import { FinanceTab } from './components/finance-tab'
import { ReportsLayout, type ReportSearchParams } from './components/reports-layout'

export const Route = createFileRoute('/_authenticated/reports/profit-loss')({
  component: ProfitLossReportPage,
})

function ProfitLossReportPage() {
  const search = useSearch({ strict: false }) as ReportSearchParams
  
  return (
    <ReportsLayout 
      title="Laporan Laba Rugi (P&L)" 
      description="Evaluasi kesehatan arus kas dan indikator margin dari setiap komponen bisnis Anda."
    >
      <div className="pt-6">
        <FinanceTab 
          startDate={search.startDate}
          endDate={search.endDate}
        />
      </div>
    </ReportsLayout>
  )
}
