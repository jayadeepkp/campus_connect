import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { Button } from '~/ui/Button'
import { Form } from '~/ui/Form'
import { TextField } from '~/ui/TextField'

export const Route = createFileRoute('/_unauthenticated/recovery/code')({
  component: RouteComponent,
  validateSearch: search => ({
    redirect: (search.redirect as string) || '/',
    email: (search.email as string) || 'placeholder'
  }),
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const { auth } = Route.useRouteContext()

  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    auth.resetPassword(search.email, code, password)
  }

  return (
    <>
      <h2 className="text-center text-2xl pb-10">Recovery</h2>

      <p className="opacity-80">Enter the reset code sent your email address and provide a new password.</p>

      <Form onSubmit={handleSubmit}>
        <TextField label="Recovery code" value={code} onChange={setCode} isRequired />
        <TextField label="New password" type="password" value={password} onChange={setPassword} isRequired />
        <Button type="submit">Reset Password & Login</Button>
        <Button variant="secondary" onPress={() => navigate({ to: '/login', search })}>Back to Login</Button>
      </Form>
    </>
  )
}
