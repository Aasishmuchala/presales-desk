import type { Fact, KnowledgeDoc, Project } from "../types";

interface PriceParams {
  rate: number;
  units: { config: string; carpet: number; saleable: number; fromLakh: number }[];
}

export const PRICE_PARAMS: Record<string, PriceParams> = {
  vanam: {
    rate: 7850,
    units: [
      { config: "2 BHK", carpet: 1184, saleable: 1610, fromLakh: 126 },
      { config: "3 BHK", carpet: 1412, saleable: 1920, fromLakh: 151 },
      { config: "3.5 BHK", carpet: 1690, saleable: 2300, fromLakh: 181 },
      { config: "4 BHK", carpet: 2050, saleable: 2790, fromLakh: 220 },
    ],
  },
  tara: {
    rate: 6450,
    units: [
      { config: "2 BHK", carpet: 1096, saleable: 1490, fromLakh: 96 },
      { config: "3 BHK", carpet: 1325, saleable: 1800, fromLakh: 116 },
      { config: "3.5 BHK", carpet: 1580, saleable: 2150, fromLakh: 139 },
    ],
  },
};

const PROJECT_FACTS: Record<
  string,
  {
    acres: string;
    towers: string;
    units: number;
    open: string;
    club: string;
    possession: string;
    target: string;
    location: string;
    schools: string;
    promoter: string;
    escrowBank: string;
    regDate: string;
  }
> = {
  vanam: {
    acres: "5.2 acres",
    towers: "2 towers of G+32 floors",
    units: 612,
    open: "72%",
    club: "48,000 sq ft",
    possession: "December 2027",
    target: "June 2027",
    location:
      "4 minutes to the Outer Ring Road Kokapet exit, 15 minutes to the Financial District and 35 minutes to Rajiv Gandhi International Airport in normal traffic.",
    schools: "Oakridge International, Chirec Kokapet and Delhi Public School Nanakramguda",
    promoter: "Vanam Developers LLP, Hyderabad",
    escrowBank: "HDFC Bank, Jubilee Hills branch",
    regDate: "14 March 2024",
  },
  tara: {
    acres: "7.4 acres",
    towers: "3 towers of G+24 floors",
    units: 820,
    open: "68%",
    club: "36,500 sq ft",
    possession: "March 2028",
    target: "December 2027",
    location:
      "6 minutes to the Outer Ring Road Tellapur exit, 20 minutes to the Financial District and 45 minutes to Rajiv Gandhi International Airport in normal traffic.",
    schools: "Oakridge Bachupally campus shuttle, Glendale Academy and Sancta Maria",
    promoter: "Tara Infra Projects Pvt Ltd, Hyderabad",
    escrowBank: "ICICI Bank, Gachibowli branch",
    regDate: "2 August 2024",
  },
};

let factSeq = 0;
function fact(
  label: string,
  value: string,
  para: number,
  keywords: string[],
  confidence: "high" | "check" = "high",
  confirmed = true,
): Fact {
  factSeq += 1;
  return { id: `f${factSeq}`, label, value, para, keywords, confidence, confirmed };
}

function priceSheet(p: Project): KnowledgeDoc {
  const pp = PRICE_PARAMS[p.id];
  const paras: string[] = [
    "# Base price",
    `Base rate for all towers is ₹${pp.rate.toLocaleString("en-IN")} per sq ft of saleable area, effective 1 October 2026.`,
    "Floor rise of ₹40 per sq ft applies from the 6th floor upwards. Units on the 20th floor and above carry ₹60 per sq ft.",
    "East-facing units carry a preferential location charge of ₹150 per sq ft.",
    "# Unit prices",
    ...pp.units.map(
      (u) =>
        `${u.config}, ${u.carpet.toLocaleString("en-IN")} sq ft carpet (${u.saleable.toLocaleString("en-IN")} sq ft saleable): all-inclusive from ₹${(u.fromLakh / 100).toFixed(2)} Cr.`,
    ),
    "All-inclusive prices include car parking for one car, clubhouse membership and the corpus fund. They exclude GST, stamp duty and registration.",
    "# Validity",
    "Prices are valid until 31 October 2026 and may be revised for new bookings after that date.",
  ];
  const facts: Fact[] = [
    fact("Base rate", `₹${pp.rate.toLocaleString("en-IN")} / sq ft`, 1, ["rate", "per sq ft", "sqft", "base"]),
    fact("Floor rise", "₹40 / sq ft from 6th floor", 2, ["floor rise", "higher floor"]),
    fact("East-facing charge", "₹150 / sq ft", 3, ["east", "facing", "plc"]),
    ...pp.units.map((u, i) =>
      fact(
        `${u.config} from`,
        `₹${(u.fromLakh / 100).toFixed(2)} Cr`,
        5 + i,
        [u.config.toLowerCase().replace(" ", ""), u.config.toLowerCase(), "price", "cost", "kitna", "entha"],
      ),
    ),
    ...pp.units.map((u, i) =>
      fact(`${u.config} carpet`, `${u.carpet.toLocaleString("en-IN")} sq ft`, 5 + i, [u.config.toLowerCase(), u.config.toLowerCase().replace(" ", ""), "carpet", "area", "size", "how big"]),
    ),
    fact("Included in price", "1 car park, clubhouse, corpus", 5 + pp.units.length, ["parking", "included", "include", "inclusive", "membership", "clubhouse fee"], "check", false),
  ];
  return {
    id: `${p.id}-price`,
    projectId: p.id,
    book: "project",
    title: "Price sheet",
    kind: "Price sheet",
    version: 7,
    status: "approved",
    effective: "1 Oct 2026",
    updatedBy: "Kiran Goud",
    pages: 2,
    paras,
    facts,
  };
}

function paymentPlan(p: Project): KnowledgeDoc {
  const paras = [
    "# Construction-linked plan",
    "10% of the agreement value on booking, payable within 15 days of the allotment letter.",
    "20% on signing the Agreement for Sale, within 30 days of booking.",
    "10% each on completion of the 5th, 10th, 15th and 20th floor slabs.",
    "15% on completion of brickwork and plastering of the apartment.",
    "15% on handover of possession, along with registration.",
    "# Home loans",
    "Approved by SBI, HDFC Bank, ICICI Bank, Axis Bank and LIC Housing Finance. Approval letters are attached in the appendix.",
    "# Subvention",
    "No interest subvention scheme is offered on this project.",
  ];
  return {
    id: `${p.id}-payment`,
    projectId: p.id,
    book: "project",
    title: "Payment plan",
    kind: "Payment plan",
    version: 2,
    status: "approved",
    effective: "1 Sep 2026",
    updatedBy: "Kiran Goud",
    pages: 1,
    paras,
    facts: [
      fact("Booking amount", "10% of agreement value", 1, ["booking amount", "token", "advance", "booking"]),
      fact("On agreement", "20% within 30 days", 2, ["agreement", "payment plan", "installment"]),
      fact("Loan banks", "SBI, HDFC, ICICI, Axis, LIC HFL", 7, ["loan", "bank", "sbi", "hdfc", "icici", "home loan"]),
      fact("Subvention", "Not offered", 9, ["subvention", "emi", "pre-emi"]),
    ],
  };
}

function projectBook(p: Project): KnowledgeDoc {
  const f = PROJECT_FACTS[p.id];
  const paras = [
    "# Overview",
    `${p.name} is a gated community of ${f.towers} on ${f.acres} in ${p.locality}, ${p.city}, with ${f.units} apartments.`,
    `Open space is ${f.open} of the site area. The clubhouse is ${f.club}.`,
    "# Possession",
    `Possession is ${f.possession} as stated in the RERA registration. The builder's internal target is ${f.target}.`,
    "# Specifications",
    "RCC framed structure built with aluminium formwork, designed for seismic zone II.",
    "Vitrified tiles of 800 x 800 mm in living and bedrooms, and wood-finish tiles in the master bedroom.",
    "UPVC windows with mosquito mesh. Main door in a teak frame with veneer finish.",
    "Provision for split air conditioners in all bedrooms and the living room.",
    "# Amenities",
    "Swimming pool, gym, indoor badminton courts, co-working lounge, children's play area, a 1.1 km jogging track and a supermarket inside the clubhouse.",
    "# Location",
    f.location,
    `Schools within 5 km: ${f.schools}.`,
  ];
  return {
    id: `${p.id}-book`,
    projectId: p.id,
    book: "project",
    title: "Project book",
    kind: "Brochure",
    version: 4,
    status: "approved",
    effective: "15 Sep 2026",
    updatedBy: "Kiran Goud",
    pages: 28,
    paras,
    facts: [
      fact("Land and towers", `${f.acres}, ${f.towers}`, 1, ["acres", "towers", "floors", "units", "how big"]),
      fact("Clubhouse", f.club, 2, ["clubhouse", "open space"]),
      fact("Possession (RERA)", f.possession, 4, ["possession", "handover", "ready", "kab", "eppudu", "completion"]),
      fact("Builder target", f.target, 4, ["target", "early"], "check", false),
      fact("Amenities", "Pool, gym, badminton, co-working", 11, ["amenities", "pool", "gym", "facilities"]),
      fact("Location", f.location.split(",")[0], 13, ["location", "airport", "orr", "distance", "office", "financial district"]),
      fact("Schools nearby", f.schools.split(",")[0], 14, ["school", "schools"]),
    ],
  };
}

function reraCert(p: Project): KnowledgeDoc {
  const f = PROJECT_FACTS[p.id];
  const paras = [
    "# Registration",
    `Project registered with the Telangana State Real Estate Regulatory Authority under number ${p.rera} on ${f.regDate}.`,
    `Registration is valid until the declared completion date of ${f.possession}.`,
    "# Promoter",
    `Promoter: ${f.promoter}.`,
    "# Escrow",
    `70% of amounts collected from allottees are deposited in a separate RERA account with ${f.escrowBank}, and withdrawn only against certified construction progress.`,
  ];
  return {
    id: `${p.id}-rera`,
    projectId: p.id,
    book: "legal",
    title: "RERA registration certificate",
    kind: "Certificate",
    version: 1,
    status: "approved",
    effective: f.regDate.replace(/^(\d+) (\w{3})\w* (\d+)$/, "$1 $2 $3"),
    updatedBy: "Meera Iyer",
    pages: 3,
    paras,
    facts: [
      fact("RERA number", p.rera, 1, ["rera", "registration", "registered", "approved"]),
      fact("Valid until", f.possession, 2, ["valid", "validity"]),
      fact("Promoter", f.promoter.split(",")[0], 4, ["promoter", "builder", "developer", "who is building"]),
      fact("Escrow", "70% in RERA account", 6, ["escrow", "safe", "money safe", "reliable"]),
    ],
  };
}

function agreement(p: Project): KnowledgeDoc {
  const f = PROJECT_FACTS[p.id];
  const paras = [
    "# Definitions",
    "Carpet area means the net usable floor area of an apartment, excluding the area covered by external walls, service shafts, exclusive balcony and exclusive open terrace, as defined in Section 2(k) of the RERA Act, 2016.",
    "# Possession",
    `The promoter shall hand over possession by ${f.possession}. A grace period of 6 months applies only to force majeure events defined in Clause 9.`,
    "# Delay compensation",
    "If possession is delayed beyond the agreed date, the promoter shall pay interest at SBI MCLR plus 2% per annum on the amounts paid, for every month of delay, as provided in Section 18 of the RERA Act.",
    "# Defect liability",
    "Structural defects reported within 5 years of handover shall be rectified by the promoter at no cost to the allottee, as provided in Section 14(3) of the RERA Act.",
    "# Transfer before registration",
    "The allottee may transfer the apartment before registration with the promoter's written consent and an administrative fee of ₹50,000.",
    "# Force majeure",
    "Force majeure means war, flood, drought, fire, cyclone, earthquake or any other calamity caused by nature affecting the regular development of the project.",
  ];
  return {
    id: `${p.id}-afs`,
    projectId: p.id,
    book: "legal",
    title: "Agreement for Sale",
    kind: "Agreement",
    version: 3,
    status: "approved",
    effective: "1 Oct 2026",
    updatedBy: "Meera Iyer",
    pages: 34,
    paras,
    facts: [
      fact("Carpet area meaning", "RERA Act Section 2(k)", 1, ["carpet area", "super built", "saleable", "definition"]),
      fact("Possession date", f.possession, 3, ["possession", "handover date", "agreement possession"]),
      fact("Grace period", "6 months, force majeure only", 3, ["grace", "delay", "late"], "check", false),
      fact("Delay interest", "SBI MCLR + 2% per year", 5, ["delay", "compensation", "late possession", "interest"]),
      fact("Defect liability", "5 years, structural", 7, ["defect", "warranty", "liability", "structural"]),
      fact("Transfer fee", "₹50,000 before registration", 9, ["transfer", "resale", "sell before"]),
    ],
  };
}

function cancellation(p: Project): KnowledgeDoc {
  const v2 = [
    "# Cancellation by the allottee",
    "Up to 30 days from booking: 2% of the agreement value is forfeited and the balance refunded.",
    "After 30 days and before the agreement is registered: 10% of the agreement value is forfeited.",
    "After registration of the agreement: 10% of the agreement value is forfeited, plus any taxes paid that cannot be recovered.",
    "# Cancellation by the promoter",
    "If the promoter cancels the allotment, the full amount paid is refunded with interest at SBI MCLR plus 2%.",
    "# Refund timeline",
    "Refunds are paid within 45 days of the cancellation request by bank transfer to the allottee's account.",
  ];
  const v3 = [
    "# Cancellation by the allottee",
    "Up to 15 days from booking: 2% of the agreement value is forfeited and the balance refunded.",
    "After 15 days and before the agreement is registered: 10% of the agreement value is forfeited.",
    "After registration of the agreement: 10% of the agreement value is forfeited, plus any taxes paid that cannot be recovered.",
    "# Cancellation by the promoter",
    "If the promoter cancels the allotment, the full amount paid is refunded with interest at SBI MCLR plus 2%.",
    "# Refund timeline",
    "Refunds are paid within 60 days of the cancellation request by bank transfer to the allottee's account.",
    "Brokerage paid by the allottee to a channel partner is not refundable by the promoter.",
  ];
  return {
    id: `${p.id}-cancel`,
    projectId: p.id,
    book: "legal",
    title: "Cancellation and refund policy",
    kind: "Policy",
    version: 3,
    status: "draft",
    effective: "Not yet",
    updatedBy: "Meera Iyer",
    pages: 2,
    paras: v3,
    previous: { version: 2, paras: v2 },
    facts: [
      fact("Early cancellation", "2% forfeit within 15 days", 1, ["cancel", "cancellation", "refund", "forfeit", "after booking"]),
      fact("After registration", "10% forfeit", 3, ["cancel after", "forfeit"]),
      fact("Refund within", "60 days", 7, ["refund", "how long", "timeline", "refund timeline", "days to refund"], "check", false),
      fact("Brokerage", "Not refundable", 8, ["brokerage", "channel partner"], "check", false),
    ],
  };
}

function charges(p: Project): KnowledgeDoc {
  const paras = [
    "# GST",
    "GST at 5% of the agreement value applies to under-construction apartments, without input tax credit.",
    "# Stamp duty and registration",
    "In Telangana, stamp duty is 5.5% of the market value or agreement value, whichever is higher, plus a registration fee of 0.5% and transfer duty of 1.5%, for a total of 7.5%.",
    "These are paid by the allottee at registration and are not part of the all-inclusive price.",
    "# Maintenance",
    "Maintenance is ₹3.50 per sq ft per month, with 24 months collected in advance at handover.",
    "A corpus fund of ₹75 per sq ft is included in the all-inclusive price.",
  ];
  return {
    id: `${p.id}-charges`,
    projectId: p.id,
    book: "legal",
    title: "GST, stamp duty and registration",
    kind: "Charges note",
    version: 2,
    status: "approved",
    effective: "1 Apr 2026",
    updatedBy: "Meera Iyer",
    pages: 2,
    paras,
    facts: [
      fact("GST", "5% of agreement value", 1, ["gst", "tax"]),
      fact("Stamp duty and registration", "7.5% in total", 3, ["stamp", "registration", "duty", "registration charges"]),
      fact("Maintenance", "₹3.50 / sq ft / month", 6, ["maintenance", "monthly"]),
      fact("Advance maintenance", "24 months at handover", 6, ["advance maintenance"]),
      fact("Corpus fund", "₹75 / sq ft, included", 7, ["corpus"]),
    ],
  };
}

export function buildDocs(projects: Project[]): KnowledgeDoc[] {
  factSeq = 0;
  const out: KnowledgeDoc[] = [];
  for (const p of projects) {
    out.push(projectBook(p), priceSheet(p), paymentPlan(p), reraCert(p), agreement(p), charges(p), cancellation(p));
  }
  return out;
}
