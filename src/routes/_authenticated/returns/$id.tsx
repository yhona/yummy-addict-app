import { createFileRoute, Link } from '@tanstack/react-router'
import { useReturn } from '@/features/returns/api/returns'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, RotateCcw, Printer } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/returns/$id')({
  component: ReturnDetailPage,
})

function ReturnDetailPage() {
  const { id } = Route.useParams()
  const { data: ret, isLoading } = useReturn(id)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ret) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Return not found
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/returns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <RotateCcw className="h-6 w-6" />
              {ret.number}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(ret.date), 'MMMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[ret.status] || ''} variant="outline">
            {ret.status}
          </Badge>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Return Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Original Transaction</p>
                <p className="font-mono font-medium">{ret.transaction?.number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processed By</p>
                <p className="font-medium">{ret.processedByUser?.name || '-'}</p>
              </div>
            </div>
            
            {ret.reason && (
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p>{ret.reason}</p>
              </div>
            )}

            {ret.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{ret.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{ret.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Qty</span>
                <span>{ret.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-medium">
                <span>Total Refund</span>
                <span>{formatCurrency(Number(ret.totalAmount))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Returned Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Product</th>
                <th className="p-3 text-left font-medium">SKU</th>
                <th className="p-3 text-right font-medium">Price</th>
                <th className="p-3 text-right font-medium">Qty</th>
                <th className="p-3 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {ret.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.product.name}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.product.sku}</td>
                  <td className="p-3 text-right">{formatCurrency(Number(item.price))}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
