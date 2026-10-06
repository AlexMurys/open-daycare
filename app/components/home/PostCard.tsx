import Link from "next/link";
import {
  POST_TYPE_LABEL,
  type FeedPost,
  type PostType,
} from "@/app/_data/mock";

const CHIP_STYLES: Record<PostType, string> = {
  achievement: "bg-achievement-bg text-achievement",
  activity: "bg-activity-bg text-activity",
  announcement: "bg-announcement-bg text-announcement",
};

interface PostCardProps {
  post: FeedPost;
}

export default function PostCard({ post }: PostCardProps) {
  const isAnnouncement = post.type === "announcement";

  return (
    <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        {isAnnouncement ? (
          <span className="flex size-11 flex-none items-center justify-center rounded-full bg-announcement-bg text-announcement">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </span>
        ) : (
          <span className="flex size-11 flex-none items-center justify-center rounded-full bg-activity-avatar font-display text-[17px] font-semibold text-activity-deep">
            {post.initial}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-display text-[16.5px] font-semibold text-ink">
            {post.author}
          </div>
          <div className="text-[12.5px] text-ink-ghost">
            {post.time} · publicado por vos
          </div>
        </div>

        <div
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 text-[12px] font-extrabold tracking-[0.5px] ${CHIP_STYLES[post.type]}`}
        >
          <span className="size-2 flex-none rounded-full bg-current" />
          {POST_TYPE_LABEL[post.type]}
        </div>
      </div>

      <div className="mb-2.5 text-[12.5px] text-ink-ghost">Para: {post.audience}</div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-ink-body">{post.text}</p>

      {post.photo && (
        <Link
          href="#"
          className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-placeholder-line bg-placeholder-bg text-placeholder-ink"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[13.5px]">{post.photo}</span>
        </Link>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-line-soft pt-[14px]">
        <span className="flex items-center gap-[7px] text-[14px] font-bold text-accent-soft">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {post.likes}
        </span>
        <Link
          href="#"
          className="flex items-center gap-[7px] text-[14px] font-bold text-ink-faint"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          </svg>
          {post.comments}
        </Link>
        <span className="flex-1" />
        <Link href="#" className="text-[14px] font-extrabold text-accent-strong">
          Editar
        </Link>
      </div>
    </article>
  );
}
