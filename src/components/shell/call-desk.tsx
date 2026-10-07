"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { getRep, isLive, useLeadMap, useSalesReps, useTranscript } from "@/lib/selectors";
import { duration, LANG_NAME } from "@/lib/format";
import {
  ArrowSquareOut,
  ChatCircleText,
  Microphone,
  MicrophoneSlash,
  PaperPlaneRight,
  PhoneDisconnect,
  PhoneTransfer,
  SpeakerHigh,
  X,
} from "../icons";

export function CallDesk() {
  const desk = useStore((s) => s.desk);
  if (!desk) return null;
  return <DeskInner key={desk.callId} />;
}

function DeskInner() {
  const desk = useStore((s) => s.desk)!;
  const call = useStore((s) => s.calls.find((c) => c.id === desk.callId));
  const now = useStore((s) => s.nowMin);
  const setDesk = useStore((s) => s.setDesk);
  const closeDesk = useStore((s) => s.closeDesk);
  const updateCall = useStore((s) => s.updateCall);
  const whisper = useStore((s) => s.whisper);
  const toast = useStore((s) => s.toast);
  const updateLead = useStore((s) => s.updateLead);
  const leadMap = useLeadMap();
  const transcript = useTranscript(call);
  const salesReps = useSalesReps();
  const [panel, setPanel] = useState<"none" | "whisper" | "transfer">("none");
  const [note, setNote] = useState("");
  const whisperRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (panel === "whisper") whisperRef.current?.focus();
  }, [panel]);

  if (!call) return null;
  const lead = leadMap.get(call.leadId);
  if (!lead) return null;

  const live = isLive(call, now);
  const elapsed = Math.max(0, (Math.min(now, call.start + call.durationSec / 60) - call.start) * 60);
  const current = [...transcript].reverse().find((t) => t.at <= elapsed);
  const bridged = desk.mode === "bridged";

  const takeOver = () => {
    updateCall(call.id, { durationSec: Math.round(elapsed) + 900, outcome: "transferred" });
    setDesk({ mode: "bridged" });
    toast(`You're on the call with ${lead.name}. The agent stepped back and is taking notes.`, "good");
  };
  const endCall = () => {
    updateCall(call.id, { durationSec: Math.max(30, Math.round(elapsed)) });
    updateLead(lead.id, { stage: "hot", nextStep: "Follow up on today's call" });
    closeDesk();
    toast("Call ended. The summary and outcome are on the lead's page.", "good");
  };
  const transfer = (repId: string) => {
    const rep = getRep(repId);
    updateLead(lead.id, { repId, stage: "hot", nextStep: `${rep?.name ?? "Rep"} is on the call` });
    closeDesk();
    toast(`Transferred to ${rep?.name}. They have the call summary.`, "good");
  };
  const sendWhisper = () => {
    const text = note.trim();
    if (!text) return;
    whisper(text);
    setNote("");
    setPanel("none");
    toast("Sent to the agent. It will use this in its next reply.");
  };

  return (
    <div
      role="region"
      aria-label={`Call with ${lead.name}`}
      className="force-dark fixed inset-x-0 bottom-16 z-40 border-t border-line-strong bg-bg md:bottom-0 md:left-[72px] lg:left-[232px]"
    >
      {panel !== "none" && (
        <div className="border-b border-line px-4 py-3 md:px-6">
          {panel === "whisper" ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendWhisper();
              }}
            >
              <ChatCircleText size={18} className="shrink-0 text-fg-3" />
              <label htmlFor="whisper" className="sr-only">
                Note to the agent
              </label>
              <input
                id="whisper"
                ref={whisperRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell the agent something only it hears, like “offer the Saturday 11:30 slot”"
                className="h-9 min-w-0 flex-1 rounded-[var(--radius)] border border-line bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-3 focus:border-accent focus:outline-none"
              />
              <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-fill px-4 text-sm font-medium text-accent-ink">
                <PaperPlaneRight size={15} /> Send
              </button>
              <button type="button" onClick={() => setPanel("none")} aria-label="Close" className="p-2 text-fg-3 hover:text-fg">
                <X size={16} />
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-fg-2">Transfer to</span>
              {salesReps.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={!r.available}
                  onClick={() => transfer(r.id)}
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-line-strong px-3 text-[13px] text-fg hover:border-accent disabled:opacity-40"
                >
                  {r.name}
                  {!r.available && <span className="text-fg-3">busy</span>}
                </button>
              ))}
              <button type="button" onClick={() => setPanel("none")} aria-label="Close" className="ml-auto p-2 text-fg-3 hover:text-fg">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${live ? "live-dot bg-accent-fill" : "bg-fg-3"}`} aria-hidden="true" />
          <span className="tnum font-mono text-[22px] font-medium leading-none text-fg">{duration(elapsed)}</span>
          <div className="min-w-0">
            <Link href={`/leads/${lead.id}`} className="block truncate text-sm font-medium text-fg hover:underline">
              {lead.name}
            </Link>
            <span className="block truncate text-[12px] text-fg-3">
              {LANG_NAME[call.lang]} · {bridged ? (desk.muted ? "You are muted" : "You are on the call") : live ? "Listening in" : "Call ended"}
            </span>
          </div>
        </div>

        <p className="hidden min-w-0 flex-1 truncate text-[15px] text-fg-2 xl:block" aria-live="polite">
          {bridged ? (
            "The agent is listening and will write the summary when you hang up."
          ) : current ? (
            <>
              <span className="mr-2 text-[12px] uppercase tracking-wide text-fg-3">{current.speaker === "agent" ? "Agent" : lead.name.split(" ")[0]}</span>
              <span className="display text-[17px] text-fg">{current.text}</span>
            </>
          ) : (
            "Connecting…"
          )}
        </p>

        <div className="ml-auto flex items-center gap-2">
          {!live && !bridged ? (
            <>
              <Link
                href={`/leads/${lead.id}/calls/${call.id}`}
                onClick={closeDesk}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-line-strong px-3 text-sm text-fg hover:bg-surface-2"
              >
                <ArrowSquareOut size={15} /> Open record
              </Link>
              <button type="button" onClick={closeDesk} className="inline-flex h-9 items-center rounded-[var(--radius)] px-3 text-sm text-fg-2 hover:bg-surface-2">
                Close
              </button>
            </>
          ) : bridged ? (
            <>
              <DeskButton onClick={() => setDesk({ muted: !desk.muted })} label={desk.muted ? "Unmute" : "Mute"} pressed={desk.muted}>
                {desk.muted ? <MicrophoneSlash size={18} /> : <Microphone size={18} />}
              </DeskButton>
              <DeskButton onClick={() => setPanel(panel === "transfer" ? "none" : "transfer")} label="Transfer">
                <PhoneTransfer size={18} />
              </DeskButton>
              <button type="button" onClick={endCall} className="inline-flex h-11 items-center gap-2 rounded-full bg-crit px-5 text-sm font-semibold text-bg">
                <PhoneDisconnect size={18} weight="fill" /> End call
              </button>
            </>
          ) : (
            <>
              <DeskButton onClick={() => setPanel(panel === "whisper" ? "none" : "whisper")} label="Whisper">
                <ChatCircleText size={18} />
              </DeskButton>
              <button
                type="button"
                onClick={takeOver}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-ink"
              >
                <SpeakerHigh size={18} weight="fill" /> Take over
              </button>
              <DeskButton onClick={closeDesk} label="Leave">
                <X size={18} />
              </DeskButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeskButton({ onClick, label, children, pressed }: { onClick: () => void; label: string; children: React.ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`inline-flex h-11 items-center gap-2 rounded-[var(--radius)] border px-3.5 text-sm transition-colors ${
        pressed ? "border-accent bg-accent-soft text-accent" : "border-line-strong text-fg hover:bg-surface-2"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
