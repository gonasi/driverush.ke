/**
 * Shared paint for the sign icons and scene illustrations: reflective sign
 * colours, galvanised metal, sky, murram and lamp glows. Every SVG renders its
 * own copy under a `useId` prefix, so two icons on a page never fight over an
 * id and SSR markup matches hydration.
 */
import * as React from "react";

export type Art = {
  /** The raw id, for `id=` attributes. */
  id: (name: string) => string;
  /** `url(#…)` for `fill` / `stroke`. */
  url: (name: string) => string;
};

export function useArt(): Art {
  const raw = React.useId();
  return React.useMemo(() => {
    const prefix = `dr${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
    return {
      id: (name) => `${prefix}-${name}`,
      url: (name) => `url(#${prefix}-${name})`,
    };
  }, [raw]);
}

function V({
  a,
  id,
  stops,
  x2 = 0,
  y2 = 1,
}: {
  a: Art;
  id: string;
  stops: [number, string, number?][];
  x2?: number;
  y2?: number;
}) {
  return (
    <linearGradient id={a.id(id)} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([offset, color, opacity]) => (
        <stop
          key={offset}
          offset={offset}
          stopColor={color}
          stopOpacity={opacity ?? 1}
        />
      ))}
    </linearGradient>
  );
}

function R({
  a,
  id,
  stops,
  cx = 0.4,
  cy = 0.35,
  r = 0.7,
}: {
  a: Art;
  id: string;
  stops: [number, string, number?][];
  cx?: number;
  cy?: number;
  r?: number;
}) {
  return (
    <radialGradient id={a.id(id)} cx={cx} cy={cy} r={r}>
      {stops.map(([offset, color, opacity]) => (
        <stop
          key={offset}
          offset={offset}
          stopColor={color}
          stopOpacity={opacity ?? 1}
        />
      ))}
    </radialGradient>
  );
}

/** What a sign icon needs. */
export function SignDefs({ a }: { a: Art }) {
  return (
    <defs>
      <V
        a={a}
        id="red"
        stops={[
          [0, "#f43a49"],
          [1, "#c40f1f"],
        ]}
      />
      <V
        a={a}
        id="blue"
        stops={[
          [0, "#2b5fe0"],
          [1, "#11308f"],
        ]}
      />
      <V
        a={a}
        id="white"
        stops={[
          [0, "#ffffff"],
          [1, "#e4e7ed"],
        ]}
      />
      <V
        a={a}
        id="amber"
        stops={[
          [0, "#ffcf3a"],
          [1, "#e08a00"],
        ]}
      />
      <V
        a={a}
        id="metal"
        x2={1}
        y2={0}
        stops={[
          [0, "#7d838d"],
          [0.45, "#e6e9ee"],
          [1, "#868c96"],
        ]}
      />
      <V
        a={a}
        id="housing"
        x2={1}
        stops={[
          [0, "#3a3f47"],
          [1, "#101216"],
        ]}
      />
      <V
        a={a}
        id="tarmac"
        stops={[
          [0, "#6b7079"],
          [1, "#2a2d33"],
        ]}
      />
      <V
        a={a}
        id="sheen"
        x2={0.8}
        y2={0.9}
        stops={[
          [0, "#ffffff", 0.6],
          [0.5, "#ffffff", 0],
        ]}
      />
      <V
        a={a}
        id="fold"
        x2={1}
        y2={0}
        stops={[
          [0, "#000000", 0],
          [0.35, "#000000", 0.28],
          [0.6, "#ffffff", 0.2],
          [1, "#000000", 0.15],
        ]}
      />
      <R
        a={a}
        id="lampR"
        stops={[
          [0, "#ffd0d4"],
          [0.35, "#ff3d4f"],
          [1, "#8a0a16"],
        ]}
      />
      <R
        a={a}
        id="lampOff"
        stops={[
          [0, "#555a63"],
          [1, "#1c1f24"],
        ]}
      />
      <R
        a={a}
        id="glowR"
        cx={0.5}
        cy={0.5}
        r={0.5}
        stops={[
          [0, "#ff3d4f", 0.55],
          [1, "#ff3d4f", 0],
        ]}
      />
      <pattern
        id={a.id("chk")}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
      >
        <rect width="4" height="4" fill="#ffffff" />
        <rect width="2" height="2" fill="#15171b" />
        <rect x="2" y="2" width="2" height="2" fill="#15171b" />
      </pattern>
    </defs>
  );
}

/** Everything a scene needs on top of the sign paint. */
export function SceneDefs({ a }: { a: Art }) {
  return (
    <defs>
      <V
        a={a}
        id="sky"
        stops={[
          [0, "#8fc9ea"],
          [0.75, "#d9eef7"],
          [1, "#f1f6ef"],
        ]}
      />
      <V
        a={a}
        id="dusk"
        stops={[
          [0, "#26325a"],
          [0.55, "#b8676a"],
          [1, "#f3b27a"],
        ]}
      />
      <V
        a={a}
        id="murram"
        stops={[
          [0, "#c98a5b"],
          [1, "#9a5a35"],
        ]}
      />
      <V
        a={a}
        id="grass"
        stops={[
          [0, "#93ad62"],
          [1, "#5c8138"],
        ]}
      />
      <V
        a={a}
        id="road"
        stops={[
          [0, "#6c717a"],
          [1, "#2b2e34"],
        ]}
      />
      <V
        a={a}
        id="alu"
        x2={1}
        y2={0}
        stops={[
          [0, "#c7ccd3"],
          [1, "#858b95"],
        ]}
      />
      <V
        a={a}
        id="paper"
        x2={1}
        stops={[
          [0, "#ffffff"],
          [1, "#eee9de"],
        ]}
      />
      <V
        a={a}
        id="wall"
        stops={[
          [0, "#ece5d6"],
          [1, "#d9d0bd"],
        ]}
      />
      <V
        a={a}
        id="leather"
        stops={[
          [0, "#4a4f57"],
          [1, "#121418"],
        ]}
      />
      <V
        a={a}
        id="dash"
        stops={[
          [0, "#2f333a"],
          [1, "#0e1014"],
        ]}
      />
      <V
        a={a}
        id="plate"
        stops={[
          [0, "#ffd84a"],
          [1, "#e6b400"],
        ]}
      />
      <V
        a={a}
        id="chrome"
        x2={1}
        stops={[
          [0, "#f6f7f9"],
          [0.35, "#9aa1ab"],
          [0.6, "#eef0f3"],
          [1, "#5b6068"],
        ]}
      />
      <V
        a={a}
        id="boardShade"
        stops={[
          [0, "#ffffff", 0.25],
          [1, "#000000", 0.25],
        ]}
      />
      <R
        a={a}
        id="shadow"
        cx={0.5}
        cy={0.5}
        r={0.5}
        stops={[
          [0, "#000000", 0.35],
          [1, "#000000", 0],
        ]}
      />
      <R
        a={a}
        id="glass"
        stops={[
          [0, "#ffffff", 0],
          [1, "#9fc4dd", 0.22],
        ]}
        r={0.65}
      />
      <R
        a={a}
        id="glowG"
        cx={0.5}
        cy={0.5}
        r={0.5}
        stops={[
          [0, "#4dff9a", 0.55],
          [1, "#4dff9a", 0],
        ]}
      />
      <R
        a={a}
        id="lampG"
        stops={[
          [0, "#d6ffe6"],
          [0.35, "#2fd476"],
          [1, "#0b5c2d"],
        ]}
      />
      <R
        a={a}
        id="glowA"
        cx={0.5}
        cy={0.5}
        r={0.5}
        stops={[
          [0, "#ffb83d", 0.7],
          [1, "#ffb83d", 0],
        ]}
      />
      <R
        a={a}
        id="lampA"
        stops={[
          [0, "#fff3c2"],
          [0.4, "#ffb000"],
          [1, "#8a5200"],
        ]}
      />
      <R
        a={a}
        id="sun"
        cx={0.5}
        cy={0.5}
        r={0.5}
        stops={[
          [0, "#fff6d6", 0.95],
          [0.3, "#ffe7a1", 0.5],
          [1, "#ffe7a1", 0],
        ]}
      />
      <pattern
        id={a.id("flag")}
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <rect width="20" height="20" fill="#f6f6f4" />
        <rect width="10" height="10" fill="#15171b" />
        <rect x="10" y="10" width="10" height="10" fill="#15171b" />
      </pattern>
      <pattern
        id={a.id("stripe")}
        width="30"
        height="30"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="30" height="30" fill="#f7f7f5" />
        <rect width="15" height="30" fill="#d8182a" />
      </pattern>
    </defs>
  );
}
