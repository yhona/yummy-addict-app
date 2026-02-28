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
import { useProduct, useCategories, useUnits, useUpdateProduct, useProducts } from '@/features/inventory/api'
import { VariantsManager } from '@/features/inventory/components/variants-manager'
import { toast } from 'sonner'
import type { ApiProduct } from '@/lib/api-types'

export const Route = createFileRoute(
  '/_authenticated/inventory/products/$id/edit'
)({
  component: EditProductPage,
})

function EditProductPage() {
  const navigate = useNavigate()
  const { id } = Route.useParams()

  // Fetch product, categories and units from API
  const { data: product, isLoading: isProductLoading } = useProduct(id)
  const { data: categoriesData } = useCategories({ flat: true })
  const { data: unitsData } = useUnits()
  const { data: productsData } = useProducts({ limit: 200 })

  // Update mutation
  const updateProduct = useUpdateProduct()

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

  // Get bulk products for parent selector (excluding current product)
  const allProducts = (productsData?.data || []) as ApiProduct[]
  const bulkProducts = allProducts
    .filter((p) => p.isBulk === true && p.id !== id)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku }))

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await updateProduct.mutateAsync({
        id,
        data: {
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
          type: data.type,
          bundleItems: data.type === 'bundle' ? data.bundleItems : undefined,
          isBulk: data.isBulk,
          conversionRatio: data.conversionRatio ?? null,
          parentId: data.parentId === 'none' ? null : data.parentId,
          image: data.image,
        },
      })

      toast.success('Product updated successfully!')
      navigate({ to: '/inventory/products' })
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update product')
    }
  }

  const handleCancel = () => {
    navigate({ to: '/inventory/products' })
  }

  if (isProductLoading) {
    return (
      <>
        <Header fixed>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading product...</div>
          </div>
        </Main>
      </>
    )
  }

  if (!product) {
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
          <h1 className="text-lg font-semibold">Edit Product</h1>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main>
          <div className="flex h-[400px] flex-col items-center justify-center gap-4">
            <div className="text-muted-foreground">Product not found</div>
            <Button onClick={handleCancel}>Back to Products</Button>
          </div>
        </Main>
      </>
    )
  }

  // Convert Product to form values
  const initialData: Partial<ProductFormValues> | undefined = product
    ? {
        sku: product.sku,
        name: product.name,
        barcode: product.barcode || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        unitId: product.unitId || '',
        productType: product.productType as 'inventory' | 'service' | 'non_inventory',
        costPrice: typeof product.costPrice === 'string' ? parseFloat(product.costPrice) : product.costPrice,
        sellingPrice: typeof product.sellingPrice === 'string' ? parseFloat(product.sellingPrice) : product.sellingPrice,
        wholesalePrice: product.wholesalePrice ? (typeof product.wholesalePrice === 'string' ? parseFloat(product.wholesalePrice) : product.wholesalePrice) : null,
        memberPrice: product.memberPrice ? (typeof product.memberPrice === 'string' ? parseFloat(product.memberPrice) : product.memberPrice) : null,
        minStock: product.minStock,
        maxStock: product.maxStock ? (typeof product.maxStock === 'string' ? parseFloat(product.maxStock) : product.maxStock) : null,
        trackInventory: product.trackInventory,
        type: product.type || 'standard',
        bundleItems: product.bundleItems?.map((b) => ({
          productId: b.productId,
          quantity: b.quantity,
        })) || [],
        isBulk: product.isBulk,
        conversionRatio: product.conversionRatio ? (typeof product.conversionRatio === 'string' ? parseFloat(product.conversionRatio) : product.conversionRatio) : null,
        parentId: product.parentId || null,
        isActive: product.isActive,
        image: product.image || null,
      }
    : undefined

  // Transform variants
  const variants: Product[] = (product.variants || []).map((v) => ({
    id: v.id,
    sku: v.sku,
    barcode: v.barcode || undefined,
    name: v.name,
    description: v.description || undefined,
    categoryId: v.categoryId || undefined,
    unitId: v.unitId || undefined,
    productType: 'inventory',
    costPrice: parseFloat(v.costPrice),
    sellingPrice: parseFloat(v.sellingPrice),
    currentStock: v.currentStock || 0,
    minStock: v.minStock,
    maxStock: v.maxStock || undefined,
    image: v.image || undefined,
    parentId: v.parentId || undefined,
    trackInventory: true,
    hasVariants: false,
    isActive: v.isActive,
    isBulk: false,
    conversionRatio: 0,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }))

  const productWithVariants: Product = {
     id: product.id,
     sku: product.sku,
     name: product.name,
     variants: variants,
     isActive: product.isActive,
     createdAt: product.createdAt,
     updatedAt: product.updatedAt,
     productType: (product.productType || 'inventory') as 'inventory' | 'service' | 'non_inventory',
     costPrice: typeof product.costPrice === 'string' ? parseFloat(product.costPrice) : product.costPrice,
     sellingPrice: typeof product.sellingPrice === 'string' ? parseFloat(product.sellingPrice) : product.sellingPrice,
     minStock: product.minStock,
     currentStock: 0,
     trackInventory: true,
     hasVariants: true,
     isBulk: product.isBulk,
     conversionRatio: typeof product.conversionRatio === 'string' ? parseFloat(product.conversionRatio) : (product.conversionRatio || 0)
  }

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
        <h1 className="text-lg font-semibold">Edit Product</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mx-auto max-w-3xl">
          <PageHeaderHeading className="mb-6">
            <PageHeaderTitle>Edit Product</PageHeaderTitle>
            <PageHeaderDescription>
              Update the details for <strong>{product.name}</strong>
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
              isLoading={updateProduct.isPending}
            />
          </div>

          <div className="mt-6 rounded-lg border bg-card p-6">
            <VariantsManager
              product={productWithVariants}
              onAddVariant={() => navigate({ to: '/inventory/products/new', search: { parentId: product.id } })}
              onEditVariant={(id) => navigate({ to: `/inventory/products/${id}/edit` })}
            />
          </div>
        </div>
      </Main>
    </>
  )
}
