/**
 * Spot illustrations: Kenyan roads with real light (one sun, top left), sign
 * reflectivity, galvanised poles, murram shoulders. The realism stays inside
 * the picture; wrap a scene in a 2px ink border and a stamp shadow
 * (`ScenePlate`) so it sits on the page like a printed plate.
 *
 * All six are inline SVG (no image requests) on a 400×280 canvas, and scale to
 * their container's width.
 */
import type * as React from "react";

import { cn } from "~/lib/utils";

import { SceneDefs, SignDefs, useArt, type Art } from "./defs";
import { signGlyph, type SignName } from "./sign-glyphs";

type SceneProps = {
  className?: string;
  title?: string;
  /** Fill the box and crop the edges, for banners with a fixed height. */
  crop?: boolean;
};

function Scene({
  a,
  title,
  className,
  crop = false,
  children,
}: SceneProps & { a: Art; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 280"
      preserveAspectRatio={crop ? "xMidYMid slice" : undefined}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("block h-auto w-full", className)}
    >
      <SignDefs a={a} />
      <SceneDefs a={a} />
      {children}
    </svg>
  );
}

/** A sign from the icon set, placed inside a scene. */
function Sign({
  a,
  name,
  x,
  y,
  size,
}: {
  a: Art;
  name: SignName;
  x: number;
  y: number;
  size: number;
}) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">
      {signGlyph(name, a, false)}
    </svg>
  );
}

/** Ink border and flat stamp shadow, the frame every scene sits in. */
export function ScenePlate({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border-2 border-ink shadow-stamp",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Acacia({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-1 36L2 10M2 18L-9 4M2 16L15 2"
        stroke="#3b2f25"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx={2} cy={0} rx={34} ry={7} fill="#4d6b3a" />
      <ellipse cx={-3} cy={-4} rx={22} ry={5} fill="#5f7f48" />
    </g>
  );
}

const CHART: { name: SignName; label: string }[] = [
  { name: "no-entry", label: "NO ENTRY" },
  { name: "warning", label: "DANGER" },
  { name: "mandatory", label: "AHEAD" },
  { name: "info", label: "INFO" },
  { name: "stop", label: "STOP" },
  { name: "warning", label: "HAZARD" },
  { name: "stop", label: "STOP" },
  { name: "speed", label: "50 KM/H" },
  { name: "mandatory", label: "AHEAD" },
  { name: "warning", label: "HAZARD" },
  { name: "info", label: "" },
  { name: "no-entry", label: "" },
  { name: "warning", label: "" },
  { name: "stop", label: "" },
  { name: "mandatory", label: "" },
];

/** A sign chart on a wall and a magnifier enlarging one sign. */
export function PelicanScene(props: SceneProps) {
  const a = useArt();
  return (
    <Scene a={a} {...props}>
      <rect width={400} height={280} fill={a.url("wall")} />
      <rect x={44} y={40} width={226} height={204} fill="#000" opacity={0.08} />
      <rect x={42} y={37} width={222} height={200} fill="#000" opacity={0.1} />
      <rect x={38} y={32} width={222} height={200} fill={a.url("paper")} />
      <rect x={38} y={32} width={222} height={24} fill="#15171b" />
      <text
        x={50}
        y={48.5}
        fill="#f2ede3"
        fontWeight={700}
        fontSize={10}
        letterSpacing={2}
        className="font-mono"
      >
        ROAD SIGNS
      </text>
      {CHART.map((s, i) => {
        const x = 48 + (i % 5) * 42;
        const y = 68 + Math.floor(i / 5) * 54;
        return (
          <g key={i}>
            <Sign a={a} name={s.name} x={x} y={y} size={30} />
            {s.label && (
              <text
                x={x + 15}
                y={y + 38}
                textAnchor="middle"
                fill="#2a2d33"
                fontSize={5}
                className="font-sans"
              >
                {s.label}
              </text>
            )}
          </g>
        );
      })}
      <circle cx={48} cy={38} r={4} fill={a.url("red")} />
      <circle cx={250} cy={38} r={4} fill={a.url("red")} />
      <rect
        x={129}
        y={119}
        width={36}
        height={36}
        rx={2}
        fill="none"
        stroke="#e11d2e"
        strokeWidth={2}
      />
      <path
        d="M165 125L238 122M165 152L240 206"
        fill="none"
        stroke="#e11d2e"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <ellipse cx={306} cy={190} rx={72} ry={66} fill={a.url("shadow")} />
      <g transform="translate(336 214) rotate(-45)">
        <rect
          x={-9}
          y={6}
          width={18}
          height={62}
          rx={7}
          fill={a.url("leather")}
        />
        <rect
          x={-10}
          y={-2}
          width={20}
          height={12}
          rx={2}
          fill={a.url("chrome")}
        />
        <rect
          x={-5}
          y={12}
          width={3}
          height={50}
          rx={1.5}
          fill="#fff"
          opacity={0.18}
        />
      </g>
      <circle cx={292} cy={166} r={62} fill="#fbfaf7" />
      <Sign a={a} name="speed" x={240} y={115} size={104} />
      <circle cx={292} cy={166} r={62} fill={a.url("glass")} />
      <path
        d="M248 140a50 50 0 0 1 30 -32"
        fill="none"
        stroke="#fff"
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.75}
      />
      <circle
        cx={292}
        cy={166}
        r={64}
        fill="none"
        stroke={a.url("chrome")}
        strokeWidth={9}
      />
      <circle
        cx={292}
        cy={166}
        r={59.2}
        fill="none"
        stroke="#3a3f47"
        strokeWidth={1}
      />
    </Scene>
  );
}

/** A no-entry sign on a roadside pole, turned to show its edge. */
export function Sign3DScene(props: SceneProps) {
  const a = useArt();
  return (
    <Scene a={a} {...props}>
      <rect width={400} height={280} fill={a.url("sky")} />
      <path
        d="M0 192C60 168 110 174 160 184C220 166 300 158 400 180V216H0Z"
        fill="#a8bf8e"
      />
      <path
        d="M0 204C80 192 140 198 220 202C290 192 350 194 400 202V222H0Z"
        fill="#88a76f"
      />
      <rect y={214} width={400} height={66} fill={a.url("murram")} />
      <path d="M0 246L400 234V280H0Z" fill={a.url("road")} />
      <path d="M0 249L400 237" stroke="#f5c400" strokeWidth={3} />
      <Acacia x={62} y={168} />
      <Acacia x={342} y={186} s={0.6} />
      <path
        d="M48 128A152 30 0 0 1 352 128"
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeDasharray="5 6"
        opacity={0.85}
      />
      <ellipse cx={214} cy={242} rx={50} ry={7} fill={a.url("shadow")} />
      <rect x={195} y={120} width={12} height={124} fill={a.url("metal")} />
      <ellipse cx={214} cy={110} rx={66} ry={84} fill={a.url("alu")} />
      <rect x={200} y={26} width={14} height={168} fill={a.url("alu")} />
      <ellipse
        cx={200}
        cy={110}
        rx={66}
        ry={84}
        fill={a.url("red")}
        stroke="#9a0c19"
        strokeWidth={1.2}
      />
      <ellipse
        cx={200}
        cy={110}
        rx={61}
        ry={79}
        fill="none"
        stroke="#fff"
        strokeWidth={1.2}
        opacity={0.25}
      />
      <rect
        x={151}
        y={98}
        width={98}
        height={24}
        rx={2}
        fill={a.url("white")}
      />
      <circle cx={200} cy={56} r={3} fill="#d6dae0" stroke="#7d838d" />
      <circle cx={200} cy={164} r={3} fill="#d6dae0" stroke="#7d838d" />
      <ellipse
        cx={200}
        cy={110}
        rx={66}
        ry={84}
        fill={a.url("sheen")}
        opacity={0.65}
      />
      <path
        d="M48 128A152 30 0 0 0 352 128"
        fill="none"
        stroke="#e6a100"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M340 114L353 127L335 132"
        fill="none"
        stroke="#e6a100"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Scene>
  );
}

const CONFETTI: [number, number, number, number, string, number][] = [
  [226, 170, 11, 7, "#e11d2e", 25],
  [280, 186, 9, 6, "#e6a100", -30],
  [330, 160, 10, 6, "#1640b6", 55],
  [300, 210, 8, 5, "#1e8449", -15],
  [356, 196, 10, 6, "#e11d2e", 70],
  [262, 152, 8, 5, "#ffffff", 40],
  [196, 200, 9, 5, "#e6a100", 10],
  [370, 150, 7, 5, "#1e8449", -40],
];

/** A green light, a waving finish flag, a zebra crossing. */
export function RoundDoneScene(props: SceneProps) {
  const a = useArt();
  return (
    <Scene a={a} {...props}>
      <rect width={400} height={280} fill={a.url("sky")} />
      <path
        d="M0 200C70 188 130 194 200 196C270 188 330 190 400 196V214H0Z"
        fill="#88a76f"
      />
      <rect y={206} width={400} height={74} fill={a.url("road")} />
      <g transform="skewX(-20) translate(90 0)" fill="#f2f2ee" opacity={0.92}>
        {[40, 86, 132, 178, 224, 270].map((x) => (
          <rect key={x} x={x} y={226} width={22} height={46} />
        ))}
      </g>
      <ellipse cx={104} cy={252} rx={40} ry={6} fill={a.url("shadow")} />
      <rect x={97} y={140} width={12} height={112} fill={a.url("metal")} />
      <rect
        x={64}
        y={20}
        width={78}
        height={128}
        rx={6}
        fill="#15171b"
        stroke="#e8e1d2"
        strokeWidth={2.5}
      />
      <rect
        x={78}
        y={26}
        width={50}
        height={116}
        rx={8}
        fill={a.url("housing")}
      />
      {[52, 84, 116].map((cy) => (
        <circle key={cy} cx={103} cy={cy} r={15} fill="#08090b" />
      ))}
      <circle cx={103} cy={52} r={12.5} fill={a.url("lampOff")} />
      <circle cx={103} cy={84} r={12.5} fill={a.url("lampOff")} />
      <circle cx={103} cy={116} r={38} fill={a.url("glowG")} />
      <circle cx={103} cy={116} r={12.5} fill={a.url("lampG")} />
      <ellipse cx={99} cy={111} rx={4} ry={2.5} fill="#fff" opacity={0.7} />
      {[44, 76, 108].map((y) => (
        <path
          key={y}
          d={`M86 ${y}Q103 ${y - 16} 120 ${y}L124 ${y - 6}Q103 ${y - 26} 82 ${y - 6}Z`}
          fill="#0b0c0f"
        />
      ))}
      <rect
        x={78}
        y={26}
        width={50}
        height={116}
        rx={8}
        fill={a.url("sheen")}
        opacity={0.3}
      />
      <ellipse cx={244} cy={250} rx={22} ry={4} fill={a.url("shadow")} />
      <rect
        x={240}
        y={34}
        width={7}
        height={216}
        rx={3}
        fill={a.url("metal")}
      />
      <circle cx={243.5} cy={32} r={5} fill={a.url("chrome")} />
      <path
        d="M247 44C290 28 328 64 380 48L380 130C328 146 290 112 247 126Z"
        fill={a.url("flag")}
      />
      <path
        d="M247 44C290 28 328 64 380 48L380 130C328 146 290 112 247 126Z"
        fill={a.url("fold")}
        stroke="#15171b"
        strokeWidth={1}
      />
      {CONFETTI.map(([x, y, w, h, fill, r]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={fill}
          transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}
        />
      ))}
    </Scene>
  );
}

/** A striped barrier at dusk, amber lamps, a yellow KDR 404 plate. */
export function RoadClosedScene(props: SceneProps) {
  const a = useArt();
  return (
    <Scene a={a} {...props}>
      <rect width={400} height={280} fill={a.url("dusk")} />
      <path
        d="M0 170C80 150 130 158 190 164C260 148 330 152 400 166V176H0Z"
        fill="#3c4a5e"
      />
      <path d="M0 170H180L0 280Z" fill="#3f5631" />
      <path d="M400 170H220L400 280Z" fill="#3f5631" />
      <path d="M180 170H220L400 280H0Z" fill={a.url("road")} />
      <path
        d="M198 174h4l1 10h-6zM196 194h8l2 18h-12zM193 226h14l3 30h-20z"
        fill="#e8e6df"
        opacity={0.85}
      />
      <ellipse cx={200} cy={254} rx={170} ry={10} fill={a.url("shadow")} />
      <path
        d="M84 254L102 116L120 254M280 254L298 116L316 254"
        fill="none"
        stroke="#c9ced6"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      {[126, 170].map((y) => (
        <g key={y}>
          <rect
            x={60}
            y={y}
            width={280}
            height={30}
            rx={2}
            fill={a.url("stripe")}
          />
          <rect
            x={60}
            y={y}
            width={280}
            height={30}
            rx={2}
            fill={a.url("boardShade")}
            stroke="#15171b"
            strokeWidth={1.5}
          />
        </g>
      ))}
      {[102, 298].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={104} r={34} fill={a.url("glowA")} />
          <rect
            x={cx - 7}
            y={110}
            width={14}
            height={10}
            rx={2}
            fill="#2a2d33"
          />
          <circle cx={cx} cy={104} r={10} fill={a.url("lampA")} />
        </g>
      ))}
      <path
        d="M150 206L156 200M250 206L244 200"
        stroke="#2a2d33"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <rect
        x={136}
        y={211}
        width={132}
        height={38}
        rx={4}
        fill="#000"
        opacity={0.3}
      />
      <rect
        x={134}
        y={208}
        width={132}
        height={38}
        rx={4}
        fill={a.url("plate")}
        stroke="#15171b"
        strokeWidth={1.5}
      />
      <rect
        x={138}
        y={212}
        width={124}
        height={30}
        rx={2.5}
        fill="none"
        stroke="#15171b"
        strokeWidth={1}
      />
      <text
        x={200}
        y={236}
        textAnchor="middle"
        fill="#fff"
        opacity={0.5}
        fontWeight={700}
        fontSize={21}
        letterSpacing={1.5}
        className="font-mono"
      >
        KDR 404
      </text>
      <text
        x={200}
        y={235}
        textAnchor="middle"
        fill="#15171b"
        fontWeight={700}
        fontSize={21}
        letterSpacing={1.5}
        className="font-mono"
      >
        KDR 404
      </text>
      <rect
        x={134}
        y={208}
        width={132}
        height={38}
        rx={4}
        fill={a.url("sheen")}
        opacity={0.5}
      />
    </Scene>
  );
}

/** The driver's seat, with an L-plate on the windscreen. */
export function LearnerScene(props: SceneProps) {
  const a = useArt();
  return (
    <Scene a={a} {...props}>
      <rect width={400} height={280} fill={a.url("sky")} />
      <path
        d="M0 150C80 134 140 140 200 144C270 132 340 136 400 148V170H0Z"
        fill="#9db985"
      />
      <rect y={160} width={400} height={60} fill={a.url("grass")} />
      <path d="M194 150H206L330 230H70Z" fill={a.url("road")} />
      <path
        d="M196 152L92 228M204 152L308 228"
        stroke="#f5c400"
        strokeWidth={2}
      />
      <path
        d="M199.4 156h1.2l.6 8h-2.4zM198.6 172h2.8l1 14h-4.8z"
        fill="#fff"
        opacity={0.9}
      />
      <path
        d="M0 0H400V280H0ZM34 30Q200 8 366 30L386 196Q200 214 14 196Z"
        fill="#15171b"
        fillRule="evenodd"
      />
      <path
        d="M34 30Q200 8 366 30L386 196Q200 214 14 196Z"
        fill={a.url("sheen")}
        opacity={0.25}
      />
      <rect x={196} y={18} width={8} height={14} fill="#2a2d33" />
      <rect
        x={166}
        y={28}
        width={68}
        height={20}
        rx={9}
        fill={a.url("leather")}
      />
      <rect
        x={170}
        y={31}
        width={60}
        height={14}
        rx={7}
        fill="#9fb6c8"
        opacity={0.6}
      />
      <g transform="rotate(5 318 82)">
        <rect
          x={287}
          y={51}
          width={70}
          height={70}
          rx={5}
          fill="#000"
          opacity={0.18}
        />
        <rect
          x={285}
          y={48}
          width={70}
          height={70}
          rx={5}
          fill={a.url("white")}
          stroke="#c0c5cf"
        />
        <path
          d="M305 61V103H338"
          fill="none"
          stroke="#e11d2e"
          strokeWidth={12}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <rect
          x={300}
          y={42}
          width={40}
          height={12}
          fill="#fff3d0"
          opacity={0.8}
        />
      </g>
      <path d="M0 206Q200 184 400 206V280H0Z" fill={a.url("dash")} />
      <circle
        cx={200}
        cy={312}
        r={116}
        fill="none"
        stroke={a.url("leather")}
        strokeWidth={24}
      />
      <path
        d="M100 254A116 116 0 0 1 300 254"
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        opacity={0.15}
      />
      <path
        d="M92 300L168 296M232 296L308 300"
        stroke="#2a2d33"
        strokeWidth={18}
        strokeLinecap="round"
      />
      <circle cx={200} cy={300} r={40} fill={a.url("housing")} />
      <circle cx={200} cy={296} r={9} fill={a.url("red")} />
    </Scene>
  );
}

/** A highway to the horizon: acacia, murram, a warning sign. */
export function OpenRoadScene(props: SceneProps) {
  const a = useArt();
  return (
    <Scene a={a} {...props}>
      <rect width={400} height={280} fill={a.url("sky")} />
      <circle cx={330} cy={54} r={80} fill={a.url("sun")} />
      <path
        d="M0 150C70 128 120 134 180 142C250 124 330 128 400 144V170H0Z"
        fill="#a8bf8e"
      />
      <path
        d="M0 160C90 150 150 154 210 158C280 150 340 152 400 158V172H0Z"
        fill="#88a76f"
      />
      <rect y={160} width={400} height={120} fill={a.url("grass")} />
      <path d="M184 160H216L380 280H20Z" fill={a.url("murram")} opacity={0.7} />
      <path d="M190 160H210L350 280H50Z" fill={a.url("road")} />
      <path
        d="M191 161L58 280M209 161L342 280"
        stroke="#f5c400"
        strokeWidth={3}
      />
      <path
        d="M199.5 164h1l.5 6h-2zM198.8 178h2.4l1 12h-4.4zM197.6 202h4.8l2 22h-8.8zM196 240h8l3 34h-14z"
        fill="#fff"
        opacity={0.9}
      />
      <Acacia x={65} y={133} />
      <Acacia x={130} y={145} s={0.45} />
      <ellipse cx={316} cy={246} rx={26} ry={4} fill={a.url("shadow")} />
      <rect x={312} y={150} width={6} height={96} fill={a.url("metal")} />
      <Sign a={a} name="warning" x={282} y={104} size={66} />
      <rect
        x={88}
        y={214}
        width={12}
        height={28}
        rx={2}
        fill={a.url("white")}
      />
      <rect x={88} y={214} width={12} height={7} rx={2} fill={a.url("red")} />
    </Scene>
  );
}
