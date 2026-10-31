"use client";

/**
 * Browser-only persistence layer (localStorage via zustand persist).
 * NOTE: this is demo-level privacy — anything stored here lives in the
 * visitor's browser, NOT on a server. Documented in the dashboard.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { love } from "./love-config";

export type AnimLevel = "full" | "balanced" | "minimal";

export interface Photo {
  id: string;
  album: string;
  caption: string;
  date: string; // yyyy-mm-dd
  description: string;
  location: string;
  fav: boolean;
  src: string; // compressed data URL
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  photo?: string; // data URL
  location?: string;
  tags: string[];
  song?: string;
  fav: boolean;
  category: string;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  datetime: string; // ISO local
  title: string;
  html: string;
  tags: string[];
  fav: boolean;
  updatedAt: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  time?: string;
  title: string;
  summary: string;
  notes: string;
  photo?: string;
  tags: string[];
  fav: boolean;
  createdAt: number;
}

export interface SpecialDay {
  id: string;
  name: string;
  date: string; // mm-dd for annual, or full date
  description: string;
  photo?: string;
  reminderDays: number;
  annual: boolean;
}

export interface VaultNote {
  id: string;
  title: string;
  body: string;
  photo?: string;
  fav: boolean;
  createdAt: number;
}

interface SettingsState {
  displayName: string;
  birthdayISO: string; // yyyy-mm-dd
  animLevel: AnimLevel;
  soundOn: boolean;
  volume: number;
  secretCode: string | null; // legacy key from the removed second gate page (kept for stored data)
  vaultPin: string | null;
  letterOverride: {
    greeting: string;
    paragraphs: string[];
    closing: string;
    signature: string;
    postscript: string;
  } | null;
  birthdayMessagesOverride: string[] | null;
  set: (patch: Partial<Omit<SettingsState, "set">>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      displayName: love.recipientName,
      birthdayISO: `${love.birthday.year}-${String(love.birthday.month).padStart(2, "0")}-${String(love.birthday.day).padStart(2, "0")}`,
      animLevel: "full",
      soundOn: false,
      volume: 0.6,
      secretCode: null,
      vaultPin: null,
      letterOverride: null,
      birthdayMessagesOverride: null,
      set: (patch) => set(patch),
    }),
    { name: "fm-settings", storage: createJSONStorage(() => localStorage) }
  )
);

interface PhotosState {
  photos: Photo[];
  add: (p: Photo) => void;
  update: (id: string, patch: Partial<Photo>) => void;
  remove: (id: string) => void;
}

export const usePhotos = create<PhotosState>()(
  persist(
    (set) => ({
      photos: [],
      add: (p) => set((s) => ({ photos: [p, ...s.photos] })),
      update: (id, patch) =>
        set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      remove: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
    }),
    { name: "fm-photos", storage: createJSONStorage(() => localStorage) }
  )
);

interface HistoryState {
  entries: HistoryEntry[];
  add: (e: HistoryEntry) => void;
  update: (id: string, patch: Partial<HistoryEntry>) => void;
  remove: (id: string) => void;
  seedOnce: () => void;
}

export const useHistory = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      add: (e) => set((s) => ({ entries: [...s.entries, e] })),
      update: (id, patch) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      seedOnce: () => {
        const { entries } = get();
        if (entries.length >= 5) return;
        set({
          entries: [
            {
              id: "seed-lunch",
              date: "2025-08-08",
              time: "Afternoon",
              title: "First Time I Made Lunch with My Hands for You 🍱",
              description: "August 8. The very first time I cooked lunch for you with my own hands. I carefully seasoned every dish with love, hoping it would bring you joy. Watching your face light up with that sweet smile after your very first bite is a memory I will treasure forever.",
              tags: ["homemadelunch", "cookedwithlove", "august8"],
              fav: true,
              category: "Important Memories",
              createdAt: Date.now() - 5,
            },
            {
              id: "seed-first-photo",
              date: "2025-08-08",
              time: "5:05 PM",
              title: "Our Very First Photo Taken 📸",
              description: "August 8 at 5:05 PM. The exact second our first photo was captured. Two happy souls standing together, smiles frozen in time. The camera captured that afternoon, but you captured my entire heart forever.",
              tags: ["firstphoto", "505pm", "capturedforever", "august8"],
              fav: true,
              category: "Important Memories",
              createdAt: Date.now() - 4,
            },
            {
              id: "seed-dinner-outing",
              date: "2025-08-30",
              time: "Evening",
              title: "First Outing with Dinner Together 🍽️✨",
              description: "August 30. Our very first official outing and dinner date. The aroma of delicious food, the sound of your laughter, and conversations that felt like they could go on forever. That evening, I knew I was sitting with my favorite person in the whole universe.",
              tags: ["firstouting", "dinnerdate", "magicalevening", "august30"],
              fav: true,
              category: "Favorite Moments",
              createdAt: Date.now() - 3,
            },
            {
              id: "seed-bike-ride",
              date: "2025-10-23",
              time: "Evening",
              title: "Our First Bike Ride Together 🏍️💨",
              description: "October 23. The rush of the cool evening breeze against our skin, the open road ahead, and you holding me tight from behind. With every curve in the road, my heart felt a quiet peace — because wherever we rode, you were right with me.",
              tags: ["firstbikeride", "windandfreedom", "holdingtight", "october23"],
              fav: true,
              category: "Important Memories",
              createdAt: Date.now() - 2,
            },
            {
              id: "seed-birthday",
              date: "2026-11-04",
              time: "12:00 AM",
              title: "Celebrating You — Happy Birthday, My Future Wife! 🎂💖",
              description: "November 4. The day the world was blessed with the kindest, most radiant soul. Celebrating you today and promising to stand by you, cherish you, and love you through every milestone still to come.",
              tags: ["birthday", "myfuturewife", "foreverlove", "november4"],
              fav: true,
              category: "Special Days",
              createdAt: Date.now() - 1,
            },
          ],
        });
      },
    }),
    { name: "fm-history-v3", storage: createJSONStorage(() => localStorage) }
  )
);

interface DiaryState {
  entries: DiaryEntry[];
  draft: { title: string; html: string } | null;
  add: (e: DiaryEntry) => void;
  update: (id: string, patch: Partial<DiaryEntry>) => void;
  remove: (id: string) => void;
  setDraft: (d: { title: string; html: string } | null) => void;
}

export const useDiary = create<DiaryState>()(
  persist(
    (set) => ({
      entries: [],
      draft: null,
      add: (e) => set((s) => ({ entries: [e, ...s.entries] })),
      update: (id, patch) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      setDraft: (d) => set({ draft: d }),
    }),
    { name: "fm-diary", storage: createJSONStorage(() => localStorage) }
  )
);

interface JournalState {
  entries: JournalEntry[];
  add: (e: JournalEntry) => void;
  update: (id: string, patch: Partial<JournalEntry>) => void;
  remove: (id: string) => void;
}

export const useJournal = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      add: (e) => set((s) => ({ entries: [e, ...s.entries] })),
      update: (id, patch) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
    }),
    { name: "fm-journal", storage: createJSONStorage(() => localStorage) }
  )
);

interface SpecialDaysState {
  days: SpecialDay[];
  add: (d: SpecialDay) => void;
  update: (id: string, patch: Partial<SpecialDay>) => void;
  remove: (id: string) => void;
}

export const useSpecialDays = create<SpecialDaysState>()(
  persist(
    (set) => ({
      days: [],
      add: (d) => set((s) => ({ days: [...s.days, d] })),
      update: (id, patch) =>
        set((s) => ({ days: s.days.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      remove: (id) => set((s) => ({ days: s.days.filter((d) => d.id !== id) })),
    }),
    { name: "fm-special-days", storage: createJSONStorage(() => localStorage) }
  )
);

interface VaultState {
  notes: VaultNote[];
  add: (n: VaultNote) => void;
  update: (id: string, patch: Partial<VaultNote>) => void;
  remove: (id: string) => void;
}

export const useVault = create<VaultState>()(
  persist(
    (set) => ({
      notes: [],
      add: (n) => set((s) => ({ notes: [n, ...s.notes] })),
      update: (id, patch) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
      remove: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: "fm-vault", storage: createJSONStorage(() => localStorage) }
  )
);

interface TracksState {
  tracks: { id: string; title: string; artist: string; src: string; fav: boolean }[];
  add: (t: { id: string; title: string; artist: string; src: string; fav: boolean }) => void;
  remove: (id: string) => void;
  toggleFav: (id: string) => void;
}

export const useTracks = create<TracksState>()(
  persist(
    (set) => ({
      tracks: [],
      add: (t) => set((s) => ({ tracks: [...s.tracks, t] })),
      remove: (id) => set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) })),
      toggleFav: (id) =>
        set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? { ...t, fav: !t.fav } : t)) })),
    }),
    { name: "fm-tracks", storage: createJSONStorage(() => localStorage) }
  )
);

/** Export everything as a downloadable JSON file. */
export function exportAllData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: useSettings.getState(),
    photos: usePhotos.getState().photos,
    history: useHistory.getState().entries,
    diary: useDiary.getState().entries,
    journal: useJournal.getState().entries,
    specialDays: useSpecialDays.getState().days,
    vaultNotes: useVault.getState().notes,
    tracks: useTracks.getState().tracks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forever-with-manju-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Compress an image file into a small data URL so localStorage survives. */
export function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
