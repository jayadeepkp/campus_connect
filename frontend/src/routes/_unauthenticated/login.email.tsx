import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useState } from 'react';
import { TextField } from '~/ui/TextField';
import { Button } from '~/ui/Button';
import { Form } from '~/ui/Form';

export const Route = createFileRoute('/_unauthenticated/login/email')({
  component: RouteComponent,
})

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const [linkBlueId, setLinkBlueId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    auth.loginEmail(linkBlueId)
  };

  return (
    <>
      <h2 className="text-center text-2xl pb-10">Login</h2>

      <Form onSubmit={handleSubmit}>
        <TextField name="linkblue" label="Campus Email" type="email" value={linkBlueId} onChange={setLinkBlueId} isRequired />
        <TextField name="password" label="Password" type="password" value={password} onChange={setPassword} isRequired />
        <Button type="submit">Log In</Button>
        <Button variant="secondary" onPress={() => navigate({ to: '/recovery', search })}>Forgot password?</Button>
        <Button variant="secondary" onPress={() => navigate({ to: '/login', search })}>Try another way</Button>
      </Form>
    </>
  )
}
