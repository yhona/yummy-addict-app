import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useReturns } from '@/features/returns/api/returns'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Eye, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { CreateReturnDialog } from '@/features/returns/components/create-return-dialog'

export const Route = createFileRoute('/_authenticated/returns/')({
  component: ReturnsPage,
})

function ReturnsPage() {
  const { data, isLoading } = useReturns({ limit: 50 })
  const [createOpen, setCreateOpen] = useState(false)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <RotateCcw className="h-6 w-6" />
            Sales Returns
          </h1>
          <p className="text-muted-foreground">Manage product returns and refunds</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Return
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left font-medium">Return #</th>
              <th className="p-4 text-left font-medium">Transaction #</th>
              <th className="p-4 text-left font-medium">Date</th>
              <th className="p-4 text-left font-medium">Reason</th>
              <th className="p-4 text-left font-medium">Status</th>
              <th className="p-4 text-right font-medium">Amount</th>
              <th className="p-4 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin" />
                  </div>
                </td>
              </tr>
            ) : (data?.data || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  No returns found. Create your first return to get started.
                </td>
              </tr>
            ) : (
              (data?.data || []).map((ret) => (
                <tr key={ret.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-mono font-medium">{ret.number}</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    {ret.transaction?.number || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {format(new Date(ret.date), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="p-4 max-w-[200px] truncate">
                    {ret.reason || '-'}
                  </td>
                  <td className="p-4">
                    <Badge className={statusColors[ret.status] || ''} variant="outline">
                      {ret.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(Number(ret.totalAmount))}
                  </td>
                  <td className="p-4 text-center">
                    <Link to={`/returns/${ret.id}`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateReturnDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
