import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { cn } from "~/lib/utils";
import { useLoadingFloor } from "~/lib/loading";

import {
  LoadingPanel,
  TrafficLoader,
  TrafficLoaderStatus,
} from "./traffic-loader";

const meta: Meta<typeof TrafficLoader> = {
  title: "Brand/TrafficLoader",
  component: TrafficLoader,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DARK_STAGE = "bg-[linear-gradient(180deg,#1B1E25,#0B0D11)]";

/** A gallery cell — corner tag, the loader on a stage, then a label + note. */
function Cell({
  tag,
  label,
  note,
  dark = false,
  children,
}: {
  tag: string;
  label: string;
  note: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[340px] flex-col items-center justify-between border-b-2 border-r-2 border-ink p-8 pt-9 text-center",
        dark ? cn(DARK_STAGE, "text-[#f4efe2]") : "bg-paper-3",
      )}
    >
      <span
        className={cn(
          "absolute left-3.5 top-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em]",
          dark ? "text-[#f4efe2]/50" : "text-ink-3",
        )}
      >
        {tag}
      </span>
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <div>
        <div className="font-display text-[13px] font-extrabold uppercase tracking-wide">
          {label}
        </div>
        <div
          className={cn(
            "mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em]",
            dark ? "text-[#f4efe2]/55" : "text-ink-3",
          )}
        >
          {note}
        </div>
      </div>
    </div>
  );
}

/** Every size, on light and dark stages, plus the loader + caption composite. */
export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-1 border-l-2 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-3">
      <Cell tag="XL · Loading screen" label="160 px" note="Splash / first load">
        <TrafficLoader size="xl" />
      </Cell>
      <Cell tag="LG · Default" label="96 px" note="Page / drawer">
        <TrafficLoader size="lg" />
      </Cell>
      <Cell
        tag="LG · Dark stage"
        label="96 px · Night"
        note="On dark backgrounds"
        dark
      >
        <TrafficLoader size="lg" />
      </Cell>
      <Cell tag="MD · Inline" label="56 px" note="Card / list row">
        <TrafficLoader size="md" />
      </Cell>
      <Cell tag="SM · Compact" label="28 px" note="Inside a button / chip">
        <TrafficLoader size="sm" />
      </Cell>
      <Cell tag="With status" label="Composite" note="Loader + caption">
        <div className="flex flex-col items-center gap-4">
          <TrafficLoader size="md" />
          <TrafficLoaderStatus>Loading lesson</TrafficLoaderStatus>
        </div>
      </Cell>
    </div>
  ),
};

/** The drop-in loading block — centred loader + animated caption. */
export const Panel: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="border-2 border-ink bg-paper-3">
        <LoadingPanel label="Loading your route" size="lg" />
      </div>
      <div className={cn("border-2 border-ink", DARK_STAGE)}>
        <LoadingPanel label="Calculating score" size="lg" onDark />
      </div>
    </div>
  ),
};

/** How it reads next to copy — a list row or a toast. */
export const InContext: Story = {
  render: () => (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex items-center gap-4 border-2 border-ink bg-paper-3 p-5">
        <TrafficLoader size="md" />
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-display text-[14px] font-extrabold uppercase tracking-wide">
            Loading your route
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
            Chapter 3 · Pedestrian phases
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-4 border-2 border-ink p-5 text-[#f4efe2]",
          DARK_STAGE,
        )}
      >
        <TrafficLoader size="md" />
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-display text-[14px] font-extrabold uppercase tracking-wide">
            Calculating score
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#f4efe2]/50">
            Reviewing 60 answers · Class B
          </span>
        </div>
      </div>
    </div>
  ),
};

/**
 * The anti-flicker floor in action: the fake "load" finishes in 400 ms, but
 * `useLoadingFloor` keeps the loader up for ~2 s so it never flashes.
 */
export const QuickLoadFloor: Story = {
  render: function QuickLoadFloorStory() {
    const [loading, setLoading] = React.useState(false);
    const showLoader = useLoadingFloor(loading);

    React.useEffect(() => {
      if (!loading) return;
      const id = window.setTimeout(() => setLoading(false), 400);
      return () => window.clearTimeout(id);
    }, [loading]);

    return (
      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={() => setLoading(true)}
          disabled={showLoader}
          className="border-2 border-ink bg-surface px-4 py-2 font-display text-[12px] font-extrabold uppercase tracking-wider shadow-stamp-sm disabled:opacity-50"
        >
          Trigger a 400 ms “load”
        </button>
        <div className="flex min-h-[300px] w-full max-w-sm items-center justify-center border-2 border-ink bg-paper-3">
          {showLoader ? (
            <LoadingPanel label="Loading the chart" size="lg" />
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Loaded — click to try again
            </span>
          )}
        </div>
      </div>
    );
  },
};

/** The bare loader at its default size. */
export const Default: Story = {
  render: () => <TrafficLoader />,
};
