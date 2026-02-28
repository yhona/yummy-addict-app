import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useWarehouses } from '@/features/inventory/api/warehouses'
import { useCreateOpname } from '../../api/opname'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  warehouseId: z.string({
    required_error: 'Pilih gudang yang akan diopname',
  }),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface OpnameFormProps {
  onSuccess?: () => void
}

export function OpnameForm({ onSuccess }: OpnameFormProps) {
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses()
  const createMutation = useCreateOpname()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Gudang</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingWarehouses}>
                    <SelectValue placeholder="Pilih Gudang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Misal: Opname rutin akhir bulan"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Mulai Hitung
          </Button>
        </div>
      </form>
    </Form>
  )
}
