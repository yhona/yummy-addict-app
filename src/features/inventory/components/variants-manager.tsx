import { Product } from '../../types'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'

interface VariantsManagerProps {
  product: Product
  onAddVariant: () => void
  onEditVariant: (id: string) => void
}

export function VariantsManager({
  product,
  onAddVariant,
  onEditVariant,
}: VariantsManagerProps) {
  const variants = product.variants || []

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            Manage variants (sizes, colors, etc.) for this product
          </p>
        </div>
        <Button onClick={onAddVariant} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No variants found. Click "Add Variant" to create one.
                </TableCell>
              </TableRow>
            ) : (
              variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono">{variant.sku}</TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>{variant.currentStock}</TableCell>
                  <TableCell>{variant.sellingPrice}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditVariant(variant.id)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
