import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/solar')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="space-y-4 px-5 py-6 sm:px-8 lg:px-10">
      <div className="text-3xl font-semibold tracking-tight text-[#17323a]">
        Solar System
      </div>
    </div>
  );
}
