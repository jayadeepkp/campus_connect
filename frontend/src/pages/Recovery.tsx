import { useState } from "react"
import { Form } from "../ui/Form";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export default function Recovery({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (email) setSent(true);
  };

  return (
    <div className="flex flex-col min-h-full justify-center px-6 py-12 lg:px-8">
      <div className="sm:w-full sm:max-w-sm sm:mx-auto">
        <h2 className="text-center text-2xl pb-10">Reset Password</h2>

        {sent
        ? <>
            <p>
              A password reset link has been sent to <b>{email}</b>
            </p>
            <button onClick={onBack}>
              Back to Login
            </button>
          </>
        : <Form onSubmit={handleReset}>
            <TextField type="email" label="Email" value={email} onChange={setEmail} />
            <Button type="submit">Send Reset Link</Button>
            <Button variant="secondary" onPress={onBack}>Back to Login</Button>
          </Form>
        }
      </div>
    </div>
  );
}
