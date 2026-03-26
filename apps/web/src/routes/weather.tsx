import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/weather')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="space-y-4">
      <div className="w-full px-4 text-3xl font-medium tracking-tighter text-white sm:px-8 lg:px-12">
        Weather
      </div>
    </div>
  );
}
