import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface TopProductsProps {
  data: { rank: number, product_name: string, qty_sold: number, revenue: number }[]
}

export function TopProducts({ data }: TopProductsProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top 5 Produk (Volume)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground italic">
            Belum ada penjualan.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((product) => (
              <div key={product.rank} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    product.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    product.rank === 2 ? 'bg-slate-200 text-slate-700' :
                    product.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {product.rank}
                  </div>
                  <div>
                    <p className="font-medium leading-none">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">{product.qty_sold} terjual</p>
                  </div>
                </div>
                <div className="font-medium">
                  {formatCurrency(product.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
