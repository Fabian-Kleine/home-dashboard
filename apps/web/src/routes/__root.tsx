import { FullscreenProvider } from '@/components/fullscreen-context';
import { PageControls } from '@/components/page-controls';
import { PageRefreshProvider } from '@/components/page-refresh-context';
import { Sidebar } from '@/components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => (
    <>
        <FullscreenProvider>
            <PageRefreshProvider>
                <div className="fixed bg-[url(https://cdn.pixabay.com/photo/2021/08/25/20/42/field-6574455_960_720.jpg)] bg-cover w-full h-full inset-0 blur-xs pointer-events-none z-0" />
                <Sidebar />
                <PageControls />
                <div
                    className="min-h-screen min-w-0 w-full text-white bg-transparent antialiased pt-12 z-10"
                >
                    <Outlet />
                </div>
            </PageRefreshProvider>
        </FullscreenProvider>
        {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </>
);

export const Route = createRootRoute({
    component: RootLayout,
});