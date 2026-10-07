import { hashString, mulberry32, pick } from "../rand";
import { AGENT_NAME } from "../brand";
import type { Call, Lang, Lead, Project, Turn } from "../types";
import { PRICE_PARAMS } from "./docs";
import { REPS } from "./seed";

type Line = Omit<Turn, "at">;

const yes: Record<Lang, string[]> = {
  EN: ["Yes, go ahead.", "Sure, tell me.", "Yes, I have a couple of minutes."],
  HI: ["Haan ji, boliye.", "Haan, bolo. Do minute hai.", "Ji, bataiye."],
  TE: ["Cheppandi, parledu.", "Haa, cheppandi.", "Ok andi, cheppandi."],
};

const askPrice: Record<Lang, (cfg: string) => string> = {
  EN: (c) => `What's the price for a ${c}?`,
  HI: (c) => `${c} ka price kya hai, all inclusive?`,
  TE: (c) => `${c} ki price entha andi?`,
};

const askPossession: Record<Lang, string> = {
  EN: "And when is possession?",
  HI: "Possession kab tak milega?",
  TE: "Possession eppudu istaru?",
};

const askLoan: Record<Lang, string> = {
  EN: "Which banks give a loan on this project?",
  HI: "Loan kaunse bank se ho jayega?",
  TE: "Loan ye banks istayi?",
};

const close: Record<string, Record<Lang, string>> = {
  booked: {
    EN: "Saturday morning works. Book it.",
    HI: "Theek hai, Saturday subah rakh lijiye.",
    TE: "Saturday morning ok andi, book cheyyandi.",
  },
  callback: {
    EN: "I'm driving now. Can you call me after 7?",
    HI: "Abhi drive kar raha hoon, saat baje ke baad call kariye.",
    TE: "Ippudu drive chestunna, 7 tarvata call cheyyandi.",
  },
  not_now: {
    EN: "We're not looking right now, maybe next year.",
    HI: "Abhi plan nahi hai, shayad agle saal.",
    TE: "Ippudu plan ledu andi, next year chuddam.",
  },
  info_sent: {
    EN: "Send me everything on WhatsApp, I'll go through it.",
    HI: "WhatsApp pe sab bhej dijiye, main dekh leta hoon.",
    TE: "WhatsApp lo pampandi, nenu chustanu.",
  },
  transferred: {
    EN: "Can I speak to someone from the sales team directly?",
    HI: "Kya main sales team mein kisi se seedha baat kar sakta hoon?",
    TE: "Sales team lo evarithonaina direct ga matladocha?",
  },
  qualified: {
    EN: "Looks good. We want to finalise in the next two months.",
    HI: "Accha lag raha hai. Do mahine mein finalise karna hai.",
    TE: "Bagundi. Rendu nelallo finalise cheyyali.",
  },
  opted_out: {
    EN: "Please don't call me again.",
    HI: "Please mujhe dobara call mat kijiye.",
    TE: "Please malli call cheyyakandi.",
  },
};

const agentCloseFor = (rep: string): Record<string, string> => ({
  booked: `Done. You're booked for a site visit on Saturday at 11:30. ${rep} from our team will meet you at the sales office, and I'm sending the location on WhatsApp now.`,
  callback: "No problem. I'll call you back after 7 this evening. Drive safe.",
  not_now: "Understood. I'll send the brochure on WhatsApp so you have it, and check in after a month if that's alright.",
  info_sent: "Sending the brochure, floor plan and price sheet to this number on WhatsApp now. I'll message you in two days with site-visit slots.",
  transferred: `Of course. I'm connecting you to ${rep} from our sales team now. They'll have everything we discussed.`,
  qualified: `Thank you. I'll share two site-visit slots on WhatsApp, and ${rep} from our team will call you today.`,
  opted_out: "I'm sorry for the trouble. I've removed your number and you won't get calls from us again.",
});

export function buildTranscript(call: Call, lead: Lead, project: Project, opening: string): Turn[] {
  const r = mulberry32(hashString(call.id));
  const lang = call.lang;
  const unit = PRICE_PARAMS[project.id].units.find((u) => u.config === lead.config) ?? PRICE_PARAMS[project.id].units[0];
  const unitIdx = PRICE_PARAMS[project.id].units.indexOf(unit);
  const priceDoc = `${project.id}-price`;
  const bookDoc = `${project.id}-book`;
  const reraDoc = `${project.id}-rera`;
  const payDoc = `${project.id}-payment`;

  if (call.result !== "connected") {
    const note =
      call.result === "voicemail"
        ? `Voicemail. ${AGENT_NAME} left a short message and sent a WhatsApp with the brochure.`
        : call.result === "busy"
          ? "Line busy. Retry scheduled on a different hour."
          : "No answer. Retry scheduled on a different hour.";
    return [{ speaker: "agent", text: note, at: 0, lang: "EN" }];
  }

  const lines: Line[] = [
    { speaker: "agent", text: opening.replace("{project}", project.name), lang },
    { speaker: "lead", text: pick(r, yes[lang]), lang },
    {
      speaker: "agent",
      text: `Thank you. You enquired on ${lead.source} about a ${lead.config}. Is that still what you're looking for?`,
      lang: "EN",
    },
    {
      speaker: "lead",
      text:
        lang === "EN"
          ? `Yes, a ${lead.config}${lead.facing ? `, ${lead.facing.toLowerCase()} facing if possible` : ""}.`
          : lang === "HI"
            ? `Haan, ${lead.config}${lead.facing ? `, ${lead.facing.toLowerCase()} facing ho toh accha` : ""}.`
            : `Avunu, ${lead.config}${lead.facing ? `, ${lead.facing.toLowerCase()} facing aithe better` : ""}.`,
      lang,
    },
    {
      speaker: "agent",
      text: `We have ${lead.config} homes with ${unit.carpet.toLocaleString("en-IN")} sq ft of carpet area across ${project.towers} towers.`,
      lang: "EN",
      cites: [{ docId: priceDoc, para: 5 + unitIdx, label: "Price sheet v7" }],
    },
    { speaker: "lead", text: askPrice[lang](lead.config), lang },
    {
      speaker: "agent",
      text: `The all-inclusive price starts at ₹${(unit.fromLakh / 100).toFixed(2)} crore. GST, stamp duty and registration are extra.`,
      lang: "EN",
      cites: [{ docId: priceDoc, para: 5 + unitIdx, label: "Price sheet v7" }],
    },
    { speaker: "lead", text: askPossession[lang], lang },
    {
      speaker: "agent",
      text: `Possession is ${project.possession === "Dec 2027" ? "December 2027" : "March 2028"}, as stated in the RERA registration ${project.rera}.`,
      lang: "EN",
      cites: [
        { docId: bookDoc, para: 4, label: "Project book v4" },
        { docId: reraDoc, para: 1, label: "RERA certificate" },
      ],
    },
  ];

  if (r() < 0.6) {
    lines.push(
      { speaker: "lead", text: askLoan[lang], lang },
      {
        speaker: "agent",
        text: "The project is approved by SBI, HDFC Bank, ICICI Bank, Axis Bank and LIC Housing Finance. Booking is 10% of the agreement value.",
        lang: "EN",
        cites: [{ docId: payDoc, para: 7, label: "Payment plan v2" }],
      },
    );
  }

  const outcome = call.outcome ?? "info_sent";
  if (outcome === "booked") {
    lines.push({
      speaker: "agent",
      text: "Would you like to see the site? I can offer Saturday at 11:30 or Sunday at 4:30.",
      lang: "EN",
    });
  }
  lines.push({ speaker: "lead", text: close[outcome][lang], lang });
  const rep = REPS.find((x) => x.id === lead.repId)?.name.split(" ")[0] ?? "our sales person";
  lines.push({ speaker: "agent", text: agentCloseFor(rep)[outcome], lang: "EN" });

  // Spread the turns across the real call length.
  const weights = lines.map((l) => l.text.split(" ").length * 0.42 + 1.1);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = call.durationSec * 0.94;
  let t = 0.6;
  return lines.map((l, i) => {
    const turn: Turn = { ...l, at: Math.round(t * 10) / 10 };
    t += (weights[i] / total) * span;
    return turn;
  });
}
