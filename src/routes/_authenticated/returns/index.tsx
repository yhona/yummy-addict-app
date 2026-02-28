import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCcw, Search } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { useReturnList } from '@/features/returns/api/returns'
import { ColumnDef } from '@tanstack/react-table'
import { SalesReturn } from '@/features/returns/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/returns/')({
  component: ReturnsPage,
})

const columns: ColumnDef<SalesReturn>[] = [
  {
    accessorKey: 'number',
    header: 'No. Retur',
    cell: ({ row }) => <span className="font-semibold">{row.getValue('number')}</span>,
  },
  {
    accessorKey: 'transaction',
    header: 'Referensi Transaksi',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.transaction?.number || '-'}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Tanggal',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {format(new Date(row.getValue('date')), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
      </span>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total Dana Kembali',
    cell: ({ row }) => {
      const amount = Number(row.getValue('totalAmount'))
      return (
        <span className="font-semibold text-destructive">
          Rp {amount.toLocaleString('id-ID')}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      switch (status) {
        case 'completed':
          return <Badge className="bg-emerald-500">Selesai</Badge>
        case 'pending':
          return <Badge variant="secondary">Menunggu</Badge>
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    },
  },
  {
    accessorKey: 'processedByUser',
    header: 'Diproses Oleh',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.processedByUser?.name || '-'}
      </span>
    ),
  },
]

function ReturnsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useReturnList()

  return (
    <>
      <Header fixed>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Data Retur Penjualan</h2>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Retur Penjualan</h1>
            <p className="text-muted-foreground">
              Kelola daftar pengembalian barang dan dana pelanggan (Refund).
            </p>
          </div>
          <Button
            className="w-full md:w-auto shadow-sm"
            onClick={() => navigate({ to: '/returns/new' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            + Buat Retur Baru
          </Button>
        </div>

        <Card className="shadow-none border-0 sm:border rounded-none sm:rounded-lg">
          <CardContent className="p-0 sm:p-6">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={data?.data || []}
                searchKey="number"
              />
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
