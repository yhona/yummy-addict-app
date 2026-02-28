import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { useCreateReceivable } from '@/features/receivables/api/receivables'
import { useCustomers } from '@/features/customers/api/customers'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/finance/receivables/new')({
  component: NewReceivablePage,
})

function NewReceivablePage() {
  const navigate = useNavigate()
  const createMutation = useCreateReceivable()
  const { data: customersResponse, isLoading: isLoadingCustomers } = useCustomers()
  const customers: any[] = (customersResponse as any)?.data || []

  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    dueDate: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId) {
      toast.error('Pelanggan harus dipilih')
      return
    }

    const amountNum = Number(formData.amount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Nominal piutang tidak valid')
      return
    }

    createMutation.mutate(
      {
        customerId: formData.customerId,
        amount: amountNum,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        notes: formData.notes,
      },
      {
        onSuccess: (data) => {
          toast.success('Hutang / Kasbon berhasil dicatat!')
          navigate({ to: `/finance/receivables/${data.id}` })
        },
        onError: (err: any) => {
          toast.error(err.message || 'Gagal menyimpan piutang')
        },
      }
    )
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/finance/receivables' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Batal & Kembali
        </Button>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Catat Piutang Baru</h1>
          <p className="text-muted-foreground">
            Tambahkan catatan hutang / kasbon manual untuk pelanggan.
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Formulir Piutang</CardTitle>
              <CardDescription>Masukkan rincian hutang dengan teliti.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Pilih Pelanggan <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(val) => setFormData({ ...formData, customerId: val })}
                    disabled={isLoadingCustomers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingCustomers ? 'Memuat pelanggan...' : 'Pilih pelanggan dari data pelanggan'} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Jika belum ada, tambahkan pelanggan terlebih dahulu di menu Data Pelanggan.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nominal Hutang (Rp) <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="1"
                      required
                      placeholder="Contoh: 150000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                    {formData.amount && (
                      <p className="text-sm font-medium text-emerald-600">
                        {formatCurrency(Number(formData.amount))}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Jatuh Tempo (Opsional)</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan / Alasan Kelonggaran (Opsional)</Label>
                  <Textarea
                    placeholder="Contoh: Kasbon bahan material untuk seminggu, dijanjikan bayar Jumat depan."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={createMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan Piutang'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
