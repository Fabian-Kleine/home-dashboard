import { FullscreenProvider } from '@/components/fullscreen-context';
import { PageRefreshProvider } from '@/components/page-refresh-context';
import { SettingsProvider } from '@/components/settings-context';
import { Sidebar } from '@/components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => (
    <SettingsProvider>
        <FullscreenProvider>
            <PageRefreshProvider>
                <div
                    className="flex min-h-screen w-full text-[#17323a] antialiased dark:text-slate-100"
                    style={{ background: "var(--mesh-background)", backgroundAttachment: "fixed" }}
                >
                    <Sidebar />
                    <div className="min-w-0 flex-1">
                        <Outlet />
                    </div>
                </div>
            </PageRefreshProvider>
        </FullscreenProvider>
    </SettingsProvider>
);

export const Route = createRootRoute({
    component: RootLayout,
});
