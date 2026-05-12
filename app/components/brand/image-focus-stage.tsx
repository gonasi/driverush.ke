import * as React from "react";

import {
  computeRegionTransform,
  IDENTITY_REGION_TRANSFORM,
  type FocusRegion,
} from "~/lib/image-focus";
import { cn } from "~/lib/utils";

type ImageFocusStageProps = {
  imageSrc: string;
  /** Region to zoom into. Ignored when `focused` is false. */
  region: FocusRegion | null;
  /** `true` → camera framed on the region; `false` → camera on the whole chart. */
  focused: boolean;
  /** Blur radius (px) over the unfocused area (used only by the non-`fill` view). */
  blurIntensity: number;
  /** Dim opacity (0–1) over the unfocused area; in `fill` mode drives the vignette. */
  dimIntensity: number;
  /** Camera-move / transition duration in ms. */
  animationDuration: number;
  /** Tailwind aspect class for the (non-fill) frame. Defaults to `aspect-video`. */
  aspectClassName?: string;
  /** Fullscreen mode: a camera that pans + zooms over the chart to frame the sign. */
  fill?: boolean;
  className?: string;
};

export function ImageFocusStage(props: ImageFocusStageProps) {
  return props.fill ? <CameraStage {...props} /> : <ClassicStage {...props} />;
}

// ---------------------------------------------------------------------------
// fill mode — a CSS-transform "camera" over the chart, with the un-focused area
// dimmed + blurred (like the original ImageFocusQuiz).
//
// The transformed (zoom) layer is sized exactly to the rendered-image box (the
// `contain` rect of the chart within the viewport) and centred in the viewport,
// with `transform-origin: center`. That makes `translate(tx%, ty%)` a % of the
// *image*, so `tx/ty = -((centre−50)·scale)` lands the region's centre at the
// viewport centre on every aspect ratio. The zoom factor is capped relative to
// the *viewport* so a tiny sign zooms in hard on a phone and a sane amount on a
// wide desktop. The dim/blur is done with four overlays in *screen* space (so
// `backdrop-filter`'s blur radius isn't multiplied by the layer's scale); they
// transition in sync with the camera. A CSS `transition` is the camera move.
// ---------------------------------------------------------------------------

const TARGET = 82; // % of the viewport's limiting dimension the sign should fill
const MAX_SCALE = 14;
const PORTRAIT_LIFT = 10; // % of the viewport — sit the sign a little above centre

function containBox(aspect: number, w: number, h: number) {
  return w / h > aspect
    ? { imgW: h * aspect, imgH: h } // viewport wider than the image → fit to height
    : { imgW: w, imgH: w / aspect }; // fit to width
}

function CameraStage({
  imageSrc,
  region,
  focused,
  blurIntensity,
  dimIntensity,
  animationDuration,
  className,
}: ImageFocusStageProps) {
  const [vp, setVp] = React.useState<{ w: number; h: number } | null>(() =>
    typeof window !== "undefined" && window.innerWidth > 0
      ? { w: window.innerWidth, h: window.innerHeight }
      : null,
  );
  const [imgAspect, setImgAspect] = React.useState(16 / 9);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      if (window.innerWidth > 0)
        setVp({ w: window.innerWidth, h: window.innerHeight });
    };
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Before we know the viewport (the SSR / pre-hydration tick), just show the
  // un-zoomed chart.
  if (!vp) {
    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-ink",
          className,
        )}
      >
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
        />
      </div>
    );
  }

  const { imgW, imgH } = containBox(imgAspect, vp.w, vp.h);
  const fracW = imgW / vp.w;
  const fracH = imgH / vp.h;
  const portrait = vp.h > vp.w;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  // The focused region's rect in *screen* pixels (centred, with the portrait lift).
  let rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;
  if (focused && region) {
    scale = Math.min(
      TARGET / (region.width * fracW),
      TARGET / (region.height * fracH),
      MAX_SCALE,
    );
    tx = -((region.x + region.width / 2 - 50) * scale);
    ty = -((region.y + region.height / 2 - 50) * scale);
    if (portrait) ty -= PORTRAIT_LIFT / fracH; // viewport % → image-box %
    const w = (imgW * scale * region.width) / 100;
    const h = (imgH * scale * region.height) / 100;
    const lift = portrait ? (PORTRAIT_LIFT / 100) * vp.h : 0;
    rect = {
      left: (vp.w - w) / 2,
      top: (vp.h - h) / 2 - lift,
      width: w,
      height: h,
    };
  }

  const dim = (dimIntensity * 0.6).toFixed(2);
  const move = `top ${animationDuration}ms ease-in-out, left ${animationDuration}ms ease-in-out, width ${animationDuration}ms ease-in-out, height ${animationDuration}ms ease-in-out`;
  const veil = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    backgroundColor: `rgba(0,0,0,${dim})`,
    backdropFilter: `blur(${blurIntensity}px)`,
    WebkitBackdropFilter: `blur(${blurIntensity}px)`,
    transition: move,
    pointerEvents: "none",
    ...extra,
  });

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-ink", className)}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            width: imgW,
            height: imgH,
            transform: `translate(${tx}%, ${ty}%) scale(${scale})`,
            transformOrigin: "center center",
            transition: `transform ${animationDuration}ms ease-in-out`,
          }}
        >
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="block h-full w-full select-none"
            onLoad={(e) => {
              const i = e.currentTarget;
              if (i.naturalWidth > 0 && i.naturalHeight > 0)
                setImgAspect(i.naturalWidth / i.naturalHeight);
            }}
          />
        </div>
      </div>

      {/* dim + blur everything except the focused sign */}
      {rect && (
        <>
          <div
            style={veil({
              left: 0,
              right: 0,
              top: 0,
              height: Math.max(0, rect.top),
            })}
          />
          <div
            style={veil({
              left: 0,
              right: 0,
              top: rect.top + rect.height,
              bottom: 0,
            })}
          />
          <div
            style={veil({
              left: 0,
              top: Math.max(0, rect.top),
              width: Math.max(0, rect.left),
              height: rect.height,
            })}
          />
          <div
            style={veil({
              left: rect.left + rect.width,
              right: 0,
              top: Math.max(0, rect.top),
              height: rect.height,
            })}
          />
          <div
            className="pointer-events-none absolute border-2 border-white/65"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              transition: move,
            }}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// non-fill — the classic zoom-and-blur transform inside an aspect-video box.
// (Used by `/tools/image-coords`'s preview and the trainer's "ready" card.)
// ---------------------------------------------------------------------------

function ClassicStage({
  imageSrc,
  region,
  focused,
  blurIntensity,
  dimIntensity,
  animationDuration,
  aspectClassName = "aspect-video",
  className,
}: ImageFocusStageProps) {
  const active = focused && !!region;
  const transform = active
    ? computeRegionTransform(region, { fill: 90, maxScale: 12 })
    : IDENTITY_REGION_TRANSFORM;
  const dim = dimIntensity * 0.1;
  const overlay = (style: React.CSSProperties) => ({
    backgroundColor: `rgba(0,0,0,${dim})`,
    backdropFilter: `blur(${blurIntensity}px)`,
    WebkitBackdropFilter: `blur(${blurIntensity}px)`,
    ...style,
  });

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border-2 border-ink bg-ink",
        aspectClassName,
        className,
      )}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: transform.transform,
          transformOrigin: "center center",
          transition: `transform ${animationDuration}ms ease-in-out`,
        }}
      >
        <div className="relative max-h-full max-w-full">
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="block max-h-full w-auto max-w-full select-none object-contain"
          />
          {active && region && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0"
                style={overlay({ top: 0, height: `${region.y}%` })}
              />
              <div
                className="pointer-events-none absolute inset-x-0"
                style={overlay({
                  top: `${region.y + region.height}%`,
                  bottom: 0,
                })}
              />
              <div
                className="pointer-events-none absolute inset-y-0"
                style={overlay({ left: 0, width: `${region.x}%` })}
              />
              <div
                className="pointer-events-none absolute inset-y-0"
                style={overlay({
                  left: `${region.x + region.width}%`,
                  right: 0,
                })}
              />
              <div
                className="pointer-events-none absolute border-2 border-white/70"
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
