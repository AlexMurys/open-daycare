export type KidAvatarColor =
  | "sky"
  | "rose"
  | "mint"
  | "amber"
  | "violet"
  | "blue";

export type ParentRelation = "Mamá" | "Papá";

export type ParentStatus = "active" | "pending";

export interface ParentLink {
  name: string;
  initial: string;
  relation: ParentRelation;
  status: ParentStatus;
  avatarColor: KidAvatarColor;
}

export interface Kid {
  id: number;
  name: string;
  initial: string;
  age: number;
  parents: ParentLink[];
  avatarColor: KidAvatarColor;
  allergyLabel?: string;
  allergyNotes?: string;
  birthDate: string;
  room: string;
  enrolledSince: string;
}

export const kids: Kid[] = [
  {
    id: 1,
    name: "Mateo Fernández",
    initial: "M",
    age: 3,
    parents: [
      {
        name: "Lucía Fernández",
        initial: "L",
        relation: "Mamá",
        status: "active",
        avatarColor: "violet",
      },
      {
        name: "Diego Fernández",
        initial: "D",
        relation: "Papá",
        status: "pending",
        avatarColor: "blue",
      },
    ],
    avatarColor: "sky",
    allergyLabel: "MANÍ",
    allergyNotes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    birthDate: "12 mar 2022",
    room: "Soles",
    enrolledSince: "feb 2025",
  },
  {
    id: 2,
    name: "Sofía Méndez",
    initial: "S",
    age: 2,
    parents: [
      {
        name: "Camila Herrera",
        initial: "C",
        relation: "Mamá",
        status: "active",
        avatarColor: "blue",
      },
    ],
    avatarColor: "rose",
    birthDate: "08 sep 2024",
    room: "Soles",
    enrolledSince: "ene 2026",
  },
  {
    id: 3,
    name: "Benjamín Ruiz",
    initial: "B",
    age: 3,
    parents: [
      {
        name: "Mariana Ruiz",
        initial: "M",
        relation: "Mamá",
        status: "active",
        avatarColor: "violet",
      },
      {
        name: "Andrés Ruiz",
        initial: "A",
        relation: "Papá",
        status: "active",
        avatarColor: "blue",
      },
    ],
    avatarColor: "mint",
    birthDate: "21 nov 2023",
    room: "Soles",
    enrolledSince: "mar 2025",
  },
  {
    id: 4,
    name: "Valentina Soto",
    initial: "V",
    age: 2,
    parents: [],
    avatarColor: "amber",
    birthDate: "30 jun 2024",
    room: "Soles",
    enrolledSince: "abr 2026",
  },
  {
    id: 5,
    name: "Tomás Díaz",
    initial: "T",
    age: 3,
    parents: [
      {
        name: "Rodrigo Díaz",
        initial: "R",
        relation: "Papá",
        status: "active",
        avatarColor: "blue",
      },
    ],
    avatarColor: "violet",
    allergyLabel: "LACTOSA",
    allergyNotes: "Intolerancia a la lactosa. Se ofrece bebida de soja en la merienda.",
    birthDate: "17 feb 2023",
    room: "Soles",
    enrolledSince: "sep 2025",
  },
  {
    id: 6,
    name: "Emma Castro",
    initial: "E",
    age: 2,
    parents: [
      {
        name: "Paula Castro",
        initial: "P",
        relation: "Mamá",
        status: "active",
        avatarColor: "blue",
      },
    ],
    avatarColor: "rose",
    birthDate: "05 abr 2024",
    room: "Soles",
    enrolledSince: "ene 2026",
  },
  {
    id: 7,
    name: "Lucas Romero",
    initial: "L",
    age: 3,
    parents: [
      {
        name: "Martín Romero",
        initial: "M",
        relation: "Papá",
        status: "pending",
        avatarColor: "blue",
      },
    ],
    avatarColor: "sky",
    birthDate: "14 oct 2022",
    room: "Soles",
    enrolledSince: "mar 2025",
  },
  {
    id: 8,
    name: "Olivia Vega",
    initial: "O",
    age: 2,
    parents: [
      {
        name: "Laura Vega",
        initial: "L",
        relation: "Mamá",
        status: "active",
        avatarColor: "blue",
      },
    ],
    avatarColor: "mint",
    birthDate: "19 mar 2024",
    room: "Soles",
    enrolledSince: "feb 2026",
  },
];