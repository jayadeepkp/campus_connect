import { StrictMode, useRef, useState } from "react"
import ReactDOM from "react-dom/client"
import './ui/index.css'
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { routeTree } from './routeTree.gen'
import { Context } from "./routes/__root"

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

function App() {
  const context = useRef<Context>({
    auth: {
      user: null,
      async loginEmail(email) {
        alert('pretend we have email implemented')
        this.user = email
        router.invalidate()
      },
      async loginLinkblue() {
        alert('pretend we have oauth implemented')
        this.user = 'link@uky.edu'
        router.invalidate()
      },
      sendResetEmail(_user) {
        alert('pretend i sent a reset email')
      },
      async resetPassword(user, _code, _password) {
        alert('pretend the password was reset')
        this.user = user
        router.invalidate()
      },
      logout() {
        this.user = null
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

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
