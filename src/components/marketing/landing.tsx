"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useLeadMap, useTodayCalls } from "@/lib/selectors";
import { APP_NAME } from "@/lib/brand";
import { SEED } from "@/lib/mock/seed";
import { buttonClass, LinkButton } from "../ui/button";
import { Pill, Score } from "../ui/pill";
import { ArrowRight, CheckCircle, Ear, PhoneDisconnect, SpeakerHigh } from "../icons";
import { Floor } from "../today/floor";
import { ThemeToggle } from "../shell/theme-toggle";
import { KineticDemo } from "./kinetic-demo";

const STEPS = [
  {
    id: "floor",
    title: "Watch the whole day as it happens",
    body: "Every call the agent makes lands on one timeline, lit while it's live. Point at any minute to hear that call.",
  },
  {
    id: "dossier",
    title: "Every lead reads like a brief",
    body: "After each call the agent writes one sentence about what the buyer wants. Your team reads that, not a transcript.",
  },
  {
    id: "facts",
    title: "Answers carry their source",
    body: "Prices, dates and clauses come only from approved documents. Anything else, the agent promises to confirm and asks you.",
  },
  {
    id: "desk",
    title: "Step in with one tap",
    body: "Listen to any call, whisper the agent a hint, or take over. When a buyer asks for a person, the right person gets the call.",
  },
] as const;

export function Landing() {
  const [active, setActive] = useState<string>(STEPS[0].id);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.getAttribute("data-step") ?? STEPS[0].id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-fg">
          <span className="display grid h-8 w-8 place-items-center rounded-full bg-accent-fill text-[15px] text-accent-ink">P</span>
          <span className="display text-[18px]">{APP_NAME}</span>
        </Link>
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-3">
          <a href="#how" className="hidden px-2 text-sm text-fg-2 hover:text-fg sm:inline">
            How it works
          </a>
          <a href="#compliance" className="hidden px-2 text-sm text-fg-2 hover:text-fg sm:inline">
            Compliance
          </a>
          <ThemeToggle />
          <LinkButton href="/sign-in" variant="primary" size="md">
            Sign in
          </LinkButton>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
          <h1 className="display max-w-[16ch] text-[clamp(44px,8vw,104px)] leading-[0.95] text-fg [overflow-wrap:anywhere]">
            Every enquiry gets a call. Every answer has a source.
          </h1>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
            <p className="max-w-[52ch] text-[18px] leading-relaxed text-fg-2">
              An AI caller for pre-sale real estate. It rings new leads within two minutes in English, Hindi or Telugu, answers from your project and legal books,
              books site visits, and hands hot buyers to your sales team with a brief.
            </p>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <LinkButton href="/sign-in" variant="primary" size="lg" icon={<ArrowRight size={17} />}>
                Sign in
              </LinkButton>
              <a href="#how" className={buttonClass("secondary", "lg")}>
                See how it works
              </a>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <FloorPreview />
            <KineticDemo />
          </div>
        </section>

        <section id="how" className="scroll-mt-8 border-t border-line">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div className="lg:sticky lg:top-16 lg:self-start">
              <h2 className="display text-[clamp(32px,4vw,52px)] text-fg">How it works</h2>
              <ol className="mt-8 grid gap-1">
                {STEPS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#step-${s.id}`}
                      aria-current={active === s.id ? "step" : undefined}
                      className={`block rounded-[var(--radius)] px-4 py-3 transition-colors ${active === s.id ? "bg-surface-2" : "hover:bg-surface"}`}
                    >
                      <span className={`block text-[17px] font-medium ${active === s.id ? "text-fg" : "text-fg-3"}`}>{s.title}</span>
                      <span className={`mt-1 block max-w-[46ch] text-sm leading-relaxed ${active === s.id ? "text-fg-2" : "hidden text-fg-3 lg:block lg:opacity-0"}`}>
                        {s.body}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-24">
              {STEPS.map((s) => (
                <section
                  key={s.id}
                  id={`step-${s.id}`}
                  data-step={s.id}
                  ref={(el) => {
                    refs.current[s.id] = el;
                  }}
                  className="scroll-mt-16"
                  aria-label={s.title}
                >
                  <p className="mb-4 text-[15px] font-medium text-fg lg:hidden">{s.title}</p>
                  {s.id === "floor" && <FloorPreview tall />}
                  {s.id === "dossier" && <DossierPreview />}
                  {s.id === "facts" && <FactsPreview />}
                  {s.id === "desk" && <DeskPreview />}
                  <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-fg-2 lg:hidden">{s.body}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section id="compliance" className="scroll-mt-8 border-t border-line">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <div>
              <h2 className="display text-[clamp(32px,4vw,52px)] text-fg">Built for Indian rules</h2>
              <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-fg-2">
                Calling buyers at scale only works if it stays legal. These are switched on from the first call, not left to a setting.
              </p>
            </div>
            <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {[
                ["Do-not-call checked daily", "Every number is checked against the national registry before it's dialled."],
                ["Calls only from 9 am to 9 pm", "The calling window is locked to TRAI hours. Lists can be stricter, never looser."],
                ["Says it's an AI, every time", "The first sentence of every call says it's an AI assistant and that the call is recorded."],
                ["Registered message templates", "WhatsApp and SMS go out from DLT-registered templates only."],
                ["Consent and retention", "Consent is captured on the call. Recordings are deleted on schedule or on request."],
                ["RERA-accurate answers", "The agent quotes the RERA number and promises nothing beyond the registered documents."],
              ].map(([t, b]) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-good" />
                  <span>
                    <span className="block text-[15px] font-medium text-fg">{t}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-fg-2">{b}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-8 px-4 py-20 sm:px-8">
            <h2 className="display max-w-[18ch] text-[clamp(32px,5vw,64px)] text-fg">Start with one project and one calling list.</h2>
            <LinkButton href="/sign-in" variant="primary" size="lg" icon={<ArrowRight size={17} />}>
              Sign in
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-fg-3 sm:px-8">
          <span>{APP_NAME}. Pre-sale calling for real estate in India.</span>
          <span>The console shows sample data until your CRM is connected.</span>
        </div>
      </footer>
    </div>
  );
}

function FloorPreview({ tall }: { tall?: boolean }) {
  const calls = useTodayCalls();
  const now = useStore((s) => s.nowMin);
  const leadMap = useLeadMap();
  const live = calls.filter((c) => c.result === "connected" && now < c.start + c.durationSec / 60).length;
  return (
    <figure className={`min-w-0 rounded-[12px] border border-line bg-surface p-5 sm:p-7 ${tall ? "" : ""}`}>
      <div className="mb-8 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-fg">The floor</span>
        <span className="text-[13px] text-fg-3">
          <span className="tnum font-mono text-accent">{live}</span> calls live now
        </span>
      </div>
      <Floor calls={calls} now={now} leadMap={leadMap} preview />
      <figcaption className="mt-4 text-[13px] text-fg-3">A sample project&apos;s calling day, 09:00 to 21:00. Lit bars are calls happening now.</figcaption>
    </figure>
  );
}

function DossierPreview() {
  const lead = SEED.leads.find((l) => l.stage === "booked" && l.facing) ?? SEED.leads.find((l) => l.stage === "booked")!;
  return (
    <figure className="rounded-[12px] border border-line bg-surface p-6 sm:p-8">
      <p className="display text-[clamp(32px,4vw,48px)] text-fg">{lead.name}</p>
      <p className="display mt-4 max-w-[34ch] text-[clamp(19px,2vw,24px)] leading-snug text-fg">{lead.summary}</p>
      <p className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-fg-3">
        <span className="tnum font-mono text-fg-2">{lead.phone.replace(/\d{5}$/, "·····")}</span>
        <span className="flex items-center gap-1.5">
          Score <Score value={lead.score} />
        </span>
        <Pill tone="good">Visit booked</Pill>
      </p>
      <figcaption className="sr-only">A lead page from the sample data</figcaption>
    </figure>
  );
}

function FactsPreview() {
  const doc = SEED.docs.find((d) => d.id === "vanam-afs")!;
  const rows = [3, 5];
  return (
    <figure className="paper-surface rounded-[12px] border border-line p-6 sm:p-8">
      <p className="display text-[26px] text-fg">{doc.title}</p>
      <div className="mt-6 grid gap-5">
        {rows.map((i) => (
          <div key={i} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px]">
            <p className="text-[15px] leading-[1.7] text-fg">{doc.paras[i]}</p>
            <ul className="grid content-start gap-2">
              {doc.facts
                .filter((f) => f.para === i)
                .map((f) => (
                  <li key={f.id} className={`rounded-[var(--radius)] border px-3 py-2 text-[13px] ${f.confirmed ? "border-line bg-surface-2" : "border-warn/60 bg-warn-soft"}`}>
                    <span className="block text-fg-3">{f.label}</span>
                    <span className="block font-medium text-fg">{f.value}</span>
                    <span className={`mt-1 block text-[12px] ${f.confirmed ? "text-good" : "text-warn"}`}>{f.confirmed ? "Confirmed" : "Needs a check"}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <figcaption className="mt-5 text-[13px] text-fg-2">Facts sit beside the line they came from. Ones marked “needs a check” are never quoted.</figcaption>
    </figure>
  );
}

function DeskPreview() {
  const [mode, setMode] = useState<"listen" | "on" | "ended">("listen");
  return (
    <figure className="force-dark overflow-hidden rounded-[12px] border border-line bg-bg">
      <div className="px-5 py-6 sm:px-7">
        <p className="text-[12px] text-fg-3">{mode === "listen" ? "The lead just said" : mode === "on" ? "You're on the call" : "Call ended"}</p>
        <p className="display mt-1 text-[clamp(20px,2.4vw,28px)] leading-snug text-fg">
          {mode === "listen"
            ? "“Can I speak to someone from the sales team directly?”"
            : mode === "on"
              ? "The agent stepped back and is taking notes for the summary."
              : "The summary and next step are on the lead's page."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line-strong px-5 py-4 sm:px-7">
        <span className={`h-2.5 w-2.5 rounded-full ${mode === "ended" ? "bg-fg-3" : "live-dot bg-accent-fill"}`} aria-hidden="true" />
        <span className="tnum font-mono text-[22px] text-fg">3:48</span>
        <span className="ml-auto flex flex-wrap gap-2">
          {mode === "listen" && (
            <button type="button" onClick={() => setMode("on")} className="inline-flex h-10 items-center gap-2 rounded-full bg-accent-fill px-4 text-sm font-semibold text-accent-ink">
              <SpeakerHigh size={17} weight="fill" /> Take over
            </button>
          )}
          {mode === "on" && (
            <button type="button" onClick={() => setMode("ended")} className="inline-flex h-10 items-center gap-2 rounded-full bg-crit px-4 text-sm font-semibold text-bg">
              <PhoneDisconnect size={17} weight="fill" /> End call
            </button>
          )}
          {mode === "ended" && (
            <button type="button" onClick={() => setMode("listen")} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-line-strong px-3 text-sm text-fg">
              <Ear size={17} /> Try again
            </button>
          )}
        </span>
      </div>
      <figcaption className="sr-only">A working copy of the call desk from the console</figcaption>
    </figure>
  );
}
