import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useReturns } from '@/features/sales/api/returns'
import { ReturnsTable } from '@/features/sales/components/returns-table/returns-table'
import { columns } from '@/features/sales/components/returns-table/columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

export const Route = createFileRoute('/_authenticated/sales/returns/')({
  component: ReturnsListPage,
})

function ReturnsListPage() {
  const navigate = useNavigate()
  const { data: returnsData, isLoading } = useReturns()
  const returns = returnsData?.data || []

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold border-l pl-4 ml-4">Sales Returns</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between space-y-2">
          <PageHeaderHeading>
            <PageHeaderTitle>Sales Returns</PageHeaderTitle>
            <PageHeaderDescription>
              Manage and process customer returns
            </PageHeaderDescription>
          </PageHeaderHeading>
          <div className="flex gap-2">
            <Button onClick={() => navigate({ to: '/sales/returns/new' })}>
               <Plus className="mr-2 h-4 w-4" /> New Return
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4">
           {isLoading ? (
               <div className="py-8 text-center text-muted-foreground">Loading returns...</div>
           ) : (
               <ReturnsTable columns={columns} data={returns} />
           )}
        </div>
      </Main>
    </>
  )
}
