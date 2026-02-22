import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/reports/shared/DataTable'
import { ShipmentItem } from '@/features/reports/api/reports'
import { Badge } from '@/components/ui/badge'
import { ShipmentDrawer } from './shipment-drawer'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface ShipmentTableProps {
  data: ShipmentItem[]
}

export function ShipmentTable({ data }: ShipmentTableProps) {
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null)

  const columns: ColumnDef<ShipmentItem>[] = [
    {
      accessorKey: 'tracking_number',
      header: 'No Resi',
      cell: ({ row }) => (
        <div 
          className="font-mono text-primary cursor-pointer hover:underline"
          onClick={() => setSelectedShipment(row.original)}
        >
          {row.original.tracking_number || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'order_date',
      header: 'Tgl Order',
      cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{format(new Date(row.original.order_date), 'dd MMM yvyy')}</span>,
    },
    {
      accessorKey: 'recipient_name',
      header: 'Penerima',
      cell: ({ row }) => <span className="font-medium">{row.original.recipient_name || 'Pelanggan Umum'}</span>,
    },
    {
      accessorKey: 'courier',
      header: 'Kurir / Layanan',
      cell: ({ row }) => <span>{row.original.courier} - {row.original.service_type}</span>,
    },
    {
      accessorKey: 'weight_kg',
      header: 'Berat (kg)',
      cell: ({ row }) => <span>{row.original.weight_kg} kg</span>,
    },
    {
      accessorKey: 'shipping_cost',
      header: 'Ongkir',
      cell: ({ row }) => formatCurrency(Number(row.original.shipping_cost)),
    },
    {
      accessorKey: 'charged_to',
      header: 'Ditanggung',
      cell: ({ row }) => {
        const c = row.original.charged_to
        return (
          <Badge variant="outline" className={c === 'store' ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-blue-600 bg-blue-50 border-blue-200'}>
            {c === 'store' ? 'Toko (Subsidi)' : 'Pembeli'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        if (s === 'DELIVERED') return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Diterima</Badge>
        if (s === 'IN_TRANSIT') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Dikirim</Badge>
        if (s === 'PROCESSED') return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Diproses</Badge>
        if (s === 'RETURNED') return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">Retur</Badge>
        if (s === 'FAILED') return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Gagal</Badge>
        return <Badge variant="outline">{s}</Badge>
      },
    }
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={false} // Loading state handled by parent wrapper
      />
      
      {/* Drawer */}
      <ShipmentDrawer 
        shipment={selectedShipment} 
        onClose={() => setSelectedShipment(null)} 
      />
    </>
  )
}
