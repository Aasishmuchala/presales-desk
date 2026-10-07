"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useProject } from "@/lib/selectors";
import { respond, type Reply } from "@/lib/responder";
import { LANG_NAME } from "@/lib/format";
import type { Lang } from "@/lib/types";
import { AGENT_NAME } from "@/lib/brand";
import { ArrowsClockwise, FileText, PaperPlaneRight, SpeakerHigh } from "../icons";

interface Msg {
  from: "agent" | "you";
  text: string;
  reply?: Reply;
}

const SUGGESTIONS = ["What's the price of a 3 BHK?", "Possession kab tak hai?", "Is the RERA number registered?", "Can I pay from my NRE account?", "The price feels too high", "Can I talk to a person?"];

const VOICE_LANG: Record<Lang, string> = { EN: "en-IN", HI: "hi-IN", TE: "te-IN" };

export function speak(text: string, lang: Lang): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const wanted = VOICE_LANG[lang];
  const voice = voices.find((v) => v.lang === wanted) ?? voices.find((v) => v.lang.startsWith(wanted.slice(0, 2))) ?? (lang === "EN" ? voices.find((v) => v.lang.startsWith("en")) : undefined);
  if (!voice) return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 1;
  synth.speak(u);
  return true;
}

export function TryIt() {
  const project = useProject();
  const draft = useStore((s) => s.agentDraft);
  const docs = useStore((s) => s.docs);
  const questions = useStore((s) => s.questions);
  const projectId = useStore((s) => s.projectId);
  const addQuestion = useStore((s) => s.addQuestion);
  const markTestCall = useStore((s) => s.markTestCall);
  const testCallDone = useStore((s) => s.testCallDone);
  const toast = useStore((s) => s.toast);
  const now = useStore((s) => s.nowMin);
  const [lang, setLang] = useState<Lang>(draft.langs[0] ?? "EN");
  const [voiceOn, setVoiceOn] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const sentCount = useRef(0);

  const opening = draft.opening[lang].replace("{project}", project.name);

  useLayoutEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const reply = respond(
      q,
      docs.filter((d) => d.projectId === projectId),
      questions.filter((x) => x.projectId === projectId),
      draft,
    );
    setMsgs((m) => [...m, { from: "you", text: q }, { from: "agent", text: reply.text, reply }]);
    setInput("");
    if (reply.kind === "unknown") {
      addQuestion({
        projectId,
        text: q.endsWith("?") ? q : `${q}?`,
        quote: q,
        leadId: "",
        asked: 1,
        category: "From a test call",
        lastAsked: now,
      });
    }
    if (voiceOn && !speak(reply.text, "EN")) toast("This browser has no voice for that language.", "warn");
    sentCount.current += 1;
    if (sentCount.current === 2 && !testCallDone) {
      markTestCall();
      toast("Test call done. That setup step is complete.", "good");
    }
  };

  const restart = () => {
    setMsgs([]);
    sentCount.current = 0;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  return (
    <section id="try" aria-label="Try the agent" className="force-dark flex min-h-[560px] scroll-mt-24 flex-col overflow-hidden rounded-[10px] border border-line bg-bg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Try it</h2>
          <p className="text-[12px] text-fg-3">Play the lead. Uses your unsaved changes.</p>
        </div>
        <div className="flex items-center gap-1">
          {draft.langs.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={`h-7 rounded-full px-2.5 text-[12px] ${lang === l ? "bg-surface-3 text-fg" : "text-fg-3 hover:text-fg"}`}
            >
              {LANG_NAME[l]}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={voiceOn}
            onClick={() => {
              const next = !voiceOn;
              setVoiceOn(next);
              if (next && !speak(opening, lang)) toast(`This browser has no ${LANG_NAME[lang]} voice. Replies will stay as text.`, "warn");
            }}
            className={`ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full ${voiceOn ? "bg-accent-fill text-accent-ink" : "text-fg-3 hover:text-fg"}`}
            aria-label={voiceOn ? "Stop speaking replies" : "Speak replies out loud"}
            title={voiceOn ? "Stop speaking replies" : "Speak replies out loud"}
          >
            <SpeakerHigh size={15} />
          </button>
          <button type="button" onClick={restart} className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-3 hover:text-fg" aria-label="Start again" title="Start again">
            <ArrowsClockwise size={15} />
          </button>
        </div>
      </div>

      <div ref={listRef} className="scroll-y flex-1 space-y-4 px-4 py-4" aria-live="polite">
        <Bubble from="agent" text={opening} name={AGENT_NAME} />
        {msgs.map((m, i) => (
          <div key={i}>
            <Bubble from={m.from} text={m.text} name={m.from === "agent" ? AGENT_NAME : "You"} />
            {m.reply?.source && (
              <Link
                href={`/knowledge/doc/${m.reply.source.docId}${m.reply.source.para ? `#p${m.reply.source.para}` : ""}`}
                className="ml-0.5 mt-1.5 inline-flex h-6 items-center gap-1 rounded-full border border-accent/60 px-2 text-[11px] text-accent hover:bg-accent-soft"
              >
                <FileText size={12} /> {m.reply.source.label}
              </Link>
            )}
            {m.reply?.playbook && <p className="mt-1.5 text-[11px] text-fg-3">Shaped by your playbook: “{m.reply.playbook}”</p>}
            {m.reply?.kind === "unknown" && <p className="mt-1.5 text-[11px] text-fg-3">Added to “Questions it couldn&apos;t answer”.</p>}
          </div>
        ))}
      </div>

      <div className="border-t border-line px-4 py-3">
        {msgs.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="h-7 rounded-full border border-line-strong px-2.5 text-[12px] text-fg-2 hover:border-accent hover:text-fg">
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="try-input" className="sr-only">
            Say something as the lead
          </label>
          <input
            id="try-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask like a buyer would"
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-4 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
          />
          <button type="submit" disabled={!input.trim()} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-fill text-accent-ink disabled:opacity-40">
            <PaperPlaneRight size={17} weight="fill" />
          </button>
        </form>
      </div>
    </section>
  );
}

function Bubble({ from, text, name }: { from: "agent" | "you"; text: string; name: string }) {
  return (
    <div className={`flex flex-col ${from === "you" ? "items-end" : "items-start"}`}>
      <span className="mb-1 text-[11px] text-fg-3">{name}</span>
      <p
        className={`max-w-[88%] rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
          from === "you" ? "rounded-br-[4px] bg-accent-fill text-accent-ink" : "rounded-bl-[4px] bg-surface-2 text-fg"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
