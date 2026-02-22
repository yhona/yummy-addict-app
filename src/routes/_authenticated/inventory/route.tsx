import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/inventory')({
  component: InventoryLayout,
})

function InventoryLayout() {
  return <Outlet />
}
