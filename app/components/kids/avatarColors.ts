import type { KidAvatarColor } from "@/app/_data/kids";

export const AVATAR_COLORS: Record<KidAvatarColor, { bg: string; fg: string }> = {
  sky: { bg: "#A9D9E8", fg: "#1F7A93" },
  rose: { bg: "#F4B8CC", fg: "#C44A7A" },
  mint: { bg: "#B9DEC4", fg: "#3E8B62" },
  amber: { bg: "#F4DC8E", fg: "#9A7B1E" },
  violet: { bg: "#C9B6E8", fg: "#7B5FC0" },
  blue: { bg: "#A9C7E8", fg: "#FFFFFF" },
};