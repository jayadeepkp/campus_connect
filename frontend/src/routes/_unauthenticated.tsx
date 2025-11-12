import { createFileRoute, Outlet, redirect, useLayoutEffect, useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/_unauthenticated')({
  validateSearch: search => ({
    redirect: (search.redirect as string) || '/'
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.user !== null) {
      throw redirect({ to: search.redirect })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { auth, user } = Route.useRouteContext({
    select: ({ auth }) => ({ auth, user: auth.user }),
  })
  const search = Route.useSearch()

  useLayoutEffect(() => {
    if (user !== null && search.redirect) {
      router.history.push(search.redirect)
    }
  }, [user, search.redirect])

  return <Outlet />
}
