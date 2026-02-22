import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProductsTable, columns } from '@/features/inventory/components/products-table'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { Product, Category } from '@/features/inventory/types'
import {
  useProducts,
  useDeleteProduct,
  useDeleteProducts,
  useCategories,
} from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/products/')({
  component: ProductsPage,
})

function ProductsPage() {
  const navigate = useNavigate()

  // Fetch products from API
  const { data: productsData, isLoading: isLoadingProducts } = useProducts()
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories({ flat: true })

  // Mutations
  const deleteProduct = useDeleteProduct()
  const deleteProducts = useDeleteProducts()

  const isLoading = isLoadingProducts || isLoadingCategories

  // Transform API data to match frontend types
  const products: Product[] = (productsData?.data || []).map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode || undefined,
    name: p.name,
    description: p.description || undefined,
    categoryId: p.categoryId || undefined,
    categoryName: p.categoryName || p.category?.name,
    unitId: p.unitId || undefined,
    unitName: p.unitName || p.unit?.name,
    productType: p.productType || 'inventory',
    costPrice: parseFloat(p.costPrice),
    sellingPrice: parseFloat(p.sellingPrice),
    wholesalePrice: p.wholesalePrice ? parseFloat(p.wholesalePrice) : undefined,
    memberPrice: p.memberPrice ? parseFloat(p.memberPrice) : undefined,
    currentStock: p.currentStock || 0,
    minStock: p.minStock,
    maxStock: p.maxStock || undefined,
    hasVariants: p.hasVariants || false,
    trackInventory: p.trackInventory !== false,
    isActive: p.isActive,
    isBulk: p.isBulk || false,
    conversionRatio: parseFloat(p.conversionRatio || '1'),
    parentId: p.parentId || undefined,
    parentName: p.parent?.name,
    image: p.image || undefined,
    stockDetails: p.stock?.map((s: any) => ({
      warehouseName: s.warehouse?.name || 'Unknown',
      quantity: s.quantity
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))

  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description || undefined,
    parentId: c.parentId || undefined,
    level: c.level || 0,
    isActive: c.isActive,
  }))

  const handleAddProduct = () => {
    navigate({ to: '/inventory/products/new' })
  }

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct.mutateAsync(product.id)
      toast.success(`Product "${product.name}" deleted successfully`)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete product')
    }
  }

  const handleBulkDeleteProducts = async (productsToDelete: Product[]) => {
    try {
      await deleteProducts.mutateAsync(productsToDelete.map((p) => p.id))
      toast.success(`${productsToDelete.length} products deleted successfully`)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete products')
    }
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <PageHeaderHeading>
            <PageHeaderTitle>Products</PageHeaderTitle>
            <PageHeaderDescription>Manage your product inventory</PageHeaderDescription>
          </PageHeaderHeading>
          <div className="flex gap-2">
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        ) : (
          <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
            <ProductsTable
              data={products}
              columns={columns}
              categories={categories}
              onDelete={handleDeleteProduct}
              onBulkDelete={handleBulkDeleteProducts}
            />
          </div>
        )}
      </Main>
    </>
  )
}
