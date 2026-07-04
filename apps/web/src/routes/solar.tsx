import { createFileRoute, Outlet } from '@tanstack/react-router'

/** Layout route for the Solar section; child routes (`/solar` live data, `/solar/statistics`) render here. */
export const Route = createFileRoute('/solar')({
  component: SolarLayout,
})

function SolarLayout() {
  return <Outlet />
}
