"use client";

import { useState, type ReactNode } from "react";
import type { Kid } from "@/app/_data/kids";
import KidCard from "./KidCard";

interface KidsListProps {
  kids: Kid[];
  children: ReactNode;
}

export default function KidsList({ kids, children }: KidsListProps) {
  const [query, setQuery] = useState("");

  const search = query.trim().toLowerCase();
  const visibleKids = search
    ? kids.filter((kid) => kid.name.toLowerCase().includes(search))
    : kids;

  return (
    <>
      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="flex-none text-placeholder-ink"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          aria-label="Buscar niño"
          className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink placeholder:text-[#b6a99b] focus:outline-none"
        />
      </div>

      {children}

      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
        {visibleKids.map((kid) => (
          <KidCard key={kid.id} kid={kid} />
        ))}
      </div>
    </>
  );
}