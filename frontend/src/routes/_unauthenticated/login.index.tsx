import { createFileRoute } from '@tanstack/react-router'
import { Button } from '~/ui/Button';

export const Route = createFileRoute('/_unauthenticated/login/')({
  component: RouteComponent,
})
function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  return (
    <>
      <h2 className="text-center text-2xl pb-10">Login</h2>

      <p>Choose the best login method for you</p>

      <div className="flex flex-col space-y-4 pt-2">
        <Button variant="secondary" onPress={() => navigate({ to: '/register', search })}>Register New Account</Button>
        <Button variant="secondary" onPress={() => navigate({ to: '/login/email', search })}>Log Into Existing Account</Button>
      </div>
    </>
  );
}
