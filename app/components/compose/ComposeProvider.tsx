"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/app/_data/mock";
import ComposeDialog from "./ComposeDialog";

type ComposeContextValue = {
  sessionPosts: FeedPost[];
  openCompose: (trigger?: HTMLElement | null) => void;
  addPost: (post: FeedPost) => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function useCompose(): ComposeContextValue {
  const context = useContext(ComposeContext);
  if (!context) {
    throw new Error("useCompose debe usarse dentro de ComposeProvider");
  }
  return context;
}

export default function ComposeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionPosts, setSessionPosts] = useState<FeedPost[]>([]);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  function openCompose(trigger?: HTMLElement | null) {
    triggerRef.current = trigger ?? null;
    setOpen(true);
  }

  function addPost(post: FeedPost) {
    setSessionPosts((prev) => [post, ...prev]);
  }

  function handlePublish(post: FeedPost) {
    addPost(post);
    setOpen(false);
    router.push("/");
  }

  return (
    <ComposeContext.Provider value={{ sessionPosts, openCompose, addPost }}>
      {children}
      <ComposeDialog
        open={open}
        triggerRef={triggerRef}
        onClose={() => setOpen(false)}
        onPublish={handlePublish}
      />
    </ComposeContext.Provider>
  );
}
