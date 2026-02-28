import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UserAuthForm } from './components/user-auth-form'
import { Package2 } from 'lucide-react'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <div className='min-h-screen relative flex items-center justify-center bg-background overflow-hidden selection:bg-primary/20'>
      {/* Decorative premium background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-in fade-in duration-1000" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-in fade-in duration-1000 delay-300" />
      </div>

      <div className='relative z-10 w-full max-w-[420px] px-4 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out'>
        {/* Brand/Logo Area */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="h-16 w-16 bg-gradient-to-br from-primary/80 to-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 ring-1 ring-primary/20">
            <Package2 className="w-8 h-8 text-primary-foreground drop-shadow-sm" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Yummy Addict</h1>
            <p className="text-sm text-muted-foreground font-medium">Retail ERP & Point of Sales</p>
          </div>
        </div>

        <Card className='border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl'>
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className='text-2xl font-semibold tracking-tight'>Sign In</CardTitle>
            <CardDescription className="text-sm">
              Securely access your business dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserAuthForm redirectTo={redirect} />
          </CardContent>
          <CardFooter className="pt-2">
            <p className='px-4 text-center text-xs text-muted-foreground leading-relaxed w-full'>
              By securely signing in, you agree to our{' '}
              <br/>
              <a href='/terms' className='underline underline-offset-4 hover:text-primary transition-colors'>Terms of Service</a>
              {' '}and{' '}
              <a href='/privacy' className='underline underline-offset-4 hover:text-primary transition-colors'>Privacy Policy</a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
