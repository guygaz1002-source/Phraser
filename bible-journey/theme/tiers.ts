import type { TextStyle } from "react-native";
import type { Clue, StoryEdition, TierId } from "../src/types";

export type Tier = {
  scenes: Record<"desert"|"palace"|"sea", { background: string; detail: string }>;
  id: TierId;
  storyEdition: StoryEdition;
  name: string;
  age: string;
  palette: Record<string, string>;
  colors: {
    background: string;
    panel: string;
    ink: string;
    accent: string;
    primary: string;
    onPrimary: string;
    border: string;
    muted: string;
    painting: string;
  };
  terrain: {
    grass: string;
    deep: string;
    sand: string;
    water: string;
    rock: string;
    building: string;
    detail: string;
  };
  type: Record<"display" | "body" | "label", TextStyle>;
  radius: number;
  borderWidth: number;
  padding: number;
  touch: number;
  gap: number;
  motion: {
    duration: number;
    press: "bounce" | "overshoot" | "fade";
    breathe: boolean;
  };
  imageSet: "kids" | "teen" | "classic";
  input: "pictures" | "letters" | "typed";
  clues: { key: Clue; label: string; cost: number }[];
  showWarning: boolean;
  imageMat: number;
  portrait: number;
  characterPageSize: number;
  home: {
    title: string;
    purpose: string;
    chapter: string;
    art: "storybook" | "adventure" | "illuminated";
  };
  wait: "sprite" | "arrow" | "hairline";
  mapEyebrow: string;
};
const a = {
  parchment: "#F7EFE0",
  sky: "#BFD8E6",
  grass: "#8DBF6E",
  clay: "#E0A868",
  accent: "#C96A4B",
  ink: "#4A3728",
};
const b = {
  forest: "#1E3A2F",
  mapGreen: "#6B9E5E",
  deepGreen: "#4A7A4E",
  sand: "#D9C49A",
  parchment: "#EDE4CE",
  gold: "#E0B84C",
  sky: "#7FB3C8",
  ink: "#23301F",
};
const c = {
  parchment: "#EFE6D4",
  vellum: "#E4D8C0",
  ink: "#2E2419",
  shadow: "#1B1510",
  gold: "#B8893B",
  oxblood: "#7A3B2E",
  olive: "#6B6A45",
};
const adventure: Tier = {
  id: "b",
  storyEdition: "b",
  scenes: {desert:{background:"#F0DFBC",detail:"#C99358"},palace:{background:"#ECDFC0",detail:"#A6743E"},sea:{background:"#DCEBE3",detail:"#609FAD"}},
  name: "Adventure",
  age: "Ages 8–12",
  palette: b,
  colors: {
    background: b.parchment,
    panel: b.parchment,
    ink: b.ink,
    accent: b.forest,
    primary: b.forest,
    onPrimary: b.parchment,
    border: b.deepGreen,
    muted: b.forest,
    painting: b.parchment,
  },
  terrain: {
    grass: b.mapGreen,
    deep: b.deepGreen,
    sand: b.sand,
    water: b.sky,
    rock: b.parchment,
    building: b.gold,
    detail: b.forest,
  },
  type: {
    display: { fontSize: 20, lineHeight: 30 },
    body: { fontSize: 17, lineHeight: 26 },
    label: { fontSize: 14, lineHeight: 20 },
  },
  radius: 8,
  borderWidth: 2,
  padding: 24,
  touch: 56,
  gap: 20,
  motion: { duration: 180, press: "overshoot", breathe: false },
  imageSet: "teen",
  input: "letters",
  clues: [
    { key: "image", label: "Next image", cost: 1 },
    { key: "hint", label: "Written hint", cost: 2 },
    { key: "letter", label: "First letter", cost: 1 },
  ],
  showWarning: false,
  imageMat: 6,
  portrait: 80,
  characterPageSize: 5,
  home: {
    title: "Every story\nis a new path.",
    purpose: "Spot the clues. Solve the picture. Follow the trail.",
    chapter: "Your next adventure",
    art: "adventure",
  },
  wait: "arrow",
  mapEyebrow: "THE BOOK OF EXODUS",

};

export const tiers: Record<TierId, Tier> = {
  a: {
    id: "a",
    storyEdition: "a",
    scenes: {desert:{background:"#F7EFE0",detail:"#E0A868"},palace:{background:"#F7EFE0",detail:"#E0A868"},sea:{background:"#F7EFE0",detail:"#8DBF6E"}},
    name: "Storybook",
    age: "Ages 4–7",
    palette: a,
    // The whole Storybook world uses four inks: parchment, ink, grass, clay.
    colors: {
      background: a.parchment,
      panel: a.parchment,
      ink: a.ink,
      accent: a.clay,
      primary: a.clay,
      onPrimary: a.ink,
      border: "#4A372833",
      muted: a.ink,
      painting: a.parchment,
    },
    terrain: {
      grass: a.grass,
      deep: a.ink,
      sand: a.parchment,
      water: a.clay,
      rock: a.clay,
      building: a.clay,
      detail: a.ink,
    },
    type: {
      display: { fontSize: 40, lineHeight: 60 },
      body: { fontSize: 26, lineHeight: 39 },
      label: { fontSize: 26, lineHeight: 39 },
    },
    radius: 24,
    borderWidth: 3,
    padding: 24,
    touch: 72,
    gap: 16,
    motion: { duration: 350, press: "bounce", breathe: true },
    imageSet: "kids",
    input: "pictures",
    clues: [{ key: "image", label: "Show me more", cost: 1 }],
    showWarning: false,
    imageMat: 0,
    portrait: 88,
    characterPageSize: 4,
    home: {
      title: "Big stories.\nLittle steps.",
      purpose: "Follow Moses. Can you guess the picture?",
      chapter: "A story to discover",
      art: "storybook",
    },
    wait: "sprite",
    mapEyebrow: "",
  },
  b: adventure,
  teen: { ...adventure, id: "teen", name: "Discovery", age: "Ages 13–17" },
  c: {
    id: "c",
    storyEdition: "c",
    scenes: {desert:{background:"#EFE6D4",detail:"#B8893B"},palace:{background:"#EDE0C8",detail:"#B8893B"},sea:{background:"#E3E9DC",detail:"#6B6A45"}},
    name: "Illuminated",
    age: "Ages 18+",
    palette: c,
    colors: {
      background: c.parchment,
      panel: c.vellum,
      ink: c.ink,
      accent: c.gold,
      primary: c.oxblood,
      onPrimary: c.parchment,
      border: "#B8893B66",
      muted: c.olive,
      painting: c.shadow,
    },
    terrain: {
      grass: c.vellum,
      deep: c.olive,
      sand: c.parchment,
      water: c.olive,
      rock: c.gold,
      building: c.gold,
      detail: c.ink,
    },
    type: {
      display: { fontSize: 42, lineHeight: 46 },
      body: { fontSize: 18, lineHeight: 30.6 },
      label: { fontSize: 14, lineHeight: 23.8 },
    },
    radius: 2,
    borderWidth: 1,
    padding: 32,
    touch: 56,
    gap: 24,
    motion: { duration: 400, press: "fade", breathe: false },
    imageSet: "classic",
    input: "typed",
    clues: [
      { key: "image", label: "Next image", cost: 1 },
      { key: "hint", label: "Written hint", cost: 2 },
      { key: "letter", label: "First letter", cost: 2 },
    ],
    showWarning: true,
    imageMat: 12,
    portrait: 88,
    characterPageSize: 5,
    home: {
      title: "An ancient story.\nA closer look.",
      purpose: "A picture, a mystery, an ancient path.",
      chapter: "The book of Exodus",
      art: "illuminated",
    },
    wait: "hairline",
    mapEyebrow: "THE BOOK OF EXODUS",
  },
};
