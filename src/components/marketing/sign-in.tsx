"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLeadMap, useTodayCalls } from "@/lib/selectors";
import { APP_NAME } from "@/lib/brand";
import { Button, LinkButton } from "../ui/button";
import { Field, Input } from "../ui/form";
import { ArrowLeft, EnvelopeSimple } from "../icons";
import { Floor } from "../today/floor";

export function SignIn() {
  const router = useRouter();
  const calls = useTodayCalls();
  const now = useStore((s) => s.nowMin);
  const leadMap = useLeadMap();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setError("Enter your work email, like name@yourcompany.in");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 opacity-30 sm:px-10" aria-hidden="true">
        <Floor calls={calls} now={now} leadMap={leadMap} preview />
      </div>
      <Link href="/" className="absolute left-4 top-5 inline-flex items-center gap-1.5 text-[13px] text-fg-3 hover:text-fg sm:left-8">
        <ArrowLeft size={14} /> {APP_NAME}
      </Link>

      <div className="relative w-full max-w-[420px] rounded-[14px] border border-line bg-surface p-6 shadow-[var(--shadow)] sm:p-8">
        {sent ? (
          <div className="grid gap-4">
            <EnvelopeSimple size={28} className="text-accent" />
            <h1 className="display text-[32px] text-fg">Check your inbox</h1>
            <p className="text-[15px] text-fg-2">
              We sent a sign-in link to <span className="text-fg">{email.trim()}</span>. It works for 15 minutes.
            </p>
            <p className="rounded-[var(--radius)] bg-surface-2 px-3 py-2 text-[13px] text-fg-2">This preview has no email server, so nothing was sent. Go straight in instead.</p>
            <LinkButton href="/today" variant="primary" size="lg">
              Continue to the console
            </LinkButton>
            <button type="button" onClick={() => setSent(false)} className="text-[13px] text-fg-3 hover:text-fg">
              Use a different email
            </button>
          </div>
        ) : (
          <form
            noValidate
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h1 className="display text-[36px] text-fg">Sign in</h1>
            <Field label="Work email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
                className="h-11 text-[15px]"
                autoFocus
              />
            </Field>
            {error && (
              <p id="email-error" role="alert" className="-mt-2 text-[13px] text-crit">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg">
              Send me a sign-in link
            </Button>
            <div className="flex items-center gap-3 text-[12px] text-fg-3">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <Button variant="secondary" size="lg" onClick={() => router.push("/today")}>
              Continue with Google Workspace
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
