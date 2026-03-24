import { Sidebar } from '@/components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
    <>
        <main className="flex bg-[url(https://cdn.pixabay.com/photo/2017/08/20/14/40/meadows-2661965_960_720.jpg)] bg-cover min-h-screen">
            <Sidebar />
            <div
                className="min-h-screen w-full text-white bg-transparent backdrop-blur-sm antialiased pt-12"
            >
                <Outlet />
            </div>
        </main>
        <TanStackRouterDevtools position="bottom-right" />
    </>
);

export const Route = createRootRoute({
    component: RootLayout,
});