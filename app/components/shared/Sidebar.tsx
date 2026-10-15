"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  builtNavRoutes,
  classroom,
  navItems,
  type NavIcon,
  type SidebarUser,
} from "@/app/_data/mock";
import { logout } from "@/app/actions/auth";
import { useCompose } from "@/app/components/compose/ComposeProvider";

const NAV_ICONS: Record<NavIcon, ReactNode> = {
  home: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  ),
  kids: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
    </svg>
  ),
  bell: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  user: (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

interface SidebarProps {
  onNavigate?: () => void;
  user: SidebarUser;
}

function isNavRouteActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ onNavigate, user }: SidebarProps) {
  const pathname = usePathname();
  const { openCompose } = useCompose();

  return (
    <aside className="flex h-full w-62 shrink-0 flex-col border-r border-line bg-surface px-4 py-6">
      <Link href="/" className="flex items-center gap-2.75 px-2 pb-5.5 pt-1">
        <span className="flex size-9.5 flex-none items-center justify-center rounded-xl bg-linear-[155deg] from-accent-mist to-accent-pale">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[17px] leading-none font-semibold text-ink">
            OpenDayCare
          </span>
          <span className="mt-0.5 block text-[11.5px] text-ink-ghost">
            {classroom.name}
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={(event) => {
          onNavigate?.();
          openCompose(event.currentTarget);
        }}
        className="mb-4.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-linear-to-b from-accent-mid to-[#ee8164] py-3 font-extrabold text-[14.5px] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isBuilt = builtNavRoutes.includes(item.href);
          const isActive = isBuilt && isNavRouteActive(item.href, pathname);
          const className = isActive
            ? "flex items-center gap-3 rounded-xl bg-accent-wash px-3 py-[11px] text-[14.5px] font-extrabold text-accent"
            : "flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] font-semibold text-ink-muted";

          if (!isBuilt) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={className}
                aria-disabled="true"
              >
                {NAV_ICONS[item.icon]}
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={className}
            >
              {NAV_ICONS[item.icon]}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-2.75 px-2 py-1.5">
          <span className="flex size-9.5 flex-none items-center justify-center rounded-full bg-accent-pale font-display text-[16px] font-semibold text-white">
            {user.initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-extrabold text-ink">
              {user.name}
            </span>
            <span className="block text-[12px] text-ink-ghost">
              {user.role}
            </span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-canvas text-ink-faint"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
