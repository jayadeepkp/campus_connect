import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_unauthenticated/recovery')({
  component: () =>
    <div className="flex flex-col min-h-full justify-center px-6 py-12 lg:px-8">
      <div className="sm:w-full sm:max-w-sm sm:mx-auto">
        <Outlet />
      </div>
    </div>,
})
