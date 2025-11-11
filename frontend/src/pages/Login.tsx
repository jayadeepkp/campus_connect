import { FormEvent, useState } from "react"
import { Form } from "../ui/Form"
import { TextField } from "../ui/TextField"
import { Button } from "../ui/Button"

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function PasswordLogin({ onLogin, onForgot, onBack }) {
  const [linkBlueId, setLinkBlueId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailRegex.test(linkBlueId)) {
      setError("Please enter a valid campus email address.")
      return;
    }
    if (linkBlueId && password) {
      setError("");
      onLogin({ name: linkBlueId });
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <TextField name="linkblue" label="Campus Email" value={linkBlueId} onChange={setLinkBlueId} isRequired />
        <TextField name="password" label="Password" type="password" value={password} onChange={setPassword} isRequired />
        {error && (<p className="text-red-500 text-sm text-center">{error}</p>)}
        <Button type="submit">Log In</Button>
        <Button variant="secondary" onPress={onForgot}>Forgot password?</Button>
        <Button variant="secondary" onPress={onBack}>Try another way</Button>
      </Form>
    </>
  )
}

export default function Login({ onLogin, onForgot }) {
  const [mode, setMode] = useState<'choice' | 'password'>('choice')
  const [email, setEmail] = useState()

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
            <Button variant="secondary" onPress={() => setMode('password')}>Campus Email and Password</Button>
          </div>
        </> : <PasswordLogin onLogin={onLogin} onForgot={onForgot} onBack={() => setMode('choice')} />}
      </div>
    </div>
  );
}
