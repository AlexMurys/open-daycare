import Link from "next/link";
import { notFound } from "next/navigation";
import { kids } from "@/app/_data/kids";
import AllergyBox from "@/app/components/kids/AllergyBox";
import DetailsCard from "@/app/components/kids/DetailsCard";
import ParentsCard from "@/app/components/kids/ParentsCard";
import ProfileHeader from "@/app/components/kids/ProfileHeader";

export function generateStaticParams() {
  return kids.map((kid) => ({ id: kid.id }));
}

export default async function KidProfilePage({ params }: PageProps<"/kids/[id]">) {
  const { id } = await params;
  const kid = kids.find((item) => item.id === id);

  if (!kid) notFound();

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pt-20 pb-20 md:px-10 md:pt-[34px] md:pb-20">
      <Link
        href="/kids"
        className="mb-5 flex w-fit items-center gap-[7px] text-[14px] font-bold text-ink-faint"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver a Niños
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:gap-[26px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px] md:min-w-[300px]">
          <ProfileHeader kid={kid} />
          {kid.allergyNotes && <AllergyBox notes={kid.allergyNotes} />}
          <DetailsCard kid={kid} />
        </div>

        <div className="flex w-full flex-col gap-[14px] md:w-[300px] md:flex-none">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-[13px] py-[13px] text-[15px] font-extrabold text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            Resumen del día
          </button>
          <ParentsCard kid={kid} />
        </div>
      </div>
    </div>
  );
}