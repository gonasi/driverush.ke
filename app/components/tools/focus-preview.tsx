import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01FreeIcons,
  ArrowRight01FreeIcons,
  FocusPointFreeIcons,
  PauseFreeIcons,
  PlayFreeIcons,
} from "@hugeicons/core-free-icons";

import {
  computeRegionTransform,
  getSignCategory,
  orderRegions,
  type FocusRegion,
  type ImageFocusData,
} from "~/lib/image-focus";

import { Button } from "~/components/ui/button";
import { ImageFocusStage } from "~/components/brand/image-focus-stage";

type Phase = "full" | "focused" | "revealed";

type FocusPreviewProps = {
  data: ImageFocusData;
  selectedRegionId: string | null;
  onSelectRegion: (id: string) => void;
};

/**
 * Authoring preview — "what the trainer will look like". Uses the shared
 * {@link ImageFocusStage} for the zoom + blur visual and walks regions in the
 * same order the real trainer would ({@link orderRegions}). Adds authoring-only
 * controls (toggle zoom, reveal/hide name) on top.
 */
export function FocusPreview({
  data,
  selectedRegionId,
  onSelectRegion,
}: FocusPreviewProps) {
  const { settings } = data;
  const order = React.useMemo(
    () =>
      orderRegions(data.regions, {
        shuffle: settings.randomization === "shuffle",
        reverse: settings.reverseOrder,
        startIndex: settings.startIndex,
      }),
    [
      data.regions,
      settings.randomization,
      settings.reverseOrder,
      settings.startIndex,
    ],
  );

  const currentIndex = Math.max(
    0,
    order.findIndex((r) => r.id === selectedRegionId),
  );
  const region: FocusRegion | undefined = order[currentIndex];

  const [phase, setPhase] = React.useState<Phase>("full");
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAudio = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const goToOrderIndex = React.useCallback(
    (idx: number) => {
      if (order.length === 0) return;
      const next = (idx + order.length) % order.length;
      const r = order[next];
      if (r) onSelectRegion(r.id);
    },
    [order, onSelectRegion],
  );

  const reveal = React.useCallback(() => {
    setPhase("revealed");
    if (settings.playAudio && region?.audioSrc) {
      stopAudio();
      try {
        const a = new Audio(region.audioSrc);
        audioRef.current = a;
        void a.play().catch(() => {});
      } catch {
        /* ignore bad audio paths */
      }
    }
  }, [settings.playAudio, region?.audioSrc, stopAudio]);

  // Reset playback whenever the selection changes from the outside.
  React.useEffect(() => {
    clearTimer();
    stopAudio();
    setPhase("full");
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegionId]);

  // Mini state machine, active only while playing.
  React.useEffect(() => {
    if (!playing || !region) return;
    clearTimer();
    if (phase === "full") {
      timerRef.current = setTimeout(
        () => setPhase("focused"),
        settings.initialDisplayDuration * 1000,
      );
    } else if (phase === "focused") {
      if (settings.revealMode === "auto") {
        const delay = region.revealDelay ?? settings.defaultRevealDelay;
        timerRef.current = setTimeout(reveal, delay * 1000);
      }
    } else if (phase === "revealed" && settings.autoAdvance) {
      timerRef.current = setTimeout(() => {
        stopAudio();
        setPhase("full");
        goToOrderIndex(currentIndex + 1);
      }, settings.autoAdvanceDelay * 1000);
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, phase, region?.id, settings]);

  React.useEffect(
    () => () => {
      clearTimer();
      stopAudio();
    },
    [clearTimer, stopAudio],
  );

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      clearTimer();
      stopAudio();
    } else {
      setPhase("focused");
      setPlaying(true);
    }
  };

  if (order.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center border-2 border-dashed border-ink bg-paper-3 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
        Add a region to preview the trainer
      </div>
    );
  }

  const transform =
    region && phase !== "full" ? computeRegionTransform(region) : { scale: 1 };
  const cat = region ? getSignCategory(region.category) : null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <ImageFocusStage
          imageSrc={data.imageSrc}
          region={region ?? null}
          focused={phase !== "full"}
          blurIntensity={settings.blurIntensity}
          dimIntensity={settings.dimIntensity}
          animationDuration={settings.animationDuration}
        />

        {phase === "revealed" && region && (
          <div className="absolute inset-x-0 bottom-0 z-10 border-t-2 border-ink bg-surface/95 px-4 py-3 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl">
              <span className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                <span className="text-ink-2">
                  {cat?.emoji} {cat?.label}
                </span>
                {region.code && <span>· {region.code}</span>}
              </span>
              <p className="m-0 mt-0.5 font-display text-[clamp(18px,3vw,26px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
                {region.name || "(unnamed)"}
              </p>
              {region.note && (
                <p className="m-0 mt-1 text-[13px] leading-snug text-ink-2">
                  {region.note}
                </p>
              )}
            </div>
          </div>
        )}

        <span className="absolute left-2 top-2 z-10 bg-ink px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-paper">
          {currentIndex + 1} / {order.length}
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="paper"
          size="sm"
          onClick={() => goToOrderIndex(currentIndex - 1)}
          aria-label="Previous region"
        >
          <HugeiconsIcon
            icon={ArrowLeft01FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
        </Button>
        <Button variant="ink" size="sm" onClick={togglePlay}>
          <HugeiconsIcon
            icon={playing ? PauseFreeIcons : PlayFreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant="paper"
          size="sm"
          onClick={() => goToOrderIndex(currentIndex + 1)}
          aria-label="Next region"
        >
          <HugeiconsIcon
            icon={ArrowRight01FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
        </Button>

        <span className="mx-1 h-5 w-px bg-line" />

        <Button
          variant={phase === "full" ? "paper" : "amber"}
          size="sm"
          onClick={() => setPhase((p) => (p === "full" ? "focused" : "full"))}
        >
          <HugeiconsIcon
            icon={FocusPointFreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          {phase === "full" ? "Zoom in" : "Show full"}
        </Button>
        <Button
          variant="paper"
          size="sm"
          onClick={() =>
            phase === "revealed" ? setPhase("focused") : reveal()
          }
          disabled={phase === "full"}
        >
          {phase === "revealed" ? "Hide name" : "Reveal name"}
        </Button>

        <span className="ml-auto truncate font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          zoom ≈ {transform.scale.toFixed(2)}× · {region?.name || "—"}
        </span>
      </div>
    </div>
  );
}
