import { ProfitLossResponse } from '@/features/reports/api/reports'
import { Card, CardContent } from '@/components/ui/card'

interface MarginIndicatorProps {
  data: ProfitLossResponse | undefined
}

export function MarginIndicator({ data }: MarginIndicatorProps) {
  if (!data) return null

  const getMarginColor = (margin: number) => {
    if (margin > 20) return 'text-green-500 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
    if (margin >= 10) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-500 dark:bg-yellow-950/30 dark:border-yellow-800'
    return 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className={`border shadow-sm ${getMarginColor(data.gross_margin_percent)}`}>
        <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
            Gross Margin
          </p>
          <p className="text-3xl font-bold">
            {data.gross_margin_percent.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card className={`border shadow-sm ${getMarginColor(data.net_margin_percent)}`}>
        <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
            Net Margin
          </p>
          <p className="text-3xl font-bold">
            {data.net_margin_percent.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
