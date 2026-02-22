import { ProfitLossResponse } from '@/features/reports/api/reports'
import { formatCurrency } from '@/lib/utils'

interface PLWaterfallProps {
  data: ProfitLossResponse | undefined
}

export function PLWaterfall({ data }: PLWaterfallProps) {
  if (!data) return null

  // Helper calculation to normalize the waterfall widths relatively (Revenue = 100%)
  const maxVal = data.gross_revenue || 1
  const getWidth = (val: number) => `${Math.max(2, (Math.abs(val) / maxVal) * 100)}%`

  const renderRow = (label: string, value: number, type: 'revenue' | 'expense' | 'total', isIndent = false) => {
    let barColor = 'bg-slate-300'
    let textColor = 'text-foreground'
    let symbol = ''

    if (type === 'revenue' || type === 'total') {
      barColor = 'bg-green-500'
      if (value > 0 && type !== 'total') symbol = '(+)'
    } else if (type === 'expense') {
      barColor = 'bg-red-500'
      textColor = 'text-red-500'
      symbol = '(-)'
    }

    const isFinal = label === 'LABA BERSIH'

    return (
      <div className={`flex flex-col sm:flex-row sm:items-center py-3 border-b border-border/50 ${isFinal ? 'bg-green-50/50 dark:bg-green-950/20 font-bold border-t-2 border-t-border' : ''}`}>
        {/* Label & Amount */}
        <div className={`flex items-center justify-between sm:w-1/3 sm:pr-4 ${isIndent ? 'pl-6' : ''}`}>
          <span className={`text-sm ${isFinal ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>{label}</span>
          <span className={`text-sm font-medium ${textColor} ${isFinal ? 'text-green-700 dark:text-green-400 text-lg' : ''}`}>
             {symbol} {formatCurrency(Math.abs(value))}
          </span>
        </div>
        
        {/* Visual Progress Bar Wrapper */}
        <div className="flex-1 mt-2 sm:mt-0 hidden sm:flex items-center">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${barColor} transition-all duration-500`} 
              style={{ width: getWidth(value) }} 
            />
          </div>
          <span className="ml-3 text-xs w-12 text-right text-muted-foreground tabular-nums">
            {((Math.abs(value) / maxVal) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-1">
      {renderRow('Pendapatan Kotor', data.gross_revenue, 'revenue')}
      {renderRow('Diskon', data.discount, 'expense', true)}
      {renderRow('Retur Penjualan', data.returns, 'expense', true)}
      
      {renderRow('Pendapatan Bersih', data.net_revenue, 'total')}
      
      {renderRow('Harga Pokok Penjualan (HPP)', data.cogs, 'expense')}
      
      {renderRow('Laba Kotor', data.gross_profit, 'total')}
      
      {renderRow('Biaya Operasional', data.total_operational_expenses, 'expense')}
      {renderRow('Pendapatan Lain', data.other_income, 'revenue')}
      
      {renderRow('Laba Operasional (EBIT)', data.ebit, 'total')}
      
      {renderRow('Pajak', data.tax, 'expense')}
      
      {renderRow('LABA BERSIH', data.net_profit, 'total')}
    </div>
  )
}
