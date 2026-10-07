"use client";

import { useRef } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { UploadSimple } from "../icons";
import { useUpload } from "./upload";

export function KnowledgeHeader() {
  const docs = useStore((s) => s.docs);
  const questions = useStore((s) => s.questions);
  const projectId = useStore((s) => s.projectId);
  const upload = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const mine = docs.filter((d) => d.projectId === projectId);
  const drafts = mine.filter((d) => d.status === "draft").length;
  const open = questions.filter((q) => q.projectId === projectId && !q.answer).length;

  return (
    <>
      <PageHeader
        title="What the agent knows"
        size="xl"
        status={
          drafts
            ? `The agent answers only from approved documents. ${drafts} ${drafts === 1 ? "draft is" : "drafts are"} waiting for approval.`
            : "The agent answers only from approved documents, and says where each answer came from."
        }
        action={
          <Button variant="primary" size="lg" icon={<UploadSimple size={17} weight="bold" />} onClick={() => input.current?.click()}>
            Upload
          </Button>
        }
        tabs={[
          { href: "/knowledge", label: "Project", count: mine.filter((d) => d.book === "project").length, exact: true },
          { href: "/knowledge/legal", label: "Legal", count: mine.filter((d) => d.book === "legal").length },
          { href: "/knowledge/questions", label: "Questions it couldn't answer", count: open },
        ]}
      />
      <input
        ref={input}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.csv"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}
