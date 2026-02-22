import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  fixed?: boolean
}

export function Page({ className, fixed = false, children, ...props }: PageProps) {
  return (
    <div className={cn('flex flex-col h-full', className)} {...props}>
      {children}
    </div>
  )
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
}

export function PageHeader({ className, fixed = false, children, ...props }: PageHeaderProps) {
  return (
    <Header fixed={fixed} className={cn('gap-4', className)} {...props}>
      <div className="flex flex-1 items-center justify-between">
        {children}
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitch />
        <ProfileDropdown />
      </div>
    </Header>
  )
}

export function PageHeaderHeading({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('grid gap-1', className)} {...props}>
      {children}
    </div>
  )
}

export function PageHeaderTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn('text-2xl font-bold tracking-tight', className)} {...props}>
      {children}
    </h1>
  )
}

export function PageHeaderDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-base text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export function PageHeaderActions({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  )
}

interface PageBodyProps extends React.ComponentProps<typeof Main> {}

export function PageBody({ className, children, ...props }: PageBodyProps) {
  return (
    <Main className={cn('flex-1 px-6 sm:px-8 py-6', className)} {...props}>
      {children}
    </Main>
  )
}
