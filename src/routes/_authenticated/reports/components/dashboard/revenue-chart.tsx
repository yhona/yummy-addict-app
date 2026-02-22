import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface RevenueChartProps {
  data: { date: string, revenue: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map(d => ({
    ...d,
    formattedDate: format(new Date(d.date), 'dd MMM')
  }))

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Tren Pendapatan Harian</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground italic">
            Belum ada data transaksi pada periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="formattedDate" />
              <YAxis 
                tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                labelFormatter={(label) => `Tanggal: ${label}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
