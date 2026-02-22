import { useProfitLossReport } from '@/features/reports/api/reports'
import { PLWaterfall } from './pl-waterfall'
import { ExpenseBreakdown } from './expense-accordion'
import { MarginIndicator } from './margin-indicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Loader2 } from 'lucide-react'
import { ExportButton } from '@/components/reports/shared/ExportButton'
import { formatCurrency } from '@/lib/utils'

interface FinanceTabProps {
  startDate?: string
  endDate?: string
}

export function FinanceTab({ startDate, endDate }: FinanceTabProps) {
  const { data: report, isLoading } = useProfitLossReport({
    startDate,
    endDate
  })

  // Prevent UI flashing if loading
  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const exportData = report ? [
    { metric: 'Penjualan Kotor (Gross Sales)', amount: report.gross_revenue, isHeader: true },
    { metric: 'Diskon Penjualan', amount: report.discount },
    { metric: 'Retur Penjualan', amount: report.returns },
    { metric: 'PENJUALAN BERSIH (Net Sales)', amount: report.net_revenue, isHeader: true },
    { metric: 'Harga Pokok Penjualan (HPP)', amount: report.cogs },
    { metric: 'LABA KOTOR (Gross Profit)', amount: report.gross_profit, isHeader: true },
    { metric: 'Total Biaya Operasional', amount: report.total_operational_expenses },
    { metric: 'Laba Operasional (EBIT)', amount: report.ebit, isHeader: true },
    { metric: 'Pendapatan Lain', amount: report.other_income },
    { metric: 'Pajak & Bunga', amount: report.tax },
    { metric: 'LABA BERSIH (Net Profit)', amount: report.net_profit, isHeader: true },
  ] : []

  const exportColumns = [
    { key: 'metric', label: 'Komponen Finansial' },
    { key: 'amount', label: 'Nominal (Rp)', format: 'currency' as const }
  ]

  const pdfConfig = {
    title: 'Laporan Laba Rugi (P&L)',
    subtitle: `Periode: ${report?.period || '-'}`,
    company_name: 'Desaprima ERP',
    columns: exportColumns.map(c => ({ header: c.label, dataKey: c.key })),
    summary: [
      { label: 'Margin Laba Kotor', value: `${(report?.gross_margin_percent || 0).toFixed(1)}%` },
      { label: 'Margin Laba Bersih', value: `${(report?.net_margin_percent || 0).toFixed(1)}%` },
      { label: 'Total Laba Bersih', value: formatCurrency(report?.net_profit || 0) }
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Laporan Laba Rugi (P&L)</h2>
          <p className="text-sm text-muted-foreground">Periode: {report?.period}</p>
        </div>
        
        <ExportButton 
          filename={`Laporan_Laba_Rugi_${report?.period?.replace(/ /g, '_')}`}
          data={exportData}
          csvColumns={exportColumns}
          pdfConfig={pdfConfig}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Waterfall Container */}
        <div className="md:col-span-8">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Arus Finansial
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <PLWaterfall data={report} />
            </CardContent>
          </Card>
        </div>

        {/* Breakdown & Gauges */}
        <div className="md:col-span-4 space-y-6">
          <MarginIndicator data={report} />
          
          <Card>
            <CardContent className="p-4">
              <ExpenseBreakdown data={report} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
