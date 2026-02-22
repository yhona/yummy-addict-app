import { Outlet } from '@tanstack/react-router'

export function PosLayout() {
  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <Outlet />
    </div>
  )
}
