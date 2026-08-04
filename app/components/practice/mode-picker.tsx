/**
 * Practice-mode picker. Four tiles (Quick · Mock test · Signs · Scenarios)
 * that each represent a distinct way to drill against the question bank.
 *
 * Renders in two modes:
 *  - `landing` (no `?mode=` set): big tiles, primary CTA — the route itself.
 *  - `switcher` (a mode is active): a compact strip of the other three modes
 *    so the user can chain modes without going back to the homepage.
 */
import { useNavigate } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  AwardFreeIcons,
  PlayCircleFreeIcons,
  TimeQuarterFreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import { analytics } from "~/lib/analytics";
import { MODE_LABELS, type QuizMode } from "~/lib/questions";
import { cn } from "~/lib/utils";

type Tile = {
  mode: QuizMode;
  icon: IconSvgElement;
  voice: "rush" | "amber" | "kenya-green" | "plate-blue";
  estimatedMinutes: string;
  questionCount: string;
};

const TILES: Tile[] = [
  {
    mode: "quick",
    icon: PlayCircleFreeIcons,
    voice: "amber",
    estimatedMinutes: "~ 3 min",
    questionCount: "5 Qs",
  },
  {
    mode: "test",
    icon: TimeQuarterFreeIcons,
    voice: "rush",
    estimatedMinutes: "8 min",
    questionCount: "10 Qs · timed",
  },
  {
    mode: "signs",
    icon: TrafficLightFreeIcons,
    voice: "plate-blue",
    estimatedMinutes: "~ 4 min",
    questionCount: "5 Qs · signs",
  },
  {
    mode: "challenge",
    icon: AwardFreeIcons,
    voice: "kenya-green",
    estimatedMinutes: "~ 4 min",
    questionCount: "5 Qs · scenarios",
  },
];

const VOICE_BG: Record<Tile["voice"], string> = {
  rush: "bg-rush text-white",
  amber: "bg-amber text-amber-foreground",
  "kenya-green": "bg-kenya-green text-kenya-green-foreground",
  "plate-blue": "bg-plate-blue text-plate-blue-foreground",
};

export function ModePicker({
  activeMode,
  variant = "landing",
}: {
  activeMode?: QuizMode;
  variant?: "landing" | "switcher";
}) {
  const navigate = useNavigate();
  const tiles =
    variant === "switcher" && activeMode
      ? TILES.filter((t) => t.mode !== activeMode)
      : TILES;

  function pick(mode: QuizMode) {
    analytics.practiceModeSelected({ mode, source: variant });
    navigate(`/practice?mode=${mode}`, { replace: variant === "switcher" });
  }

  if (variant === "switcher") {
    return (
      <section className="mt-10 border-t border-dashed border-ink pt-6">
        <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Try another mode
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {tiles.map((t) => (
            <button
              key={t.mode}
              type="button"
              onClick={() => pick(t.mode)}
              className={cn(
                "group flex items-center gap-3 border-2 border-ink bg-surface p-3 text-left outline-none transition-[transform,box-shadow] duration-100 ease-snap",
                "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center border-2 border-ink",
                  VOICE_BG[t.voice],
                )}
                aria-hidden="true"
              >
                <HugeiconsIcon icon={t.icon} size={16} strokeWidth={2.25} />
              </span>
              <span className="grid gap-0.5">
                <span className="font-display text-[13px] font-extrabold uppercase leading-tight tracking-tight text-ink">
                  {MODE_LABELS[t.mode].title}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  {t.questionCount}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <header className="mb-6 border-b-2 border-dashed border-ink pb-5">
        <span className="eyebrow text-ink">Practice</span>
        <h1 className="m-0 mt-2 font-display text-[clamp(34px,6.5vw,60px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
          Pick your <span className="italic text-rush">drill</span>.
        </h1>
        <p className="m-0 mt-4 max-w-2xl font-serif text-[clamp(15px,2vw,18px)] leading-snug text-ink-2">
          Four ways to practise. All instant, all free, all built on the same
          NTSA question bank.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <button
            key={t.mode}
            type="button"
            onClick={() => pick(t.mode)}
            className={cn(
              "group grid gap-3 border-2 border-ink bg-surface p-5 text-left shadow-stamp outline-none transition-[transform,box-shadow] duration-100 ease-snap sm:p-6",
              "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg",
              "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "inline-flex size-12 shrink-0 items-center justify-center border-2 border-ink",
                  VOICE_BG[t.voice],
                )}
                aria-hidden="true"
              >
                <HugeiconsIcon icon={t.icon} size={22} strokeWidth={2.25} />
              </span>
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={18}
                strokeWidth={2.5}
                className="text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </div>
            <div>
              <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                {t.questionCount} · {t.estimatedMinutes}
              </p>
              <h2 className="m-0 mt-1.5 font-display text-[clamp(20px,2.4vw,26px)] font-extrabold uppercase leading-[1] tracking-tight text-ink">
                {MODE_LABELS[t.mode].title}
              </h2>
            </div>
            <p className="m-0 max-w-sm text-[14px] leading-snug text-ink-2">
              {MODE_LABELS[t.mode].copy}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
