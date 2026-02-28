import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProductForm } from '@/features/inventory/components/product-form'
import type { ProductFormValues } from '@/features/inventory/schema/product-schema'
import type { Category, Unit, Product } from '@/features/inventory/types'
import { z } from 'zod'
import { useCategories, useUnits, useCreateProduct, useProduct, useProducts } from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/products/new')({
  component: NewProductPage,
  validateSearch: z.object({
    parentId: z.string().optional(),
  }),
})

function NewProductPage() {
  const navigate = useNavigate()
  const { parentId } = Route.useSearch()
  
  // Fetch parent if parentId exists
  const { data: parentProduct } = useProduct(parentId || '')

  // Fetch categories and units from API
  const { data: categoriesData } = useCategories({ flat: true })
  const { data: unitsData } = useUnits()
  const { data: productsData } = useProducts({ limit: 200 })

  // Create mutation
  const createProduct = useCreateProduct()

  // Transform data
  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description || undefined,
    parentId: c.parentId || undefined,
    level: c.level,
    isActive: c.isActive,
  }))

  const units: Unit[] = (unitsData || []).map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
  }))

  // Get bulk products for parent selector
  const allProducts: Product[] = (productsData?.data || []).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    barcode: p.barcode || undefined,
    description: p.description || undefined,
    categoryId: p.categoryId || undefined,
    unitId: p.unitId || undefined,
    productType: p.productType,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
    memberPrice: p.memberPrice ? Number(p.memberPrice) : undefined,
    minStock: p.minStock,
    maxStock: p.maxStock || undefined,
    currentStock: p.currentStock || 0,
    hasVariants: p.hasVariants,
    trackInventory: p.trackInventory,
    isActive: p.isActive,
    isBulk: p.isBulk,
    conversionRatio: Number(p.conversionRatio || 0),
    image: p.image || undefined,
    parentId: p.parentId || undefined,
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
  }))

  const bulkProducts = allProducts
    .filter((p) => p.isBulk === true)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku }))

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await createProduct.mutateAsync({
        sku: data.sku,
        barcode: data.barcode,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId === 'none' ? undefined : data.categoryId,
        unitId: data.unitId === 'none' ? undefined : data.unitId,
        productType: data.productType,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice ?? null,
        memberPrice: data.memberPrice ?? null,
        minStock: data.minStock,
        maxStock: data.maxStock ?? null,
        trackInventory: data.trackInventory,
        isActive: data.isActive,
        isBulk: data.isBulk,
        conversionRatio: data.conversionRatio ?? null,
        parentId: data.parentId === 'none' ? null : data.parentId,
        image: data.image,
      })

      toast.success('Product created successfully!')
      navigate({ to: '/inventory/products' })
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create product')
    }
  }

  const handleCancel = () => {
    navigate({ to: '/inventory/products' })
  }

  // Initial data for variant
  const initialData: Partial<ProductFormValues> | undefined = parentProduct ? {
    sku: `${parentProduct.sku}-VAR`,
    barcode: '',
    name: `${parentProduct.name} (Variant)`,
    description: parentProduct.description || '',
    categoryId: parentProduct.categoryId || '',
    unitId: parentProduct.unitId || '',
    productType: 'inventory',
    costPrice: typeof parentProduct.costPrice === 'string' ? parseFloat(parentProduct.costPrice) : parentProduct.costPrice,
    sellingPrice: typeof parentProduct.sellingPrice === 'string' ? parseFloat(parentProduct.sellingPrice) : parentProduct.sellingPrice,
    minStock: 0,
    maxStock: null,
    trackInventory: true,
    isActive: true,
    image: parentProduct.image || null,
    parentId: parentId || null,
  } : undefined

  return (
    <>
      <Header fixed>
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Add New Product</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mx-auto max-w-3xl">
          <PageHeaderHeading className="mb-6">
            <PageHeaderTitle>Add New Product</PageHeaderTitle>
            <PageHeaderDescription>
              Fill in the details below to create a new product
            </PageHeaderDescription>
          </PageHeaderHeading>

          <div className="rounded-lg border bg-card p-6">
            <ProductForm
              initialData={initialData}
              categories={categories}
              units={units}
              bulkProducts={bulkProducts}
              products={allProducts.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={createProduct.isPending}
            />
          </div>
        </div>
      </Main>
    </>
  )
}
