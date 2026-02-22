import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { UnitDialog } from '@/features/inventory/components/unit-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Unit } from '@/features/inventory/types'
import { UnitFormValues } from '@/features/inventory/schema/unit-schema'
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/features/inventory/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/inventory/units')({
  component: UnitsPage,
})

function UnitsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | undefined>()
  const [deletingUnit, setDeletingUnit] = useState<Unit | undefined>()

  // Fetch units from API
  const { data: unitsData, isLoading } = useUnits()

  // Mutations
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  // Transform API data to match frontend types
  const units: Unit[] = (unitsData || []).map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
  }))

  const handleAddUnit = () => {
    setEditingUnit(undefined)
    setDialogOpen(true)
  }

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: UnitFormValues) => {
    try {
      if (editingUnit) {
        await updateUnit.mutateAsync({
          id: editingUnit.id,
          data: { code: data.code, name: data.name },
        })
        toast.success('Unit updated successfully!')
      } else {
        await createUnit.mutateAsync({
          code: data.code,
          name: data.name,
        })
        toast.success('Unit created successfully!')
      }

      setDialogOpen(false)
      setEditingUnit(undefined)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to save unit')
    }
  }

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return

    try {
      await deleteUnit.mutateAsync(deletingUnit.id)
      toast.success(`Unit "${deletingUnit.name}" deleted successfully`)
      setDeletingUnit(undefined)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete unit')
    }
  }

  const isSaving = createUnit.isPending || updateUnit.isPending
  const isDeleting = deleteUnit.isPending

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
            <PageHeaderTitle>Units</PageHeaderTitle>
            <PageHeaderDescription>Manage product units of measurement</PageHeaderDescription>
          </PageHeaderHeading>
          <div className="flex gap-2">
            <Button onClick={handleAddUnit}>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading units...</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length ? (
                  units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-mono font-medium">
                        {unit.code}
                      </TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUnit(unit)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingUnit(unit)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No units found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>

      <UnitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingUnit}
        onSubmit={handleSubmit}
        isLoading={isSaving}
      />

      <ConfirmDeleteDialog
        open={!!deletingUnit}
        onOpenChange={(open) => !open && setDeletingUnit(undefined)}
        title="Delete Unit"
        itemName={deletingUnit?.name}
        onConfirm={handleDeleteUnit}
        isLoading={isDeleting}
      />
    </>
  )
}
