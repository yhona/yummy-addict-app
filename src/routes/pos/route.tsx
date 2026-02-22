import { createFileRoute, redirect } from '@tanstack/react-router'
import { PosLayout } from '@/features/pos/components/pos-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/pos')({
  beforeLoad: async ({ location }) => {
    const authState = useAuthStore.getState()
    if (!authState.auth.accessToken) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: PosLayout,
})
