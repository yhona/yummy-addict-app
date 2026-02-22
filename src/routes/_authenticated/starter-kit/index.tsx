import { createFileRoute } from '@tanstack/react-router'
import {
  Page,
  PageHeader,
  PageHeaderHeading,
  PageHeaderTitle,
  PageBody,
} from '@/components/layout/page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/starter-kit/')({
  component: StarterKit,
})

function StarterKit() {
  return (
    <Page>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Starter Kit</PageHeaderTitle>
        </PageHeaderHeading>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </PageHeader>

      <PageBody>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metric 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-muted-foreground text-xs">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metric 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5,678</div>
              <p className="text-muted-foreground text-xs">+5% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Main Content Area</CardTitle>
              <CardDescription>
                Use this space for your primary data visualization, forms, or tables.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground m-6 flex h-[300px] items-center justify-center rounded-md border-2 border-dashed">
              Main Content Placeholder
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Secondary Content Area</CardTitle>
              <CardDescription>
                Ideal for lists, activity feeds, or supplementary details.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground m-6 flex h-[300px] items-center justify-center rounded-md border-2 border-dashed">
              Secondary Content Placeholder
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  )
}
