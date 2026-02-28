import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, RefreshCcw, Package, AlertCircle } from 'lucide-react'
import { useReturnDetail } from '@/features/returns/api/returns'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/returns/$id')({
  component: ReturnDetailPage,
})

function ReturnDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: returnData, isLoading } = useReturnDetail(id)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!returnData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Retur Tidak Ditemukan</h2>
        <Button className="mt-4" onClick={() => navigate({ to: '/returns' })}>
          Kembali ke Daftar
        </Button>
      </div>
    )
  }

  return (
    <>
      <Header fixed>
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/returns' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Daftar Retur
        </Button>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{returnData.number}</h2>
              {returnData.status === 'completed' ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600">Selesai</Badge>
              ) : (
                <Badge variant="outline">{returnData.status}</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Diproses pada: {format(new Date(returnData.date), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Total Dana Kembali</p>
            <h3 className="text-2xl font-bold text-destructive">
              Rp {Number(returnData.totalAmount).toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informasi Retur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nota Transaksi Asli</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold">{returnData.transaction?.number || '-'}</span>
                  {returnData.transactionId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 text-xs px-2"
                      onClick={() => navigate({ to: '/transactions/' + returnData.transactionId })}
                    >
                      Lihat Transaksi
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Diproses Oleh</p>
                <p className="font-medium">{returnData.processedByUser?.name || '-'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Alasan Retur</p>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-md border italic">
                  {returnData.reason || "Tidak ada alasan yang dicantumkan."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Barang yang Dikembalikan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-y">
                    <tr>
                      <th className="p-4 text-left font-medium">Produk</th>
                      <th className="p-4 text-right font-medium">Harga Satuan</th>
                      <th className="p-4 text-right font-medium">Qty Retur</th>
                      <th className="p-4 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnData.items?.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <p className="font-medium">{item.product?.name || 'Produk Tidak Ditemukan'}</p>
                          {item.product?.sku && (
                            <p className="text-xs text-muted-foreground mt-1">SKU: {item.product.sku}</p>
                          )}
                        </td>
                        <td className="p-4 text-right">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-semibold">{item.quantity}</td>
                        <td className="p-4 text-right font-medium text-destructive">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    {!returnData.items?.length && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Tidak ada data barang.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
