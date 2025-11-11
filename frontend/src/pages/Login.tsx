import { FormEvent, useState } from "react"
import { Form } from "../ui/Form"
import { TextField } from "../ui/TextField"
import { Button } from "../ui/Button"

function PasswordLogin({ onLogin, onForgot, onBack }) {
  const [linkBlueId, setLinkBlueId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (linkBlueId && password) {
      onLogin({ name: linkBlueId });
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <TextField label="linkblue ID" value={linkBlueId} onChange={setLinkBlueId} />
        <TextField label="Password" type="password" value={password} onChange={setPassword} />
        <Button type="submit">Log In</Button>
        <Button variant="secondary" onPress={onForgot}>Forgot password?</Button>
        <Button variant="secondary" onPress={onBack}>Try another way</Button>
      </Form>
    </>
  )
}

export default function Login({ onLogin, onForgot }) {
  const [mode, setMode] = useState<'choice' | 'password'>('choice')

  return (
    <div className="flex flex-col min-h-full justify-center px-6 py-12 lg:px-8">
      <div className="sm:w-full sm:max-w-sm sm:mx-auto">
        <h2 className="text-center text-2xl pb-10">Login</h2>

        {mode == "choice" ? <>
          <p>Choose the best login method for you</p>

          <div className="flex flex-col space-y-4 pt-2">
            <Button variant="secondary" onPress={() => {
              alert("pretend we have oauth set up")
              onLogin({ name: 'student@uky.edu' })
            }}>linkblue</Button>
            <Button variant="secondary" onPress={() => setMode('password')}>Username and Password</Button>
          </div>
        </> : <PasswordLogin onLogin={onLogin} onForgot={onForgot} onBack={() => setMode('choice')} />}
      </div>
    </div>
  );
}
