"use client";

import { create } from "zustand";

export const usePalette = create<{ open: boolean; setOpen: (v: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
