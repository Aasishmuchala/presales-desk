"use client";

import { create } from "zustand";

/** Leads picked on the Leads screen, carried into "New calling list". */
export const useDraftList = create<{ leadIds: string[]; source: string; set: (ids: string[], source: string) => void; clear: () => void }>()(
  (set) => ({
    leadIds: [],
    source: "",
    set: (leadIds, source) => set({ leadIds, source }),
    clear: () => set({ leadIds: [], source: "" }),
  }),
);
