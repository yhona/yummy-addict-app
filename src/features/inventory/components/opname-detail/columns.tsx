import { ColumnDef } from '@tanstack/react-table'
import { OpnameItem } from '../../types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useUpdateOpnameItem } from '../../api/opname'
import { useState, useEffect } from 'react'

const PhysicalQtyCellComponent = ({ 
  row, 
  opnameId, 
  isFinalized 
}: { 
  row: any, 
  opnameId: string, 
  isFinalized: boolean 
}) => {
  const item = row.original
  const updateMutation = useUpdateOpnameItem()
  const [value, setValue] = useState(item.physicalQty?.toString() || '')

  useEffect(() => {
    setValue(item.physicalQty?.toString() || '')
  }, [item.physicalQty])

  const handleBlur = () => {
    if (isFinalized) return

    const numValue = value === '' ? null : Number(value)
    if (numValue !== item.physicalQty) {
      updateMutation.mutate({
        opnameId,
        itemId: item.id,
        data: { physicalQty: numValue },
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  if (isFinalized) {
    return (
      <span className="font-semibold whitespace-nowrap">
        {item.physicalQty ?? '-'} {item.unitName || ''}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 max-w-[150px]">
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={updateMutation.isPending}
        className={`w-24 text-right ${
          item.physicalQty === null
            ? 'border-yellow-500 focus-visible:ring-yellow-500'
            : 'border-green-500/50'
        }`}
        placeholder="0"
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {item.unitName}
      </span>
    </div>
  )
}

export const createDetailColumns = (
  opnameId: string,
  isFinalized: boolean
): ColumnDef<OpnameItem>[] => [
  {
    accessorKey: 'productSku',
    header: 'SKU',
  },
  {
    accessorKey: 'productName',
    header: 'Nama Produk',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('productName')}</div>
    ),
  },
  {
    accessorKey: 'systemQty',
    header: 'Stok Sistem',
    cell: ({ row }) => {
      const unit = row.original.unitName || ''
      return (
        <span className="text-muted-foreground whitespace-nowrap">
          {row.getValue('systemQty')} {unit}
        </span>
      )
    },
  },
  {
    accessorKey: 'physicalQty',
    header: 'Stok Fisik (Dihitung)',
    cell: ({ row }) => <PhysicalQtyCellComponent row={row} opnameId={opnameId} isFinalized={isFinalized} />
  },
  {
    accessorKey: 'difference',
    header: 'Selisih',
    cell: ({ row }) => {
      const diff = row.original.difference

      if (diff === null) {
        return <span className="text-muted-foreground text-sm">Belum dihitung</span>
      }
      
      if (diff === 0) {
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Sesuai (0)</Badge>
      }

      if (diff < 0) {
        return <Badge variant="destructive" className="font-semibold animate-in fade-in zoom-in">{diff} (Kurang)</Badge>
      }

      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 animate-in fade-in zoom-in">+{diff} (Lebih)</Badge>
    },
  },
]
