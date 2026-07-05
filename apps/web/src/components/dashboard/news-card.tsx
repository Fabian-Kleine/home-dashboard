import { Link } from "@tanstack/react-router";
import { IconArrowRight, IconPhoto, IconPlayerPlayFilled } from "@tabler/icons-react";
import type { NewsArticle } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { formatRelativeTime } from "@/lib/news";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";

const WIDGET_ARTICLE_COUNT = 5;

function NewsRow({ article }: { article: NewsArticle }) {
  const { t, locale } = useTranslation();
  const isVideo = article.type === "video";

  const content = (
    <>
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-[#17323a]/8 dark:bg-white/10">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.imageAlt ?? article.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[#17323a]/30 dark:text-slate-300/40">
            <IconPhoto className="size-5" />
          </div>
        )}
        {isVideo && (
          <div className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white">
            <IconPlayerPlayFilled className="size-2.5" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {article.topline && (
          <div className="truncate text-[10.5px] font-extrabold uppercase tracking-wide text-[#0f8b7f] dark:text-teal-300">
            {article.topline}
          </div>
        )}
        <div className="line-clamp-2 text-[13.5px] font-semibold leading-snug">{article.title}</div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#17323a]/45 dark:text-slate-300/55">
          {article.breakingNews && (
            <span className="rounded bg-[#e8794b]/15 px-1.5 py-px text-[9.5px] font-extrabold uppercase tracking-wide text-[#d1552a] dark:text-[#f0a184]">
              {t.news.breaking}
            </span>
          )}
          <span>{formatRelativeTime(article.date, locale)}</span>
        </div>
      </div>
    </>
  );

  const rowClass = "flex items-start gap-3 no-underline! text-inherit";

  return article.link ? (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(rowClass, "rounded-xl transition-colors hover:bg-white/40 dark:hover:bg-white/5")}
    >
      {content}
    </a>
  ) : (
    <div className={rowClass}>{content}</div>
  );
}

export function NewsCard({
  articles,
  isLoading,
  isError,
  className,
}: {
  articles: NewsArticle[] | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const topArticles = articles?.slice(0, WIDGET_ARTICLE_COUNT) ?? [];

  return (
    <GlassCard className={cn("col-span-12 flex flex-col gap-4 p-6 lg:col-span-5", className)}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t.news.title}</div>
        <Link
          to="/news"
          className="group flex items-center gap-1 text-[13px] font-extrabold text-[#0f8b7f] no-underline dark:text-teal-300"
        >
          {t.news.details}
          <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-6 text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
          {t.news.loading}
        </div>
      ) : isError && topArticles.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6 text-center text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
          {t.news.error}
        </div>
      ) : topArticles.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6 text-center text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
          {t.news.empty}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topArticles.map((article) => (
            <NewsRow key={article.id} article={article} />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
