/**
 * The loud tier of the icon set: tiny real signs in full colour. Reflective
 * red and blue that shift top to bottom like sheeting, white borders, one
 * diagonal sheen from a top-left sun and a faint ground shadow. Kept for
 * status and anything about the road, so colour still means something.
 *
 * `signGlyph` returns the bare shapes on a 24 grid so scene illustrations can
 * nest the same signs; `SignIcon` wraps one in its own SVG.
 */
import type * as React from "react";

import { cn } from "~/lib/utils";

import { SignDefs, useArt, type Art } from "./defs";

export type SignName =
  | "warning"
  | "stop"
  | "info"
  | "no-entry"
  | "no"
  | "done"
  | "mandatory"
  | "speed"
  | "traffic-light"
  | "pelican"
  | "sign-3d"
  | "road"
  | "learner"
  | "wheel"
  | "finish"
  | "pin";

const INK = "#15171b";
const OCTAGON = "M7.86 1.5h8.28L22 7.36v8.28L16.14 21.5H7.86L2 15.64V7.36Z";
const OCTAGON_IN = "M8.48 3h7.04L20.5 7.98v7.04L15.52 20H8.48L3.5 15.02V7.98Z";
const TRIANGLE = "M12 2.8L21.6 19.8H2.4Z";
const PIN = "M12 21.5s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z";
const PELICAN_BODY =
  "M6.2 8.3C4.8 10.8 5.4 13.2 8 14.5H17C17 18.2 14 21 10 21C6.2 21 3.5 18.6 3.5 15.6C3.5 12.5 4.6 10.1 6.2 8.3Z";

function Ground({ cx = 12, cy = 22.8, rx = 7.5 }) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={0.8} fill="#0e1014" opacity={0.16} />
  );
}

export function signGlyph(
  name: SignName,
  a: Art,
  ground = true,
): React.ReactNode {
  const red = a.url("red");
  const blue = a.url("blue");
  const white = a.url("white");
  const sheen = a.url("sheen");
  switch (name) {
    case "warning":
      return (
        <>
          {ground && <Ground cy={22.4} rx={8.5} />}
          <path
            d={TRIANGLE}
            fill={red}
            stroke={red}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <path
            d="M12 7.4L17.6 17.5H6.4Z"
            fill={white}
            stroke="#ffffff"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          <path d="M11.2 10.3h1.6l-0.32 4.1h-0.96z" fill={INK} />
          <circle cx={12} cy={15.9} r={0.85} fill={INK} />
          <path d={TRIANGLE} fill={sheen} opacity={0.7} />
        </>
      );
    case "stop":
      return (
        <>
          {ground && <Ground cy={23} rx={7} />}
          <path d={OCTAGON} fill={red} stroke="#9a0c19" strokeWidth={0.5} />
          <path d={OCTAGON_IN} fill="none" stroke="#ffffff" strokeWidth={0.9} />
          <text
            x={12}
            y={13.6}
            textAnchor="middle"
            fill="#ffffff"
            fontWeight={800}
            fontSize={5.2}
            letterSpacing={-0.1}
            className="font-display"
          >
            STOP
          </text>
          <path d={OCTAGON} fill={sheen} opacity={0.6} />
        </>
      );
    case "info":
      return (
        <>
          {ground && <Ground />}
          <rect x={2.5} y={2} width={19} height={19.5} rx={2.2} fill={blue} />
          <rect
            x={3.8}
            y={3.3}
            width={16.4}
            height={16.9}
            rx={1.4}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.9}
          />
          <circle cx={12} cy={7.4} r={1.25} fill="#ffffff" />
          <rect
            x={10.9}
            y={9.9}
            width={2.2}
            height={7.4}
            rx={0.4}
            fill="#ffffff"
          />
          <rect
            x={2.5}
            y={2}
            width={19}
            height={19.5}
            rx={2.2}
            fill={sheen}
            opacity={0.6}
          />
        </>
      );
    case "no-entry":
      return (
        <>
          {ground && <Ground cy={23} rx={7} />}
          <circle
            cx={12}
            cy={11.6}
            r={10.2}
            fill={red}
            stroke="#9a0c19"
            strokeWidth={0.5}
          />
          <rect
            x={5.4}
            y={9.8}
            width={13.2}
            height={3.6}
            rx={0.3}
            fill={white}
          />
          <circle cx={12} cy={11.6} r={10.2} fill={sheen} opacity={0.6} />
        </>
      );
    case "no":
      return (
        <>
          {ground && <Ground cy={23} rx={7} />}
          <circle cx={12} cy={11.6} r={10.2} fill={red} />
          <circle cx={12} cy={11.6} r={7.5} fill={white} />
          <path d="M6.9 6.5L17.1 16.7" stroke="#d81b2c" strokeWidth={2.6} />
          <circle cx={12} cy={11.6} r={10.2} fill={sheen} opacity={0.5} />
        </>
      );
    case "done":
    case "mandatory":
      return (
        <>
          {ground && <Ground cy={23} rx={7} />}
          <circle cx={12} cy={11.6} r={10.2} fill={blue} />
          <circle
            cx={12}
            cy={11.6}
            r={9}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.7}
          />
          <path
            d={
              name === "done"
                ? "M7.4 12l3.1 3.1 6.1-6.4"
                : "M6.8 11.6h9.2M12.6 7.8l3.8 3.8-3.8 3.8"
            }
            fill="none"
            stroke="#ffffff"
            strokeWidth={2.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={12} cy={11.6} r={10.2} fill={sheen} opacity={0.55} />
        </>
      );
    case "speed":
      return (
        <>
          {ground && <Ground cy={23} rx={7} />}
          <circle
            cx={12}
            cy={11.6}
            r={10.6}
            fill={white}
            stroke="#c0c5cf"
            strokeWidth={0.4}
          />
          <circle
            cx={12}
            cy={11.6}
            r={8.7}
            fill="none"
            stroke={red}
            strokeWidth={3.2}
          />
          <text
            x={12}
            y={14.3}
            textAnchor="middle"
            fill={INK}
            fontWeight={800}
            fontSize={7.4}
            className="font-display"
          >
            50
          </text>
          <circle cx={12} cy={11.6} r={10.6} fill={sheen} opacity={0.5} />
        </>
      );
    case "traffic-light":
      return (
        <>
          <rect
            x={10.9}
            y={20}
            width={2.2}
            height={3.5}
            fill={a.url("metal")}
          />
          <rect
            x={6.6}
            y={1}
            width={10.8}
            height={19.6}
            rx={2.4}
            fill={a.url("housing")}
          />
          <circle cx={12} cy={5.6} r={5} fill={a.url("glowR")} />
          <circle cx={12} cy={5.6} r={2.85} fill="#08090b" />
          <circle cx={12} cy={10.8} r={2.85} fill="#08090b" />
          <circle cx={12} cy={16} r={2.85} fill="#08090b" />
          <circle cx={12} cy={5.6} r={2.3} fill={a.url("lampR")} />
          <circle cx={12} cy={10.8} r={2.3} fill={a.url("lampOff")} />
          <circle cx={12} cy={16} r={2.3} fill={a.url("lampOff")} />
          <ellipse
            cx={11.2}
            cy={4.8}
            rx={0.8}
            ry={0.5}
            fill="#ffffff"
            opacity={0.75}
          />
          <rect
            x={6.6}
            y={1}
            width={10.8}
            height={19.6}
            rx={2.4}
            fill={sheen}
            opacity={0.35}
          />
        </>
      );
    case "pelican":
      return (
        <>
          {ground && <Ground cx={10.5} cy={22.4} rx={7} />}
          <path
            d={PELICAN_BODY}
            fill={white}
            stroke="#2a2d33"
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
          <path
            d="M7.6 16.2C9.8 18 13.2 18.2 15.8 16.2"
            fill="none"
            stroke="#8a9099"
            strokeWidth={0.9}
            strokeLinecap="round"
          />
          <path
            d="M10.4 5.8L21.2 8.2Q15.5 14 10.2 8Z"
            fill={a.url("amber")}
            stroke="#a35f00"
            strokeWidth={0.7}
            strokeLinejoin="round"
          />
          <path
            d="M10.4 5.8L21.2 8.2"
            stroke="#a35f00"
            strokeWidth={0.9}
            strokeLinecap="round"
          />
          <circle
            cx={8}
            cy={6.5}
            r={2.6}
            fill={white}
            stroke="#2a2d33"
            strokeWidth={0.9}
          />
          <circle cx={8.2} cy={6.1} r={0.75} fill={INK} />
        </>
      );
    case "sign-3d":
      return (
        <>
          <rect x={11.2} y={12} width={2} height={10.6} fill={a.url("metal")} />
          <ellipse cx={13} cy={9} rx={5.4} ry={7.6} fill="#8a9099" />
          <ellipse
            cx={12}
            cy={9}
            rx={5.4}
            ry={7.6}
            fill={red}
            stroke="#9a0c19"
            strokeWidth={0.4}
          />
          <rect
            x={8.4}
            y={7.9}
            width={7.2}
            height={2.3}
            rx={0.2}
            fill={white}
          />
          <ellipse
            cx={12}
            cy={9}
            rx={5.4}
            ry={7.6}
            fill={sheen}
            opacity={0.6}
          />
          <path
            d="M2.8 14.6c0 2.1 4.1 3.7 9.2 3.7s9.2-1.6 9.2-3.7"
            fill="none"
            stroke="#e6a100"
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <path
            d="M19.4 12.6l2 2.1-2.7.5"
            fill="none"
            stroke="#e6a100"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case "road":
      return (
        <>
          <path d="M1 22L8.6 3h6.8L23 22Z" fill={a.url("tarmac")} />
          <path
            d="M9.4 3.6L3.4 21.4M14.6 3.6l6 17.8"
            stroke="#f5c400"
            strokeWidth={0.9}
          />
          <path
            d="M11.4 4h1.2v2.6h-1.2zM11.2 9h1.6v3.4h-1.6zM10.9 15.4h2.2v4.4h-2.2z"
            fill="#ffffff"
          />
          <path d="M1 22L8.6 3h6.8L23 22Z" fill={sheen} opacity={0.3} />
        </>
      );
    case "learner":
      return (
        <>
          {ground && <Ground rx={8} />}
          <rect
            x={3}
            y={2.2}
            width={18}
            height={19}
            rx={1.6}
            fill={white}
            stroke="#c0c5cf"
            strokeWidth={0.8}
          />
          <path
            d="M9 6v10.6h7"
            fill="none"
            stroke="#e11d2e"
            strokeWidth={3.4}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <rect
            x={3}
            y={2.2}
            width={18}
            height={19}
            rx={1.6}
            fill={sheen}
            opacity={0.5}
          />
        </>
      );
    case "wheel":
      return (
        <>
          <circle
            cx={12}
            cy={12}
            r={9.3}
            fill="none"
            stroke={a.url("housing")}
            strokeWidth={3}
          />
          <path
            d="M3.4 12.6h5.4M15.2 12.6h5.4M12 15.6v5.6"
            stroke="#2a2d33"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <circle cx={12} cy={12.4} r={3.5} fill={a.url("housing")} />
          <circle cx={12} cy={12.4} r={1.4} fill={red} />
          <path
            d="M5.4 7.6a8 8 0 0 1 5-4.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.9}
            strokeLinecap="round"
            opacity={0.45}
          />
        </>
      );
    case "finish":
      return (
        <>
          {ground && (
            <ellipse
              cx={5}
              cy={22.8}
              rx={3}
              ry={0.6}
              fill="#0e1014"
              opacity={0.18}
            />
          )}
          <rect
            x={4}
            y={1.5}
            width={1.7}
            height={21}
            rx={0.6}
            fill={a.url("metal")}
          />
          <path
            d="M5.7 3c4-1.4 7 1.6 14.6 0v10.2c-7.6 1.6-10.6-1.4-14.6 0Z"
            fill={a.url("chk")}
            stroke={INK}
            strokeWidth={0.5}
          />
          <path
            d="M5.7 3c4-1.4 7 1.6 14.6 0v10.2c-7.6 1.6-10.6-1.4-14.6 0Z"
            fill={a.url("fold")}
          />
        </>
      );
    case "pin":
      return (
        <>
          {ground && (
            <ellipse
              cx={12}
              cy={22.4}
              rx={4}
              ry={1}
              fill="#0e1014"
              opacity={0.2}
            />
          )}
          <path d={PIN} fill={red} />
          <circle cx={12} cy={9.5} r={2.8} fill="#ffffff" />
          <path d={PIN} fill={sheen} opacity={0.6} />
        </>
      );
  }
}

/**
 * One full-colour sign mark. Decorative by default; pass `title` when it
 * carries meaning on its own.
 */
export function SignIcon({
  name,
  size = 24,
  title,
  className,
  ...props
}: Omit<React.SVGProps<SVGSVGElement>, "name"> & {
  name: SignName;
  size?: number;
  title?: string;
}) {
  const a = useArt();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      <SignDefs a={a} />
      {signGlyph(name, a)}
    </svg>
  );
}
