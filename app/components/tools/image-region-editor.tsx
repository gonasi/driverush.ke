import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01FreeIcons,
  Cancel01FreeIcons,
  GridViewFreeIcons,
  PencilEdit01FreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";
import Cropper, {
  type Area,
  type MediaSize,
  type Point,
} from "react-easy-crop";

import type { FocusRegion } from "~/lib/image-focus";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";

/** What the cropper hands back when a region's box is confirmed. */
export type RegionGeometry = Pick<
  FocusRegion,
  "x" | "y" | "width" | "height" | "zoom" | "cropX" | "cropY"
>;

/** Aspect-ratio presets for the crop box (ported from Gonasi). */
const ASPECT_PRESETS: { value: number; label: string }[] = [
  { value: 1, label: "1:1 Square" },
  { value: 4 / 3, label: "4:3 Landscape" },
  { value: 3 / 4, label: "3:4 Portrait" },
  { value: 3 / 2, label: "3:2 Landscape" },
  { value: 2 / 3, label: "2:3 Portrait" },
  { value: 16 / 9, label: "16:9 Widescreen" },
  { value: 9 / 16, label: "9:16 Mobile" },
];

// ---------------------------------------------------------------------------
// Region cropper — react-easy-crop. (Its module scope is SSR-safe — all
// window/document access is guarded inside the class — so a plain import is
// fine; the `<Cropper>` itself only mounts client-side in "crop" mode.)
// ---------------------------------------------------------------------------

const DEFAULT_NEW_AREA: Area = { x: 30, y: 30, width: 40, height: 40 };

type RegionCropperProps = {
  imageSrc: string;
  /** When editing an existing region, seed the crop from it. */
  region: FocusRegion | null;
  /** Natural image size, used to compute a faithful aspect when editing. */
  naturalSize: { width: number; height: number } | null;
  onConfirm: (geometry: RegionGeometry) => void;
  onCancel: () => void;
  onMediaLoaded?: (size: {
    naturalWidth: number;
    naturalHeight: number;
  }) => void;
};

function RegionCropper({
  imageSrc,
  region,
  naturalSize,
  onConfirm,
  onCancel,
  onMediaLoaded,
}: RegionCropperProps) {
  // The crop box aspect when re-opening an existing region — its pixel aspect,
  // so re-editing doesn't distort it. `null` until we know it.
  const boxAspect = React.useMemo(() => {
    if (!region) return null;
    const h = naturalSize ? region.height * naturalSize.height : region.height;
    const w = naturalSize ? region.width * naturalSize.width : region.width;
    return h <= 0 ? null : w / h;
  }, [region, naturalSize]);

  const matchingPreset =
    boxAspect == null
      ? undefined
      : ASPECT_PRESETS.find((p) => Math.abs(p.value - boxAspect) < 0.01);

  const [aspect, setAspect] = React.useState<number>(
    matchingPreset?.value ?? boxAspect ?? 1,
  );
  const [crop, setCrop] = React.useState<Point>({
    x: region?.cropX ?? 0,
    y: region?.cropY ?? 0,
  });
  const [zoom, setZoom] = React.useState(region?.zoom ?? 1);
  const [showGrid, setShowGrid] = React.useState(true);
  const [restrictPosition, setRestrictPosition] = React.useState(true);
  const [croppedArea, setCroppedArea] = React.useState<Area | null>(
    region
      ? { x: region.x, y: region.y, width: region.width, height: region.height }
      : DEFAULT_NEW_AREA,
  );

  const initialArea: Area = region
    ? { x: region.x, y: region.y, width: region.width, height: region.height }
    : DEFAULT_NEW_AREA;

  const handleConfirm = () => {
    if (!croppedArea) return;
    onConfirm({
      x: round(croppedArea.x),
      y: round(croppedArea.y),
      width: round(croppedArea.width),
      height: round(croppedArea.height),
      zoom: round(zoom, 3),
      cropX: round(crop.x, 2),
      cropY: round(crop.y, 2),
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative h-[clamp(280px,52vh,560px)] w-full overflow-hidden border-2 border-ink bg-ink">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={1}
          maxZoom={12}
          objectFit="contain"
          showGrid={showGrid}
          restrictPosition={restrictPosition}
          initialCroppedAreaPercentages={initialArea}
          onCropChange={setCrop}
          onZoomChange={(z) => setZoom(z)}
          onCropComplete={(area: Area) => setCroppedArea(area)}
          onMediaLoaded={(media: MediaSize) =>
            onMediaLoaded?.({
              naturalWidth: media.naturalWidth,
              naturalHeight: media.naturalHeight,
            })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="crop-aspect">Aspect ratio</Label>
          <Select
            value={String(aspect)}
            onValueChange={(v) => setAspect(Number(v))}
          >
            <SelectTrigger id="crop-aspect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {boxAspect != null && !matchingPreset && (
                <SelectItem value={String(boxAspect)}>
                  Match box ({boxAspect.toFixed(2)} : 1)
                </SelectItem>
              )}
              {ASPECT_PRESETS.map((p) => (
                <SelectItem key={p.label} value={String(p.value)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Zoom · {zoom.toFixed(1)}×</Label>
          <Slider
            value={[zoom]}
            min={1}
            max={12}
            step={0.1}
            onValueChange={([z]) => setZoom(z ?? 1)}
            className="py-2.5"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-2">
          <Checkbox
            checked={showGrid}
            onCheckedChange={(c) => setShowGrid(c === true)}
          />
          <HugeiconsIcon icon={GridViewFreeIcons} size={13} strokeWidth={2} />
          Grid
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-2">
          <Checkbox
            checked={restrictPosition}
            onCheckedChange={(c) => setRestrictPosition(c === true)}
          />
          Restrict to image
        </label>
        <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {croppedArea
            ? `x ${round(croppedArea.x)}% · y ${round(croppedArea.y)}% · w ${round(croppedArea.width)}% · h ${round(croppedArea.height)}%`
            : "drag to position the box"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 border-t-2 border-dashed border-ink pt-4">
        <Button variant="rush" onClick={handleConfirm} disabled={!croppedArea}>
          <HugeiconsIcon icon={Tick02FreeIcons} size={16} strokeWidth={2.5} />
          {region ? "Update box" : "Add region"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          <HugeiconsIcon icon={Cancel01FreeIcons} size={16} strokeWidth={2.5} />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview — the full image with every region drawn on it.
// ---------------------------------------------------------------------------

type ImageRegionEditorProps = {
  imageSrc: string;
  regions: FocusRegion[];
  /** `"overview"` shows all boxes; `"crop"` opens the cropper. */
  mode: "overview" | "crop";
  /** Region being edited in crop mode; `null` = drawing a brand-new one. */
  editingRegion: FocusRegion | null;
  /** Region highlighted in the overview. */
  selectedRegionId: string | null;
  naturalSize: { width: number; height: number } | null;
  onSelectRegion: (id: string) => void;
  onRequestNewRegion: () => void;
  onRequestEditRegion: (id: string) => void;
  onConfirmCrop: (geometry: RegionGeometry) => void;
  onCancelCrop: () => void;
  onMediaLoaded?: (size: {
    naturalWidth: number;
    naturalHeight: number;
  }) => void;
};

export function ImageRegionEditor({
  imageSrc,
  regions,
  mode,
  editingRegion,
  selectedRegionId,
  naturalSize,
  onSelectRegion,
  onRequestNewRegion,
  onRequestEditRegion,
  onConfirmCrop,
  onCancelCrop,
  onMediaLoaded,
}: ImageRegionEditorProps) {
  if (mode === "crop") {
    return (
      <RegionCropper
        key={editingRegion ? `edit-${editingRegion.id}` : "new"}
        imageSrc={imageSrc}
        region={editingRegion}
        naturalSize={naturalSize}
        onConfirm={onConfirmCrop}
        onCancel={onCancelCrop}
        onMediaLoaded={onMediaLoaded}
      />
    );
  }

  const sorted = [...regions].sort((a, b) => a.index - b.index);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="ink" onClick={onRequestNewRegion}>
          <HugeiconsIcon icon={Add01FreeIcons} size={16} strokeWidth={2.5} />
          New region
        </Button>
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {regions.length} region{regions.length === 1 ? "" : "s"} · click a box
          to edit its crop
        </span>
      </div>

      <div className="relative inline-block w-full border-2 border-ink bg-paper-3">
        <img
          src={imageSrc}
          alt="Source"
          className="block h-auto w-full select-none"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              onMediaLoaded?.({
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              });
            }
          }}
        />
        {sorted.map((r) => {
          const active = r.id === selectedRegionId;
          const named = r.name.trim().length > 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelectRegion(r.id);
                onRequestEditRegion(r.id);
              }}
              className={cn(
                "group/box absolute cursor-pointer outline-none transition-colors",
                active
                  ? "border-2 border-rush bg-rush/20"
                  : named
                    ? "border-2 border-kenya-green/80 bg-kenya-green/15 hover:bg-kenya-green/25"
                    : "border-2 border-hazard/80 bg-hazard/15 hover:bg-hazard/25",
              )}
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.width}%`,
                height: `${r.height}%`,
              }}
              title={`${r.index + 1}. ${r.name || "(unnamed)"}`}
            >
              <span
                className={cn(
                  "absolute -top-px left-0 px-1 py-px font-mono text-[9px] font-bold leading-none",
                  active
                    ? "bg-rush text-white"
                    : named
                      ? "bg-kenya-green text-white"
                      : "bg-hazard text-ink",
                )}
              >
                {r.index + 1}
              </span>
              <HugeiconsIcon
                icon={PencilEdit01FreeIcons}
                size={12}
                strokeWidth={2.5}
                className={cn(
                  "absolute right-0.5 top-0.5 opacity-0 transition-opacity group-hover/box:opacity-100",
                  active
                    ? "text-rush"
                    : named
                      ? "text-kenya-green"
                      : "text-hazard",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
