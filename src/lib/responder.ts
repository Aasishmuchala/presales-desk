import type { AgentConfig, Fact, KnowledgeDoc, Question } from "./types";

export interface Reply {
  text: string;
  source?: { docId: string; label: string; para: number };
  kind: "fact" | "answer" | "objection" | "handover" | "unknown" | "smalltalk" | "draft";
  /** The playbook situation that shaped this reply, shown to the team only. */
  playbook?: string;
}

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

const CONFIG_RE = /(\d(?:\.5)?)\s*-?\s*bhk/i;

const CONFIRM_LATER = "Let me get the team to confirm that exactly. You'll have it on WhatsApp today.";

// Clauses a buyer should check against their own agreement.
const BINDING_KINDS = new Set(["Agreement", "Policy"]);

type Hit = { doc: KnowledgeDoc; fact: Fact; score: number };

function bestHit(t: string, docs: KnowledgeDoc[]): Hit | null {
  let best: Hit | null = null;
  for (const d of docs) {
    for (const f of d.facts) {
      let score = 0;
      // Longer keywords are more specific, so they count for more.
      for (const k of f.keywords) if (t.includes(k.toLowerCase())) score += k.length;
      if (score > 0 && (!best || score > best.score)) best = { doc: d, fact: f, score };
    }
  }
  return best;
}

const sourceOf = (h: Hit) => ({ docId: h.doc.id, label: `${h.doc.title} v${h.doc.version}`, para: h.fact.para });

/** Turns a matched fact into what the agent says. Never reads out an unconfirmed fact. */
function factReply(t: string, hit: Hit): Reply {
  if (/ from$/.test(hit.fact.label) && !CONFIG_RE.test(t)) {
    const units = hit.doc.facts.filter((f) => / from$/.test(f.label));
    return {
      kind: "fact",
      text: `All-inclusive prices start at ${units.map((u) => `${u.value} for a ${u.label.replace(" from", "")}`).join(", ")}. GST, stamp duty and registration are extra.`,
      source: sourceOf(hit),
    };
  }
  if (!hit.fact.confirmed) return { kind: "unknown", text: CONFIRM_LATER };
  const sharesUnconfirmed = hit.doc.facts.some((f) => f.para === hit.fact.para && !f.confirmed);
  const para = hit.doc.paras[hit.fact.para];
  const text = sharesUnconfirmed || !para ? `${hit.fact.label}: ${hit.fact.value}.` : para;
  const legal = BINDING_KINDS.has(hit.doc.kind) ? " Please check this against your agreement too. Our legal team can walk you through it." : "";
  return { kind: "fact", text: `${text}${legal}`, source: sourceOf(hit) };
}

const OBJECTIONS: { words: string[]; match: string; extra?: string; fallback: string }[] = [
  {
    words: ["expensive", "costly", "too high", "zyada", "mehenga", "price is high", "ekkuva"],
    match: "price",
    extra: "Booking is 10% of the agreement value, and the rest is paid as construction progresses.",
    fallback: "I understand. Booking is 10% of the agreement value, and the rest is paid as construction progresses.",
  },
  {
    words: ["delay", "late", "on time", "delayed"],
    match: "late",
    extra: "If it is late, the Agreement for Sale pays you interest at SBI MCLR plus 2% for every month of delay.",
    fallback: "Possession is as stated in the RERA registration, and the agreement pays you interest for any delay.",
  },
  {
    words: ["send me", "send details", "whatsapp me", "bhej do", "pampandi"],
    match: "send",
    fallback: "Sure, I'm sending the brochure and price sheet on WhatsApp now. When is a good time to call you back for two minutes?",
  },
  {
    words: ["reliable", "trust", "track record", "genuine", "fraud", "money safe", "is my money"],
    match: "reliable",
    fallback: "The project is RERA registered, and buyers' money goes into a separate RERA account. You're welcome to visit the site and see the progress.",
  },
];

/**
 * The Try it brain. Mirrors the production rule: say a number, date or clause only
 * when an approved, confirmed document backs it. Otherwise promise a confirmation.
 */
export function respond(input: string, docs: KnowledgeDoc[], questions: Question[], agent: AgentConfig): Reply {
  // Keep decimals like "3.5" intact while dropping other punctuation.
  const t = ` ${input
    .toLowerCase()
    .replace(/(\d)\.(\d)/g, "$1#$2")
    .replace(/[?!.,]/g, " ")
    .replace(/#/g, ".")
    .replace(/\s+/g, " ")} `;

  if (has(t, [" person", " human", " sales team", " someone from", " manager", " real person", " kisi se"])) {
    return {
      kind: "handover",
      text: agent.handoverOnAsk
        ? `Of course. I'm connecting you to ${agent.handoverTo === "assigned" ? "your sales person" : "the next free person in the sales team"} now, and they'll have everything we discussed.`
        : "I can arrange that. Someone from the sales team will call you back today.",
    };
  }

  // Answers the team wrote in the questions inbox come first.
  for (const q of questions.filter((x) => x.answer)) {
    const words = q.text
      .toLowerCase()
      .replace(/[?.,]/g, "")
      .split(" ")
      .filter((w) => w.length > 4);
    const hits = words.filter((w) => t.includes(w)).length;
    if (hits >= 2 || (words.length > 0 && words.length <= 2 && hits === words.length)) {
      return { kind: "answer", text: q.answer!.text, source: q.answer!.docId ? { docId: q.answer!.docId, label: "Your answer", para: 0 } : undefined };
    }
  }

  const approvedHit = bestHit(t, docs.filter((d) => d.status === "approved"));
  const draftHit = bestHit(t, docs.filter((d) => d.status === "draft"));

  // Push-back: the playbook shapes the reply, but the words still come from the documents.
  for (const o of OBJECTIONS) {
    if (!has(t, o.words)) continue;
    const play = agent.objections.find((x) => x.when.toLowerCase().includes(o.match));
    if (!play) continue;
    if (approvedHit) {
      const base = factReply(t, approvedHit);
      if (base.kind === "fact") {
        return { ...base, kind: "objection", text: o.extra && !base.text.includes(o.extra.split(" ").slice(-4).join(" ")) && !(o.match === "late" && base.text.includes("interest")) ? `${base.text} ${o.extra}` : base.text, playbook: play.when };
      }
    }
    return { kind: "objection", text: o.fallback, playbook: play.when };
  }

  // A draft that matches better than anything approved means the terms are changing.
  if (draftHit && (!approvedHit || draftHit.score > approvedHit.score)) {
    return { kind: "draft", text: `The ${draftHit.doc.title.toLowerCase()} is being updated right now, so I'll have the team confirm the exact terms on WhatsApp today.` };
  }

  if (approvedHit) return factReply(t, approvedHit);

  if (has(t, [" hello", " hi ", " namaste", " namaskaram", " haan", " yes", " ok ", " okay"])) {
    return { kind: "smalltalk", text: "Great. Are you looking at a 2 BHK or a 3 BHK, and is it for your family or as an investment?" };
  }

  return { kind: "unknown", text: "That's a good question. I don't have it in our documents, so I'll have the team confirm on WhatsApp today." };
}
