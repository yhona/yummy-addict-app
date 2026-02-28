import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  categoryFormSchema,
  CategoryFormValues,
} from '../../schema/category-schema'
import { Category } from '../../types'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Category
  parentCategories: Category[]
  onSubmit: (data: CategoryFormValues) => void
  isLoading?: boolean
}

export function CategoryDialog({
  open,
  onOpenChange,
  initialData,
  parentCategories,
  onSubmit,
  isLoading = false,
}: CategoryDialogProps) {
  const isEdit = !!initialData

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialData
      ? {
          code: initialData.code || '',
          name: initialData.name,
          description: initialData.description || '',
          parentId: initialData.parentId || 'none',
          isActive: initialData.isActive ?? true,
        }
      : {
          code: '',
          name: '',
          description: '',
          parentId: 'none',
          isActive: true,
        },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          code: initialData.code || '',
          name: initialData.name,
          description: initialData.description || '',
          parentId: initialData.parentId || 'none',
          isActive: initialData.isActive ?? true,
        })
      } else {
        form.reset({
          code: '',
          name: '',
          description: '',
          parentId: 'none',
          isActive: true,
        })
      }
    }
  }, [open, initialData, form])

  const handleSubmit = (data: CategoryFormValues) => {
    onSubmit(data)
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the category details below.'
              : 'Fill in the details below to create a new category.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., FOOD"
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Makanan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Root Category)</SelectItem>
                      {parentCategories
                        .filter((c) => c.id !== initialData?.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave empty to create a root category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter category description"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Category is visible and can be used
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Saving...'
                  : isEdit
                    ? 'Update Category'
                    : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
