import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export type AuthContext = {
  user: string | null

  loginEmail(email: string): void
  loginLinkblue(): void
  logout(): void

  sendResetEmail(user: string): void
  resetPassword(user: string, code: string, password: string): void
}

export type Context = {
  auth: AuthContext
}

export const Route = createRootRouteWithContext<Context>()({
  component: Root,
})

function Root() {
  return (
    <>
      <Outlet />
    </>
  )
}
