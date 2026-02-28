import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  CategoriesTable,
  columns,
} from '@/features/inventory/components/categories-table'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { CategoryDialog } from '@/features/inventory/components/category-dialog'
import { Category } from '@/features/inventory/types'
import { CategoryFormValues } from '@/features/inventory/schema/category-schema'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()

  // Fetch categories from API
  const { data: categoriesData, isLoading } = useCategories()

  // Mutations
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  // Transform API data to match frontend types
  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description || undefined,
    parentId: c.parentId || undefined,
    parentName: (c as any).parentName,
    isActive: c.isActive,
    productCount: c.productCount || 0,
    subcategoryCount: c.subcategoryCount || 0,
    childrenCount: c.subcategoryCount || 0,
    level: 0,
  }))

  const handleAddCategory = () => {
    setEditingCategory(undefined)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: CategoryFormValues) => {
    // Convert 'none' to undefined for parentId
    const parentId = data.parentId === 'none' ? null : data.parentId

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          data: {
            code: data.code,
            name: data.name,
            description: data.description,
            parentId,
            isActive: data.isActive,
          },
        })
        toast.success('Category updated successfully!')
      } else {
        await createCategory.mutateAsync({
          code: data.code,
          name: data.name,
          description: data.description,
          parentId,
          isActive: data.isActive,
        })
        toast.success('Category created successfully!')
      }
    } catch (error) {
      // Global errorHandler takes care of the toast,
      // Just prevent the dialog from closing and resetting
      return
    }

    setDialogOpen(false)
    setEditingCategory(undefined)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategory.mutateAsync(category.id)
    } catch (error) {
      // Global handler will show toast, we just need to rethrow it
      // so the data row component doesn't show a false success!
      throw error
    }
  }

  const isSaving = createCategory.isPending || updateCategory.isPending

  // Get root categories for parent selection
  const rootCategories = categories.filter((c) => !c.parentId)

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
            <PageHeaderTitle>Categories</PageHeaderTitle>
            <PageHeaderDescription>
              Manage product categories and subcategories
            </PageHeaderDescription>
          </PageHeaderHeading>
          <div className="flex gap-2">
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading categories...</div>
          </div>
        ) : (
          <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
            <CategoriesTable
              data={categories}
              columns={columns}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          </div>
        )}
      </Main>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingCategory}
        parentCategories={rootCategories}
        onSubmit={handleSubmit}
        isLoading={isSaving}
      />
    </>
  )
}
