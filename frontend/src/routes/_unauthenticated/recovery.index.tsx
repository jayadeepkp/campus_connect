import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { isKnownError, useForgot } from '~/api/hooks'
import { Button } from '~/ui/Button'
import { ErrorBox } from '~/ui/ErrorBox'
import { Form } from '~/ui/Form'
import { TextField } from '~/ui/TextField'

export const Route = createFileRoute('/_unauthenticated/recovery/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const { auth } = Route.useRouteContext()

  const forgot = useForgot(auth)

  const [email, setEmail] = useState("")

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    forgot.mutateAsync({ email }).then(() => {
      navigate({ to: '/recovery/code', search: { redirect: search.redirect, email }})
    })
  }

  return (
    <>
      <h2 className="text-center text-2xl pb-10">Recovery</h2>

      <Form onSubmit={handleSubmit}>
        <TextField type="email" label="Email" value={email} onChange={setEmail} isRequired />
        <Button type="submit">Send Reset Link</Button>
        <Button variant="secondary" onPress={() => navigate({ to: '/login', search })}>Back to Login</Button>
        {isKnownError(forgot.error) && <ErrorBox>{forgot.error.error}</ErrorBox>}
      </Form>
    </>
  )
}
