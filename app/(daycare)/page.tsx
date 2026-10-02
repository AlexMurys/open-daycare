import { classroom, posts, staff } from "@/app/_data/mock";
import PostCard from "@/app/components/home/PostCard";
import ShareBox from "@/app/components/home/ShareBox";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pt-20 pb-20 md:px-10 md:pt-[34px] md:pb-20">
      <header className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
          GUARDERÍA · SALA {classroom.name.split(" ").at(-1)?.toUpperCase()}
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
          Buenas, {staff.name.split(" ")[0]}
        </h1>
        <p className="mt-[5px] mb-0 text-[14.5px] text-ink-faint">
          {classroom.childrenCount} niños · {classroom.date}
        </p>
      </header>

      <ShareBox />

      <div className="mb-[14px] flex items-center gap-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink-subtle">
          PUBLICADO HOY
        </span>
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
