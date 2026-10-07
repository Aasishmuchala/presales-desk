"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { KnowledgeDoc } from "@/lib/types";
import { UploadSimple } from "../icons";

const GUESSES: { re: RegExp; kind: string; book: KnowledgeDoc["book"]; title: string }[] = [
  { re: /price|rate|cost/i, kind: "Price sheet", book: "project", title: "Price sheet" },
  { re: /payment|plan|clp/i, kind: "Payment plan", book: "project", title: "Payment plan" },
  { re: /brochure|book|overview/i, kind: "Brochure", book: "project", title: "Project book" },
  { re: /rera|registration cert/i, kind: "Certificate", book: "legal", title: "RERA registration certificate" },
  { re: /agreement|afs|sale deed/i, kind: "Agreement", book: "legal", title: "Agreement for Sale" },
  { re: /cancel|refund/i, kind: "Policy", book: "legal", title: "Cancellation and refund policy" },
  { re: /gst|stamp|charges|registration/i, kind: "Charges note", book: "legal", title: "Charges" },
  { re: /title|noc|approval|permit/i, kind: "Approval", book: "legal", title: "Approvals and NOCs" },
];

const MAX_BYTES = 25 * 1024 * 1024;

export function useUpload() {
  const pathname = usePathname();
  const router = useRouter();
  const projectId = useStore((s) => s.projectId);
  const docs = useStore((s) => s.docs);
  const addDoc = useStore((s) => s.addDoc);
  const toast = useStore((s) => s.toast);

  return useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      let lastId = "";
      for (const file of list) {
        if (file.size > MAX_BYTES) {
          toast(`${file.name} is over 25 MB. Split it or compress it, then try again.`, "crit");
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["pdf", "docx", "doc", "txt", "md", "xlsx", "csv"].includes(ext)) {
          toast(`${file.name}: use PDF, Word, Excel, CSV or plain text.`, "crit");
          continue;
        }
        const guess = GUESSES.find((g) => g.re.test(file.name));
        const book = guess?.book ?? (pathname.startsWith("/knowledge/legal") ? "legal" : "project");
        const prior = docs.filter((d) => d.projectId === projectId && guess && d.title === guess.title);
        const latest = prior.sort((a, b) => b.version - a.version)[0];
        const version = latest ? latest.version + 1 : 1;

        let paras: string[];
        if (ext === "txt" || ext === "md" || ext === "csv") {
          const text = await file.text();
          paras = text
            .split(/\n\s*\n/)
            .map((p) => p.replace(/\s+/g, " ").trim())
            .filter(Boolean)
            .slice(0, 200)
            .map((p) => (/^#{1,3}\s/.test(p) ? `# ${p.replace(/^#{1,3}\s/, "")}` : p));
          if (paras.length === 0) paras = ["# Empty file", "This file has no text."];
        } else {
          paras = [
            "# Waiting to be read",
            `${file.name} is uploaded. Text and facts are pulled out by the document reader, which runs on the server. It is not connected in this preview, so the agent won't use this file yet.`,
          ];
        }

        lastId = addDoc({
          projectId,
          book,
          title: guess?.title ?? file.name.replace(/\.[^.]+$/, ""),
          kind: guess?.kind ?? "Unsorted",
          version,
          status: "draft",
          effective: "Not yet",
          updatedBy: "Anand Varma",
          pages: Math.max(1, Math.round(file.size / 3500)),
          paras,
          facts: [],
          ...(latest ? { previous: { version: latest.version, paras: latest.paras } } : {}),
        });
        toast(
          guess ? `${file.name} added as a draft ${guess.kind.toLowerCase()}. Approve it when it looks right.` : `${file.name} added. We couldn't tell what it is, so it's marked unsorted.`,
          guess ? "good" : "warn",
        );
      }
      if (list.length === 1 && lastId) router.push(`/knowledge/doc/${lastId}`);
    },
    [pathname, router, projectId, docs, addDoc, toast],
  );
}

/** Drop files anywhere on the Knowledge pages. */
export function DropZone() {
  const upload = useUpload();
  const [over, setOver] = useState(false);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setOver(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setOver(false);
    };
    const overFn = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setOver(false);
      if (e.dataTransfer?.files) void upload(e.dataTransfer.files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", overFn);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", overFn);
      window.removeEventListener("drop", drop);
      setOver(false);
    };
  }, [upload]);

  if (!over) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-[var(--overlay)] p-6">
      <div className="grid place-items-center gap-3 rounded-[12px] border-2 border-dashed border-accent bg-surface px-10 py-12 text-center">
        <UploadSimple size={32} className="text-accent" />
        <p className="display text-[28px] text-fg">Drop to add to the book</p>
        <p className="text-sm text-fg-2">PDF, Word, Excel or text. We guess the type from the file name.</p>
      </div>
    </div>
  );
}
