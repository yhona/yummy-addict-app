import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { api } from '@/lib/api-client'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(7, 'Password must be at least 7 characters long'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmitBase = async (data: z.infer<typeof formSchema>, isAutoLogin = false) => {
    setIsLoading(true)

    try {
      const response: any = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      })

      const { token, user } = response

      // Set user and access token
      auth.setUser(user)
      auth.setAccessToken(token)

      toast.success(`Welcome back, ${user.name || user.email}!`)

      // Redirect to the stored location or default to dashboard
      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
    } catch (error: any) {
      if (isAutoLogin && error.status === 401) {
        // Fallback: the user might not exist yet, let's auto-register them
        try {
          const registerResponse: any = await api.post('/api/auth/register', {
            email: data.email,
            password: data.password,
            name: 'Development Admin',
          })
          
          if (registerResponse && registerResponse.user) {
             // Retry login now that user exists
             return onSubmitBase(data, false)
          }
        } catch (regError: any) {
             toast.error(regError.message || 'Failed to auto-register dev account')
        }
      } else {
         toast.error(error.message || 'Failed to login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = (data: z.infer<typeof formSchema>) => onSubmitBase(data, false)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Sign in
        </Button>
        {import.meta.env.DEV && (
          <Button 
            className='mt-2 bg-green-600 hover:bg-green-700 text-white' 
            type='button' 
            onClick={() => onSubmitBase({ email: 'admin@retailerp.com', password: 'password123' }, true)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
            Auto Login (Dev Mode)
          </Button>
        )}

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              Or continue with
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
