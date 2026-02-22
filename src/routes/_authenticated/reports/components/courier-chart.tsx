import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CourierPerformance } from '@/features/reports/api/reports'
import { Package } from 'lucide-react'

interface CourierChartProps {
  data: CourierPerformance[]
}

export function CourierChart({ data }: CourierChartProps) {
  // Map data to Recharts format
  const chartData = data.map(c => ({
    name: c.courier,
    Berhasil: c.delivered,
    'Gagal/Retur': c.returned,
    diproses: c.total - c.delivered - c.returned // In Transit
  }))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Performa Kurir (Dalam Pengiriman)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground italic">
            Belum ada data kurir.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px' }} 
              />
              <Legend />
              <Bar dataKey="Berhasil" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="diproses" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} name="Sedang Diproses" />
              <Bar dataKey="Gagal/Retur" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
