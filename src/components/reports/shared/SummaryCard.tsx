import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SummaryCardProps {
  label: string
  value: number
  type: 'currency' | 'number' | 'percent'
  change_percent?: number
  color?: 'positive' | 'negative' | 'neutral'
  isLoading?: boolean
}

export function SummaryCard({
  label,
  value,
  type,
  change_percent,
  color = 'neutral',
  isLoading = false,
}: SummaryCardProps) {
  // Determine value formatting
  const formattedValue = () => {
    switch (type) {
      case 'currency':
        return formatCurrency(value)
      case 'percent':
        return `${value.toFixed(2)}%`
      case 'number':
      default:
        return new Intl.NumberFormat('id-ID').format(value)
    }
  }

  // Determine indicator UI
  const isPositive = (change_percent || 0) > 0
  const isNegative = (change_percent || 0) < 0
  const isNeutral = (change_percent || 0) === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : (
          <>
            <div className={`text-2xl font-bold ${
              color === 'positive' ? 'text-green-600 dark:text-green-500' :
              color === 'negative' ? 'text-red-600 dark:text-red-500' : ''
            }`}>
              {formattedValue()}
            </div>
            {change_percent !== undefined && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                isPositive ? 'text-green-600' :
                isNegative ? 'text-red-600' : 'text-slate-500'
              }`}>
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                {isNeutral && <Minus className="h-3 w-3" />}
                {isPositive ? '▲' : isNegative ? '▼' : ''} {Math.abs(change_percent)}% vs periode lalu
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
