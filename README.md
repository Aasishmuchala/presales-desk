# Pre-Sales Desk

The web console for an AI caller for pre-sale real estate in India. The agent calls every new enquiry in English, Hindi or Telugu, answers only from approved project and legal documents with a source for every answer, books site visits, and hands hot buyers to the sales team with a one-line brief.

This repository is the front end. It runs entirely on sample data: nothing is dialled and no CRM, WhatsApp or calendar is connected yet.

## What's in it

- **Today**: a live timeline of every call, live calls you can listen to, whisper into or take over, hand-overs and call-backs that need a person, a review queue for calls flagged by automatic checks, and weekly numbers.
- **Leads**: a searchable, filterable table with keyboard navigation and bulk actions, a page per lead with its full history, visit booking and WhatsApp, and calling lists.
- **Call records**: playback with a transcript that follows along, and source links that open the exact line of the document an answer came from.
- **Knowledge**: the project and legal books, approval with a before and after view, facts that must be confirmed before the agent quotes them, uploads, and an inbox of questions the agent couldn't answer.
- **Setup**: connections, how the agent talks (voice, languages, opening lines, objections, hand-over rules, follow-ups) with a Try it chat, team, calling rules and phone numbers.
- **Sales person's app** at `/me`: the next visit, hot leads and tasks, built for a phone.

Compliance is built in rather than left to settings: calls stay inside 09:00 to 21:00, the opening line must say it's an AI assistant, and the agent never quotes an unconfirmed fact or a draft document.

## Run it

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The demo clock starts at 16:20 IST on Sat 10 Oct 2026 and moves in real time. Changes are saved in your browser; use **Reset** in the top strip to go back to the sample data.

## Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Zustand, cmdk and Phosphor icons.

## Where the backend plugs in

- `src/lib/mock/` holds the sample data. The real backend replaces it.
- `src/lib/store.ts` holds state and actions. Each action is where an API call goes.
- `src/lib/responder.ts` mimics the agent's answering rule for the Try it chat: answer only from approved, confirmed facts, cite the source, and otherwise promise a confirmation.
