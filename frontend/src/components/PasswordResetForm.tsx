import { useState } from "react"

export default function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSent(true);
    }
  };

  return sent ? (
    <p> Password reset link sent to {email} (mock).</p>
  ) : (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter your university email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send Reset Link</button>
    </form>
  );
}
