import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useState } from 'react';
import { TextField } from '~/ui/TextField';
import { Button } from '~/ui/Button';
import { Form } from '~/ui/Form';
import { isKnownError, useLogin } from '~/api/hooks';
import { ErrorBox } from '~/ui/ErrorBox';

export const Route = createFileRoute('/_unauthenticated/login/email')({
  component: RouteComponent,
})

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const [linkBlueId, setLinkBlueId] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin(auth)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    login.mutate({
      email: linkBlueId,
      password,
    })
  };

  return (
    <>
      <h2 className="text-center text-2xl pb-10">Login</h2>

      <Form onSubmit={handleSubmit}>
        <TextField name="linkblue" label="Campus Email" type="email" value={linkBlueId} onChange={setLinkBlueId} isRequired isDisabled={login.isPending} />
        <TextField name="password" label="Password" type="password" value={password} onChange={setPassword} isRequired isDisabled={login.isPending} />
        <Button isPending={login.isPending} type="submit">Log In</Button>
        <Button isDisabled={login.isPending} variant="secondary" onPress={() => navigate({ to: '/recovery', search })}>Forgot password?</Button>
        <Button isDisabled={login.isPending} variant="secondary" onPress={() => navigate({ to: '/login', search })}>Try another way</Button>
        {isKnownError(login.error) && <ErrorBox>{login.error.error}</ErrorBox>}
      </Form>
    </>
  )
}
