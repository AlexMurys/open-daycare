"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/app/_data/mock";
import ComposeDialog from "./ComposeDialog";

type ComposeContextValue = {
  sessionPosts: FeedPost[];
  openCompose: () => void;
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

  function openCompose() {
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
        onClose={() => setOpen(false)}
        onPublish={handlePublish}
      />
    </ComposeContext.Provider>
  );
}
