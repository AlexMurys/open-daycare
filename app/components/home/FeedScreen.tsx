"use client";

import type { FeedPost } from "@/app/_data/mock";
import PostCard from "@/app/components/home/PostCard";
import ShareBox from "@/app/components/home/ShareBox";
import { useCompose } from "@/app/components/compose/ComposeProvider";

interface FeedScreenProps {
  initialPosts: FeedPost[];
}

export default function FeedScreen({ initialPosts }: FeedScreenProps) {
  const { sessionPosts } = useCompose();
  const feedPosts = [...sessionPosts, ...initialPosts];

  return (
    <>
      <ShareBox />

      <div className="mb-3.5 flex items-center gap-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink-subtle">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <div className="flex flex-col gap-4">
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
