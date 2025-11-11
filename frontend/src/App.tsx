import { useState } from "react"
import Login from "./pages/Login"
import Recovery from "./pages/Recovery"
import Home from "./pages/Home"

export default function App() {
  const [page, setPage] = useState("login"); // start at login page
  const [user, setUser] = useState(null);

  // Called when user successfully logs in
  const handleLogin = (userData: any) => {
    setUser(userData);
    setPage("home");
  };


  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  // Called when user clicks "Forgot password?"
  const handleForgot = () => {
    setPage("recovery");
  };

  return (
    <>
      {page === "login" && <Login onLogin={handleLogin} onForgot={handleForgot} />}
      {page === "recovery" && <Recovery onBack={() => setPage("login")} />}
      {page === "home" && <Home user={user} onLogout={handleLogout} />}
    </>
  );
}
