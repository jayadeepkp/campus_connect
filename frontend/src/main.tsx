import { StrictMode, useRef } from "react"
import ReactDOM from "react-dom/client"
import './ui/index.css'
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { routeTree } from './routeTree.gen'
import { Context } from "./routes/__root"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { initialUser } from "./api/hooks"

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient()

function App() {
  const context = useRef<Context>({
    auth: {
      user: initialUser(),
      loggedIn(user) {
        this.user = user
        localStorage.setItem('auth', JSON.stringify(user))
        router.invalidate()
      },
      loggedOut() {
        this.user = null
        localStorage.removeItem('auth')
        router.invalidate()
      },
    }
  })

  return (
    <StrictMode>
      <RouterProvider router={router} context={context.current} />
    </StrictMode>
  )  
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
