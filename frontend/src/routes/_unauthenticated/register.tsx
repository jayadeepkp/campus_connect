import { createFileRoute } from '@tanstack/react-router'
import { FormEvent, useState } from 'react'
import { isKnownError, useRegister } from '~/api/hooks'
import { Button } from '~/ui/Button'
import { ErrorBox } from '~/ui/ErrorBox'
import { Form } from '~/ui/Form'
import { TextField } from '~/ui/TextField'

export const Route = createFileRoute('/_unauthenticated/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const navigate = Route.useNavigate()
  const search = Route.useSearch()

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = useRegister(auth)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    register.mutate({
      email,
      name,
      password,
    })
  }

  return (
    <div className="flex flex-col min-h-full justify-center px-6 py-12 lg:px-8">
      <div className="sm:w-full sm:max-w-sm sm:mx-auto">

        <h2 className="text-center text-2xl pb-10">Register</h2>

        <Form onSubmit={handleSubmit}>
          <TextField name="name" label="Name" value={name} onChange={setName} isRequired isDisabled={register.isPending} />
          <TextField name="email" label="Campus Email" type="email" value={email} onChange={setEmail} isRequired isDisabled={register.isPending} />
          <TextField name="password" label="Password" type="password" value={password} onChange={setPassword} isRequired isDisabled={register.isPending} />
          <Button isPending={register.isPending} type="submit">Register</Button>
          <Button isDisabled={register.isPending} variant="secondary" onPress={() => navigate({ to: '/login', search })}>Try another way</Button>
          {isKnownError(register.error) && <ErrorBox>{register.error.error}</ErrorBox>}
        </Form>
      </div>
    </div>
  )
}
