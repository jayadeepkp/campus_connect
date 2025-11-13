import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { isKnownError, useLogin, useResetWithCode } from '~/api/hooks'
import { Button } from '~/ui/Button'
import { ErrorBox } from '~/ui/ErrorBox'
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

  const resetWithCode = useResetWithCode()
  const login = useLogin(auth)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    resetWithCode.mutateAsync({
      email: search.email,
      code,
      newPassword: password
    }).then(() => {
      login.mutate({
        email: search.email,
        password,
      })
    })
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
        {isKnownError(login.error) && <ErrorBox>{login.error.error}</ErrorBox>}
        {isKnownError(resetWithCode.error) && <ErrorBox>{resetWithCode.error.error}</ErrorBox>}
      </Form>
    </>
  )
}
