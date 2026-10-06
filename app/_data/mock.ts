export type PostType = "achievement" | "activity" | "announcement";

export type NavIcon = "home" | "kids" | "bell" | "user";

export interface FeedPost {
  id: string;
  type: PostType;
  author: string;
  initial?: string;
  time: string;
  audience: string;
  text: string;
  photo?: string;
  likes: number;
  comments: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

export interface SidebarUser {
  name: string;
  role: string;
  initial: string;
}

export interface Classroom {
  name: string;
  childrenCount: number;
  date: string;
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};

export const staff: SidebarUser = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
};

export const classroom: Classroom = {
  name: "Sala Soles",
  childrenCount: 12,
  date: "martes 17 jun",
};

export const navItems: NavItem[] = [
  { label: "Feed", href: "/", icon: "home" },
  { label: "Niños", href: "/kids", icon: "kids" },
  { label: "Avisos", href: "/avisos", icon: "bell" },
  { label: "Mi cuenta", href: "/mi-cuenta", icon: "user" },
];

export const builtNavRoutes: readonly string[] = ["/", "/kids"];

export const posts: FeedPost[] = [
  {
    id: "achievement-potty",
    type: "achievement",
    author: "Mateo",
    initial: "M",
    time: "14:20",
    audience: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "activity-pinturas",
    type: "activity",
    author: "Mateo",
    initial: "M",
    time: "09:40",
    audience: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "announcement-parque",
    type: "announcement",
    author: "Anuncio general",
    time: "07:50",
    audience: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
