import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useReceivableReport, usePayableReport, AgingReportItem } from '@/features/reports/api/reports'
import { DataTable } from '@/components/reports/shared/DataTable'
import { SummaryCard } from '@/components/reports/shared/SummaryCard'
import { ExportButton } from '@/components/reports/shared/ExportButton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatCurrency } from '@/lib/utils'

export function DebtsTab() {
  const [view, setView] = useState<'receivable' | 'payable'>('receivable')
  
  // Fetch both so tab switching is fast (enabled selectively or cached)
  const { data: recData, isLoading: recLoading } = useReceivableReport()
  const { data: payData, isLoading: payLoading } = usePayableReport()

  const currentData = view === 'receivable' ? recData?.data : payData?.data
  const isLoading = view === 'receivable' ? recLoading : payLoading

  // Aggregate KPI Calculations
  const totalOutstanding = currentData?.reduce((acc, curr) => acc + Number(curr.outstanding), 0) || 0
  const over90Days = currentData?.reduce((acc, curr) => acc + Number(curr.aging_over_90), 0) || 0
  
  // Base Column Definitions
  const columns: ColumnDef<AgingReportItem>[] = [
    {
      accessorKey: view === 'receivable' ? 'customer_name' : 'supplier_name',
      header: view === 'receivable' ? 'Pelanggan' : 'Supplier',
      cell: ({ row }) => (
        <div className="font-semibold">{row.original.customer_name || row.original.supplier_name}</div>
      ),
    },
    {
      accessorKey: 'total_debt',
      header: 'Total Tagihan',
      cell: ({ row }) => formatCurrency(Number(row.original.total_debt)),
    },
    {
      accessorKey: 'paid',
      header: 'Sudah Dibayar',
      cell: ({ row }) => <span className="text-green-600">{formatCurrency(Number(row.original.paid))}</span>,
    },
    {
      accessorKey: 'outstanding',
      header: 'Kekurangan',
      cell: ({ row }) => <span className="font-bold text-red-600">{formatCurrency(Number(row.original.outstanding))}</span>,
    },
    {
      accessorKey: 'aging_0_30',
      header: '0 - 30 Hari',
      cell: ({ row }) => Number(row.original.aging_0_30) > 0 ? formatCurrency(Number(row.original.aging_0_30)) : '-',
    },
    {
      accessorKey: 'aging_31_60',
      header: '31 - 60 Hari',
      cell: ({ row }) => Number(row.original.aging_31_60) > 0 ? (
        <span className="text-yellow-600 font-medium">{formatCurrency(Number(row.original.aging_31_60))}</span>
      ) : '-',
    },
    {
      accessorKey: 'aging_61_90',
      header: '61 - 90 Hari',
      cell: ({ row }) => Number(row.original.aging_61_90) > 0 ? (
        <span className="text-orange-600 font-bold">{formatCurrency(Number(row.original.aging_61_90))}</span>
      ) : '-',
    },
    {
      accessorKey: 'aging_over_90',
      header: '> 90 Hari',
      cell: ({ row }) => Number(row.original.aging_over_90) > 0 ? (
        <span className="text-red-600 font-bold underline decoration-red-300 underline-offset-2">{formatCurrency(Number(row.original.aging_over_90))}</span>
      ) : '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status?.toUpperCase() || 'UNPAID'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === 'PARTIAL' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
          }`}>
            {status}
          </span>
        )
      },
    },
  ]

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting ${view} data directly as ${format}.`)
    // Native export dummy logic
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <ToggleGroup 
          type="single" 
          value={view} 
          onValueChange={(v: string) => v && setView(v as 'receivable' | 'payable')}
          className="bg-muted p-1 rounded-md"
        >
          <ToggleGroupItem value="receivable" className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-4">
            Piutang Pelanggan
          </ToggleGroupItem>
          <ToggleGroupItem value="payable" className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-4">
            Hutang Supplier
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-2">
          <ExportButton onExport={handleExport} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard 
          label={view === 'receivable' ? 'Total Piutang Berjalan' : 'Total Hutang Berjalan'}
          value={totalOutstanding}
          type="currency"
          isLoading={isLoading}
        />
        <SummaryCard 
          label="Tagihan > 90 Hari (Macet)"
          value={over90Days}
          type="currency"
          color="negative"
          isLoading={isLoading}
        />
        <SummaryCard 
          label="Jumlah Entitas (Orang/Toko)"
          value={currentData?.length || 0}
          type="number"
          isLoading={isLoading}
        />
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns}
        data={currentData || []}
        isLoading={isLoading}
        searchable={false} // can enable easily
      />
    </div>
  )
}
