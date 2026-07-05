import { IconPhoto, IconPlayerPlayFilled } from "@tabler/icons-react";
import type { NewsArticle } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { formatRelativeTime } from "@/lib/news";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";

export function NewsArticleCard({ article }: { article: NewsArticle }) {
  const { t, locale } = useTranslation();
  const isVideo = article.type === "video";

  const body = (
    <>
      <div className="relative aspect-video w-full shrink-0 bg-[#17323a]/8 dark:bg-white/10">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.imageAlt ?? article.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[#17323a]/30 dark:text-slate-300/40">
            <IconPhoto className="size-8" />
          </div>
        )}
        {article.breakingNews && (
          <span className="absolute left-3 top-3 rounded-md bg-[#e8794b] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            {t.news.breaking}
          </span>
        )}
        {isVideo && (
          <div className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/55 text-white">
            <IconPlayerPlayFilled className="size-4" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-wide">
          <span className="truncate text-[#0f8b7f] dark:text-teal-300">{article.topline ?? ""}</span>
          <span className="shrink-0 text-[#17323a]/45 dark:text-slate-300/55">
            {formatRelativeTime(article.date, locale)}
          </span>
        </div>

        <div className="line-clamp-3 text-[15px] font-semibold leading-snug">{article.title}</div>

        {article.firstSentence && (
          <p className="line-clamp-2 text-[13px] font-medium text-[#17323a]/60 dark:text-slate-300/65">
            {article.firstSentence}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#17323a]/6 px-2 py-0.5 text-[10.5px] font-bold text-[#17323a]/55 dark:bg-white/10 dark:text-slate-300/65"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const cardClass =
    "col-span-12 flex flex-col overflow-hidden p-0 sm:col-span-6 lg:col-span-4";

  return (
    <GlassCard className={cardClass}>
      {article.link ? (
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex h-full flex-col text-inherit no-underline! transition-colors hover:bg-white/30 dark:hover:bg-white/5",
          )}
        >
          {body}
        </a>
      ) : (
        <div className="flex h-full flex-col">{body}</div>
      )}
    </GlassCard>
  );
}
