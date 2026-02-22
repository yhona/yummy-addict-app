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
import {
  unitFormSchema,
  UnitFormValues,
  defaultUnitValues,
} from '../../schema/unit-schema'
import { Unit } from '../../types'

interface UnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Unit
  onSubmit: (data: UnitFormValues) => void
  isLoading?: boolean
}

export function UnitDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading = false,
}: UnitDialogProps) {
  const isEdit = !!initialData

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
        }
      : defaultUnitValues,
  })

  const handleSubmit = (data: UnitFormValues) => {
    onSubmit(data)
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the unit details below.'
              : 'Fill in the details below to create a new unit.'}
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
                      placeholder="e.g., PCS"
                      {...field}
                      disabled={isEdit}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Short code for this unit (uppercase)
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
                  <FormLabel>Unit Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pieces" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    ? 'Update Unit'
                    : 'Create Unit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
