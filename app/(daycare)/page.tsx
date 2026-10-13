import { classroom, posts, staff } from "@/app/_data/mock";
import FeedScreen from "@/app/components/home/FeedScreen";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-190 px-4 pt-20 pb-20 md:px-10 md:pt-8.5 md:pb-20">
      <header className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent">
          GUARDERÍA · SALA {classroom.name.split(" ").at(-1)?.toUpperCase()}
        </div>
        <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
          Buenas, {staff.name.split(" ")[0]}
        </h1>
        <p className="mt-1.5 mb-0 text-[14.5px] text-ink-faint">
          {classroom.childrenCount} niños · {classroom.date}
        </p>
      </header>

      <FeedScreen initialPosts={posts} />
    </div>
  );
}
