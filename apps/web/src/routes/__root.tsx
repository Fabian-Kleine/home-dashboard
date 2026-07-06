import { FullscreenProvider } from '@/components/fullscreen-context';
import { IsolarLoginDialog } from '@/components/isolar-login-dialog';
import { IsolarProvider } from '@/components/isolar-context';
import { PageRefreshProvider } from '@/components/page-refresh-context';
import { SettingsProvider } from '@/components/settings-context';
import { Sidebar } from '@/components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => (
    <SettingsProvider>
        <FullscreenProvider>
            <PageRefreshProvider>
                <IsolarProvider>
                    <div
                        className="flex min-h-screen w-full self-start text-[#17323a] antialiased dark:text-slate-100"
                        style={{ background: "var(--mesh-background)", backgroundAttachment: "fixed" }}
                    >
                        <Sidebar />
                        <div className="min-w-0 flex-1">
                            <Outlet />
                        </div>
                    </div>
                    <IsolarLoginDialog />
                </IsolarProvider>
            </PageRefreshProvider>
        </FullscreenProvider>
    </SettingsProvider>
);

export const Route = createRootRoute({
    component: RootLayout,
});
