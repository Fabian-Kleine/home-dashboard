import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from "@/lib/use-translation";

export const Route = createFileRoute('/weather')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 px-5 py-6 sm:px-8 lg:px-10">
      <div className="text-3xl font-semibold tracking-tight text-[#17323a]">
        {t.pages.weatherTitle}
      </div>
    </div>
  );
}
