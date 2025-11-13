import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { AuthContext, User } from "~/api/hooks";

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
