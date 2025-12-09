import { createRootRouteWithContext, Outlet, useRouterState } from "@tanstack/react-router";
import { AuthContext, User } from "~/api/hooks";

export type Context = {
  auth: AuthContext
}

export const Route = createRootRouteWithContext<Context>()({
  component: Root,
})

function Root() {
  const matches = useRouterState({ select: (s) => s.matches })

  const breadcrumbs = matches
    .filter((match) => match.loaderData && 'title' in match.loaderData && typeof match.loaderData.title === 'string')
    .map(({ pathname, loaderData }) => {
      return {
        // @ts-expect-error doesn't handle the type assertion
        title: loaderData.title,
        path: pathname,
      }
    })

  return (
    <html>
      <head>
        <title>Campus Connect | {breadcrumbs.map(it => it.title).join(" | ")}</title>
      </head>
      <Outlet />
    </html>
  )
}
