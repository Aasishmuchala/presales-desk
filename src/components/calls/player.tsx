"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { hashString, mulberry32 } from "@/lib/rand";
import { duration } from "@/lib/format";
import type { Turn } from "@/lib/types";
import { Pause, Play } from "../icons";

const BARS = 140;

/** Simulated audio clock. Position lives in a ref so the frame loop never reads stale state. */
export function usePlayback(total: number) {
  const [pos, setPosState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const posRef = useRef(0);

  const seek = useCallback(
    (sec: number) => {
      const v = Math.min(Math.max(sec, 0), total);
      posRef.current = v;
      setPosState(v);
    },
    [total],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      const next = posRef.current + dt * speed;
      if (next >= total) {
        posRef.current = total;
        setPosState(total);
        setPlaying(false);
        return;
      }
      posRef.current = next;
      setPosState(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, total]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && posRef.current >= total) {
        posRef.current = 0;
        setPosState(0);
      }
      return !p;
    });
  }, [total]);

  const cycleSpeed = useCallback(() => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1)), []);
  const pause = useCallback(() => setPlaying(false), []);

  return { pos, playing, speed, seek, toggle, cycleSpeed, pause };
}

export function Player({
  seed,
  total,
  pos,
  playing,
  speed,
  turns,
  onToggle,
  onSeek,
  onSpeed,
}: {
  seed: string;
  total: number;
  pos: number;
  playing: boolean;
  speed: number;
  turns: Turn[];
  onToggle: () => void;
  onSeek: (sec: number) => void;
  onSpeed: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const bars = useMemo(() => {
    const r = mulberry32(hashString(seed));
    return Array.from({ length: BARS }, (_, i) => {
      const t = (i / BARS) * total;
      let speaker: Turn["speaker"] | null = null;
      for (let k = turns.length - 1; k >= 0; k--) {
        if (turns[k].at <= t) {
          speaker = turns[k].speaker;
          break;
        }
      }
      return { t, speaker, h: 0.25 + r() * 0.75 };
    });
  }, [seed, total, turns]);

  const segments = useMemo(() => {
    const out: { from: number; to: number; lang: string }[] = [];
    turns.forEach((t, i) => {
      const to = i + 1 < turns.length ? turns[i + 1].at : total;
      const last = out[out.length - 1];
      if (last && last.lang === t.lang) last.to = to;
      else out.push({ from: t.at, to, lang: t.lang });
    });
    return out;
  }, [turns, total]);

  const seekAt = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onSeek(Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * total);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      onSeek(Math.min(pos + 5, total));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      onSeek(Math.max(pos - 5, 0));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-fill text-accent-ink transition-transform active:scale-95"
      >
        {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label="Position in the call"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${duration(pos)} of ${duration(total)}`}
          onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            seekAt(e.clientX);
          }}
          onPointerMove={(e) => e.buttons === 1 && seekAt(e.clientX)}
          onKeyDown={onKey}
          className="relative h-[68px] cursor-pointer touch-none select-none"
        >
          <div className="absolute inset-x-0 top-0 flex h-[30px] items-end gap-px" aria-hidden="true">
            {bars.map((b, i) => (
              <span
                key={i}
                className={`flex-1 rounded-t-[1px] ${b.t <= pos ? "bg-fg" : "bg-fg-3/40"}`}
                style={{ height: b.speaker === "agent" ? `${b.h * 100}%` : "2px" }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 top-[32px] flex h-[22px] items-start gap-px" aria-hidden="true">
            {bars.map((b, i) => (
              <span
                key={i}
                className={`flex-1 rounded-b-[1px] ${b.t <= pos ? "bg-accent-fill" : "bg-accent-fill/30"}`}
                style={{ height: b.speaker === "lead" ? `${b.h * 100}%` : "2px" }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-[10px] gap-px" aria-hidden="true">
            {segments.map((s, i) => (
              <span
                key={i}
                className={`flex items-center overflow-hidden rounded-[2px] px-1 font-mono text-[8px] leading-none ${i % 2 ? "bg-surface-3 text-fg-2" : "bg-surface-2 text-fg-3"}`}
                style={{ width: `${((s.to - s.from) / total) * 100}%` }}
              >
                {s.to - s.from > total * 0.06 ? s.lang : ""}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${(pos / total) * 100}%` }}>
            <div className="absolute -top-1 bottom-0 w-[2px] -translate-x-1/2 bg-fg" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-fg-3">
          <span className="tnum font-mono">
            {duration(pos)} / {duration(total)}
          </span>
          <span className="hidden items-center gap-4 sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-fg" /> Agent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-accent-fill" /> Lead
            </span>
          </span>
          <button type="button" onClick={onSpeed} className="tnum rounded border border-line-strong px-1.5 py-0.5 font-mono text-fg-2 hover:text-fg" aria-label={`Playback speed ${speed}x. Change speed`}>
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
}
