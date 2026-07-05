import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect } from "react";

import { TopBar } from "@/components/top-bar";
import { GlassCard } from "@/components/dashboard/glass-card";
import { NewsArticleCard } from "@/components/dashboard/news-article-card";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useTranslation } from "@/lib/use-translation";
import { useNews } from "@/lib/news";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const Route = createFileRoute('/news')({
  component: NewsPage,
})

function NewsPage() {
  const { t } = useTranslation();
  const newsQuery = useNews(REFRESH_INTERVAL_MS - 1_000);

  const handleRefresh = useCallback(() => {
    void newsQuery.refetch();
  }, [newsQuery.refetch]);

  useRegisterPageRefresh({
    onRefresh: handleRefresh,
    isRefreshing: newsQuery.isFetching,
    disabled: newsQuery.isFetching,
    label: newsQuery.isFetching ? t.header.refreshingData : t.header.refreshData,
  });

  useEffect(() => {
    const id = setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [handleRefresh]);

  const articles = newsQuery.data?.articles ?? [];

  return (
    <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
      <TopBar title={t.pages.newsTitle} />

      <div className="grid grid-cols-12 gap-4">
        {newsQuery.isLoading ? (
          <GlassCard className="col-span-12 flex items-center justify-center p-10 text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
            {t.news.loading}
          </GlassCard>
        ) : newsQuery.isError && articles.length === 0 ? (
          <GlassCard className="col-span-12 flex items-center justify-center p-10 text-center text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
            {t.news.error}
          </GlassCard>
        ) : articles.length === 0 ? (
          <GlassCard className="col-span-12 flex items-center justify-center p-10 text-center text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
            {t.news.empty}
          </GlassCard>
        ) : (
          articles.map((article) => <NewsArticleCard key={article.id} article={article} />)
        )}
      </div>
    </div>
  );
}
