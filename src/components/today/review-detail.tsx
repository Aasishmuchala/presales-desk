"use client";

import { CallRecord } from "../calls/call-record";

export function ReviewDetail({ callId }: { callId: string }) {
  return <CallRecord callId={callId} mode="review" />;
}
