import * as React from "react";

import type { Route as PageRoute } from "./+types/board-network";

import { fullBoardSvg, type FullBoardOptions } from "~/lib/board/full-board";
import {
  network,
  planRoute,
  stepPoints,
  type Maneuver,
  type NetEdge,
  type Route,
} from "~/lib/board/network";
import { cn } from "~/lib/utils";

export function meta(_: PageRoute.MetaArgs) {
  return [
    { title: "Board lane network · DriveRush Tools" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

type Line = NonNullable<FullBoardOptions["routes"]>[number];

/** What each kind of driving is drawn as when the whole network is shown. */
const LAYERS = [
  {
    id: "lanes",
    label: "Lanes",
    color: "#38bdf8",
    has: ["follow"],
  },
  {
    id: "changes",
    label: "Lane changes",
    color: "#a3e635",
    has: ["lane_change"],
  },
  {
    id: "roundabout",
    label: "Roundabout",
    color: "#60a5fa",
    has: ["hold_lane", "ring", "exit"],
  },
  {
    id: "turns",
    label: "Junction turns",
    color: "#fb923c",
    has: ["turn_left", "turn_right"],
  },
  { id: "uturns", label: "U-turns", color: "#e879f9", has: ["u_turn"] },
  {
    id: "parking",
    label: "Parking, forward",
    color: "#facc15",
    has: ["park_forward", "leave_forward"],
  },
  {
    id: "reverse",
    label: "Parking, in reverse",
    color: "#f87171",
    has: ["park_reverse", "leave_reverse"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  color: string;
  has: readonly Maneuver[];
}[];

type LayerId = (typeof LAYERS)[number]["id"];

const ROUTE_COLOR = "#fde047";
const REVERSE_COLOR = "#f87171";
const SHORTCUT_COLOR = "#f472b6";

function layerOf(edge: NetEdge) {
  return LAYERS.find((layer) =>
    (layer.has as readonly Maneuver[]).includes(edge.maneuver),
  );
}

function routeLines(route: Route, active: number | null): Line[] {
  return route.steps.map((step, i) => ({
    points: stepPoints(route, i),
    color: step.gear === "reverse" ? REVERSE_COLOR : ROUTE_COLOR,
    width: active === i ? 1.9 : 1.1,
    opacity: active === null || active === i ? 1 : 0.45,
    dashed: step.gear === "reverse",
    arrow: i === route.steps.length - 1 || active === i,
  }));
}

const selectClass =
  "w-full border-2 border-ink bg-surface px-3 py-2 font-mono text-[12.5px] text-ink";

export default function BoardNetworkTool() {
  const net = React.useMemo(() => network(), []);
  const starts = net.places.filter((p) => p.starts);
  const ends = net.places.filter((p) => p.ends);

  const [shown, setShown] = React.useState<Record<LayerId, boolean>>({
    lanes: true,
    changes: false,
    roundabout: true,
    turns: true,
    uturns: true,
    parking: true,
    reverse: true,
  });
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [active, setActive] = React.useState<number | null>(null);
  const [seen, setSeen] = React.useState<"south" | "east">("south");

  const plan = React.useMemo(
    () => (from && to ? planRoute(from, to) : null),
    [from, to],
  );
  React.useEffect(() => setActive(null), [from, to]);

  const svg = React.useMemo(() => {
    const lines: Line[] = [];
    if (plan?.route) {
      if (plan.shortcut) {
        lines.push({
          points: plan.shortcut.points,
          color: SHORTCUT_COLOR,
          width: 0.7,
          dashed: true,
          arrow: true,
        });
      }
      lines.push(...routeLines(plan.route, active));
    } else {
      for (const edge of net.edges) {
        const layer = layerOf(edge);
        if (!layer || !shown[layer.id]) continue;
        lines.push({
          points: edge.points,
          color: layer.color,
          width: edge.maneuver === "follow" ? 0.35 : 0.5,
          dashed: !edge.confirmed,
          opacity: edge.maneuver === "follow" ? 0.8 : 1,
          arrow: edge.maneuver !== "follow" && edge.maneuver !== "ring",
        });
      }
    }
    return fullBoardSvg({ seen, routes: lines });
  }, [net, plan, shown, active, seen]);

  /** One line per unconfirmed rule, with how many connections rest on it. */
  const unsure = React.useMemo(() => {
    const groups = new Map<string, { why: string; count: number }>();
    for (const edge of net.edges) {
      if (edge.confirmed) continue;
      const title =
        edge.maneuver === "hold_lane" ||
        edge.maneuver === "ring" ||
        edge.maneuver === "exit"
          ? "Lane 3 of the three-lane road, at the roundabout"
          : edge.title;
      const group = groups.get(title);
      if (group) group.count += 1;
      else groups.set(title, { why: edge.why, count: 1 });
    }
    return [...groups].sort((a, b) => a[0].localeCompare(b[0]));
  }, [net]);

  const route = plan?.route ?? null;

  return (
    <div>
      <header className="border-b-2 border-ink pb-5">
        <span className="eyebrow text-ink">Model Town Board · checking</span>
        <h1 className="m-0 mt-3 font-display text-[clamp(28px,4vw,44px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
          Lane network
        </h1>
        <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-ink-2">
          Every lane and every way from one lane to the next, drawn flat. A
          dashed line rests on a rule a driving school still has to confirm.
          Pick a start and an end to see the route a lesson would teach.{" "}
          {net.nodes.size} points, {net.edges.length} connections.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div
          className="border-2 border-ink bg-[#101114] [&>svg]:block [&>svg]:h-auto [&>svg]:max-h-[88vh] [&>svg]:w-full"
          data-testid="board-network"
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <div className="flex flex-col gap-6">
          <section className="border-2 border-ink bg-surface p-4">
            <h2 className="m-0 font-display text-[18px] font-extrabold uppercase tracking-tight">
              Try a route
            </h2>
            <label className="mt-3 block font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              From
              <select
                className={cn(selectClass, "mt-1")}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                <option value="">Whole network</option>
                {starts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label.replace(/^From /, "")}
                    {p.occupied ? " (a car is parked here)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              To
              <select
                className={cn(selectClass, "mt-1")}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                <option value="">Whole network</option>
                {ends.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label.replace(/^To /, "")}
                    {p.occupied ? " (a car is parked here)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 flex gap-2">
              {(["south", "east"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setSeen(side)}
                  className={cn(
                    "border-2 border-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest",
                    seen === side ? "bg-ink text-paper" : "bg-surface text-ink",
                  )}
                >
                  Seen from the {side === "south" ? "bottom" : "right"}
                </button>
              ))}
            </div>

            {plan && !route && (
              <p className="mt-4 text-[14px] text-ink-2">
                There is no way from there to there.
              </p>
            )}
            {plan && route && (
              <div className="mt-4">
                <p className="m-0 text-[13.5px] leading-relaxed text-ink-2">
                  {Math.round(route.length)} m.{" "}
                  {plan.rule === "shortest" &&
                    "The shortest correct route, avoiding the parking area."}
                  {plan.rule === "last_resort" &&
                    "Through the parking area, as a last resort: nothing else gets there."}
                  {plan.rule === "parking" &&
                    "Starts or ends in the parking area, so it has to use it."}
                  {plan.shortcut &&
                    ` The pink dashed line is ${Math.round(route.length - plan.shortcut.length)} m shorter but cuts through the parking area, so it is the wrong answer.`}
                  {!route.confirmed &&
                    " Part of it rests on a rule still to be confirmed."}
                </p>
                <ol className="m-0 mt-3 list-none p-0">
                  {route.steps.map((step, i) => (
                    <li key={`${step.from}-${step.title}`}>
                      <button
                        type="button"
                        onClick={() => setActive(active === i ? null : i)}
                        className={cn(
                          "block w-full border-b border-dashed border-ink px-2 py-2 text-left",
                          active === i && "bg-paper-3",
                        )}
                      >
                        <span className="block text-[14px] font-bold leading-snug text-ink">
                          {i + 1}. {step.title}
                          {step.gear === "reverse" && (
                            <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-rush">
                              Reverse
                            </span>
                          )}
                          {!step.confirmed && (
                            <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                              To confirm
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-[13px] leading-snug text-ink-2">
                          {step.why}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          {!plan && (
            <section className="border-2 border-ink bg-surface p-4">
              <h2 className="m-0 font-display text-[18px] font-extrabold uppercase tracking-tight">
                Show
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {LAYERS.map((layer) => (
                  <label
                    key={layer.id}
                    className="flex items-center gap-3 text-[14px] text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={shown[layer.id]}
                      onChange={(e) =>
                        setShown((s) => ({ ...s, [layer.id]: e.target.checked }))
                      }
                    />
                    <span
                      className="inline-block h-1.5 w-6"
                      style={{ background: layer.color }}
                    />
                    {layer.label}
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="border-2 border-ink bg-surface p-4">
            <h2 className="m-0 font-display text-[18px] font-extrabold uppercase tracking-tight">
              Still to confirm with a driving school
            </h2>
            <ul className="m-0 mt-3 list-none p-0">
              {unsure.map(([title, group]) => (
                <li
                  key={title}
                  className="border-b border-dashed border-ink py-2 text-[13.5px] leading-snug text-ink-2"
                >
                  <span className="font-bold text-ink">{title}</span>{" "}
                  <span className="font-mono text-[11px] text-ink-3">
                    ({group.count})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
