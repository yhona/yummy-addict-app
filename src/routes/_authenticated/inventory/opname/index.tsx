import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/features/inventory/components/opname-table/columns'
import { useOpnameList } from '@/features/inventory/api/opname'
import { ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import { CreateOpnameDialog } from '@/features/inventory/components/opname-dialog/create-opname-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/inventory/opname/')({
  component: OpnamePage,
})

function OpnamePage() {
  const [params] = useState({ page: '1', limit: '10' })
  const { data, isLoading } = useOpnameList(params)

  // Use type assertion here since useOpnameList returns standard array based on our hook 
  // but if backend returns paginated format { data: [], pagination: {} } we handle it:
  const opnames = Array.isArray(data) ? data : (data as any)?.data || []
  const pagination = (data as any)?.pagination

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Stock Opname</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      
      <Main>
        <div className="mb-6 space-y-6">
          <div className="flex flex-col gap-4 xs:flex-row xs:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Stock Opname</h2>
              <p className="text-muted-foreground">
                Lakukan perhitungan fisik untuk mencocokkan stok gudang dengan
                sistem.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateOpnameDialog />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Sesi Opname
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold tracking-tight">
                        {pagination?.total || opnames.length}
                      </h3>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={opnames}
                isLoading={isLoading}
                searchable={false}
              />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
