import * as React from "react";
import { useFetcher } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { toast } from "sonner";
import {
  ArrowDown01FreeIcons,
  ArrowUp01FreeIcons,
  Copy01FreeIcons,
  Delete02FreeIcons,
  Download01FreeIcons,
  FloppyDiskFreeIcons,
  Image02FreeIcons,
  PencilEdit01FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/image-coords";

import {
  DEFAULT_IMAGE_FOCUS_SETTINGS,
  getSignCategory,
  moveRegionToIndex,
  ROAD_SIGNS_IMAGE_SRC,
  SIGN_CATEGORIES,
  type FocusRegion,
  type ImageFocusData,
  type ImageFocusSettings,
  type SignCategoryId,
} from "~/lib/image-focus";
import {
  isDevWriteEnabled,
  readBoard,
  writeBoard,
} from "~/lib/road-signs-data.server";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  NumberRow,
  SelectRow,
  SliderRow,
  ToggleRow,
} from "~/components/brand/setting-controls";
import {
  ImageRegionEditor,
  type RegionGeometry,
} from "~/components/tools/image-region-editor";
import { FocusPreview } from "~/components/tools/focus-preview";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Image coordinates · DriveRush Tools" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

const DRAFT_KEY = "driverush:tools:road-signs";
const DATA_FILE_LABEL = "app/data/road-signs-pelican.json";

// ---------------------------------------------------------------------------
// Data functions — one source of truth: app/data/road-signs-pelican.json.
// ---------------------------------------------------------------------------

export function loader(_: Route.LoaderArgs) {
  return { data: readBoard(), canSave: isDevWriteEnabled() };
}

export async function action({ request }: Route.ActionArgs) {
  if (!isDevWriteEnabled()) {
    throw new Response("Writes are disabled outside development.", {
      status: 403,
    });
  }
  const form = await request.formData();
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    throw new Response("Payload was not valid JSON.", { status: 422 });
  }
  const saved = writeBoard(parsed);
  return { ok: true as const, savedAt: Date.now(), data: saved };
}

// ---------------------------------------------------------------------------

function makeDefaultData(): ImageFocusData {
  return {
    imageSrc: ROAD_SIGNS_IMAGE_SRC,
    imageWidth: 1920,
    imageHeight: 1080,
    settings: { ...DEFAULT_IMAGE_FOCUS_SETTINGS },
    regions: [],
  };
}

function normalizeData(
  parsed: Partial<ImageFocusData> | null | undefined,
): ImageFocusData {
  const base = makeDefaultData();
  if (!parsed || typeof parsed !== "object") return base;
  return {
    ...base,
    ...parsed,
    imageSrc: ROAD_SIGNS_IMAGE_SRC, // the board image is fixed
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    regions: Array.isArray(parsed.regions) ? reindex(parsed.regions) : [],
  };
}

function makeRegionId(existing: FocusRegion[]): string {
  let id = "";
  do {
    id = `region-${Math.random().toString(36).slice(2, 8)}`;
  } while (existing.some((r) => r.id === id));
  return id;
}

function reindex(regions: FocusRegion[]): FocusRegion[] {
  return [...regions]
    .sort((a, b) => a.index - b.index)
    .map((r, i) => ({ ...r, index: i }));
}

// ---------------------------------------------------------------------------

export default function ImageCoordsTool({ loaderData }: Route.ComponentProps) {
  const { data: savedData, canSave } = loaderData;
  const saveFetcher = useFetcher<typeof action>();

  const [data, setData] = React.useState<ImageFocusData>(savedData);
  const [mode, setMode] = React.useState<"overview" | "crop">("overview");
  const [editingRegionId, setEditingRegionId] = React.useState<string | null>(
    null,
  );
  const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(
    null,
  );
  const [naturalSize, setNaturalSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const [importText, setImportText] = React.useState("");
  const [importError, setImportError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [hasDraft, setHasDraft] = React.useState(false);
  const skipFirstPersist = React.useRef(true);

  const savedJson = React.useMemo(() => JSON.stringify(savedData), [savedData]);
  const currentJson = React.useMemo(() => JSON.stringify(data), [data]);
  const dirty = currentJson !== savedJson;

  // ---- hydrate once on mount: prefer a local draft, else the saved file ----
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ImageFocusData;
        if (parsed && Array.isArray(parsed.regions)) {
          const merged = normalizeData(parsed);
          if (JSON.stringify(merged) !== savedJson) {
            setData(merged);
            setHasDraft(true);
          }
        }
      }
    } catch {
      /* corrupt draft — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persist the working draft while it differs from the file ----
  React.useEffect(() => {
    // Skip the first flush — `data` may still be re-hydrating from a draft.
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    try {
      if (currentJson !== savedJson) {
        window.localStorage.setItem(DRAFT_KEY, currentJson);
        setHasDraft(true);
      } else {
        window.localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
      }
    } catch {
      /* quota / private mode — ignore */
    }
  }, [currentJson, savedJson]);

  // ---- toast on successful save ----
  React.useEffect(() => {
    if (saveFetcher.data?.ok) toast.success(`Saved to ${DATA_FILE_LABEL}`);
  }, [saveFetcher.data]);

  const regions = React.useMemo(
    () => [...data.regions].sort((a, b) => a.index - b.index),
    [data.regions],
  );
  const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? null;
  const editingRegion = regions.find((r) => r.id === editingRegionId) ?? null;

  // ---- region ops ----
  const patchSettings = (partial: Partial<ImageFocusSettings>) =>
    setData((d) => ({ ...d, settings: { ...d.settings, ...partial } }));

  const patchRegion = (id: string, partial: Partial<FocusRegion>) =>
    setData((d) => ({
      ...d,
      regions: d.regions.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    }));

  const setRegionOrderIndex = (id: string, newIndex: number) =>
    setData((d) => ({
      ...d,
      regions: moveRegionToIndex(d.regions, id, newIndex),
    }));

  const renameRegionId = (oldId: string, newId: string) => {
    const trimmed = newId.trim();
    if (!trimmed || regions.some((r) => r.id === trimmed && r.id !== oldId)) {
      return; // empty or collision — ignore
    }
    setData((d) => ({
      ...d,
      regions: d.regions.map((r) =>
        r.id === oldId ? { ...r, id: trimmed } : r,
      ),
    }));
    if (selectedRegionId === oldId) setSelectedRegionId(trimmed);
    if (editingRegionId === oldId) setEditingRegionId(trimmed);
  };

  const deleteRegion = (id: string) => {
    setData((d) => ({
      ...d,
      regions: reindex(d.regions.filter((r) => r.id !== id)),
    }));
    if (selectedRegionId === id) setSelectedRegionId(null);
    if (editingRegionId === id) {
      setEditingRegionId(null);
      setMode("overview");
    }
  };

  const moveRegion = (id: string, dir: -1 | 1) => {
    setData((d) => {
      const sorted = [...d.regions].sort((a, b) => a.index - b.index);
      const i = sorted.findIndex((r) => r.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return d;
      const swap = sorted[i]!;
      sorted[i] = sorted[j]!;
      sorted[j] = swap;
      return { ...d, regions: sorted.map((r, idx) => ({ ...r, index: idx })) };
    });
  };

  const handleConfirmCrop = (geometry: RegionGeometry) => {
    if (editingRegionId) {
      patchRegion(editingRegionId, geometry);
      setSelectedRegionId(editingRegionId);
    } else {
      setData((d) => {
        const id = makeRegionId(d.regions);
        const region: FocusRegion = {
          id,
          name: "",
          category: "warning",
          index: d.regions.length,
          ...geometry,
        };
        setSelectedRegionId(id);
        return { ...d, regions: [...d.regions, region] };
      });
    }
    setEditingRegionId(null);
    setMode("overview");
  };

  const handleMediaLoaded = (size: {
    naturalWidth: number;
    naturalHeight: number;
  }) => {
    setNaturalSize({ width: size.naturalWidth, height: size.naturalHeight });
    setData((d) =>
      d.imageWidth === size.naturalWidth && d.imageHeight === size.naturalHeight
        ? d
        : {
            ...d,
            imageWidth: size.naturalWidth,
            imageHeight: size.naturalHeight,
          },
    );
  };

  // ---- save / revert ----
  const saveToProject = () => {
    saveFetcher.submit({ data: JSON.stringify(data) }, { method: "post" });
  };

  const revertToSaved = () => {
    if (!dirty) return;
    if (
      !window.confirm("Discard your unsaved changes and reload the saved file?")
    )
      return;
    setData(savedData);
    setSelectedRegionId(null);
    setEditingRegionId(null);
    setMode("overview");
  };

  // ---- export / import ----
  const json = React.useMemo(() => JSON.stringify(data, null, 2), [data]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };

  const downloadJson = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "road-signs-pelican.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromJson = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText) as ImageFocusData;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray(parsed.regions)
      ) {
        throw new Error("Expected an object with a `regions` array.");
      }
      setData(normalizeData(parsed));
      setSelectedRegionId(null);
      setEditingRegionId(null);
      setMode("overview");
      setImportText("");
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Invalid JSON.");
    }
  };

  const saving = saveFetcher.state !== "idle";

  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      <header className="border-b-2 border-ink pb-6">
        <span className="eyebrow text-ink">Tool · image focus authoring</span>
        <h1 className="m-0 mt-3 font-display text-[clamp(28px,4.5vw,44px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
          Image <span className="italic text-rush">coordinates</span>
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-[clamp(15px,1.9vw,19px)] leading-tight text-ink-2">
          Crop a box over each sign, name it, eyeball the zoom-and-blur preview,
          then <strong>Save to project</strong> — it writes the one source of
          truth, <code>{DATA_FILE_LABEL}</code>, which{" "}
          <code>/road-signs/pelican</code> reads.
        </p>
      </header>

      {/* ---- Status bar ---- */}
      <section className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper-3 px-4 py-3">
        <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          <HugeiconsIcon icon={Image02FreeIcons} size={13} strokeWidth={2} />
          {ROAD_SIGNS_IMAGE_SRC}
          {" · "}
          {naturalSize
            ? `${naturalSize.width}×${naturalSize.height}px`
            : `${data.imageWidth}×${data.imageHeight}px`}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-mono text-[10.5px] uppercase tracking-widest",
              dirty ? "text-rush" : "text-ink-3",
            )}
          >
            {dirty ? "● unsaved changes" : "✓ in sync with file"}
            {hasDraft && dirty ? " (draft kept)" : ""}
          </span>
          <Button
            variant="rush"
            size="sm"
            onClick={saveToProject}
            disabled={!canSave || !dirty || saving}
          >
            <HugeiconsIcon
              icon={FloppyDiskFreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            {saving ? "Saving…" : "Save to project"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={revertToSaved}
            disabled={!dirty}
          >
            Revert to saved
          </Button>
        </div>
      </section>
      {!canSave && (
        <p className="-mt-6 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Saving to the project is disabled outside <code>npm run dev</code> —
          use Copy / Download below instead.
        </p>
      )}

      {/* ---- Editor ---- */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
          1 · {mode === "crop" ? "Crop a region" : "Regions"}
        </h2>
        <ImageRegionEditor
          imageSrc={ROAD_SIGNS_IMAGE_SRC}
          regions={regions}
          mode={mode}
          editingRegion={editingRegion}
          selectedRegionId={selectedRegionId}
          naturalSize={naturalSize}
          onSelectRegion={setSelectedRegionId}
          onRequestNewRegion={() => {
            setEditingRegionId(null);
            setMode("crop");
          }}
          onRequestEditRegion={(id) => {
            setEditingRegionId(id);
            setSelectedRegionId(id);
            setMode("crop");
          }}
          onConfirmCrop={handleConfirmCrop}
          onCancelCrop={() => {
            setEditingRegionId(null);
            setMode("overview");
          }}
          onMediaLoaded={handleMediaLoaded}
        />
      </section>

      {/* ---- Region list + selected region form ---- */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <h2 className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
            2 · Region list
          </h2>
          {regions.length === 0 ? (
            <p className="border-2 border-dashed border-ink bg-paper-3 px-4 py-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
              No regions yet — hit “New region” above
            </p>
          ) : (
            <ul className="divide-y-2 divide-ink border-2 border-ink bg-surface">
              {regions.map((r, i) => {
                const active = r.id === selectedRegionId;
                const named = r.name.trim().length > 0;
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5",
                      active && "bg-paper-3",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center border-2 border-ink font-mono text-[11px] font-bold",
                        named
                          ? "bg-kenya-green text-white"
                          : "bg-hazard text-ink",
                      )}
                    >
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedRegionId(r.id)}
                      className="min-w-0 flex-1 text-left outline-none"
                    >
                      <span className="block truncate font-display text-[13px] font-extrabold uppercase tracking-wide text-ink">
                        {r.name || "(unnamed)"}
                      </span>
                      <span className="block truncate font-mono text-[9.5px] uppercase tracking-widest text-ink-3">
                        {r.code ? `${r.code} · ` : ""}
                        {getSignCategory(r.category).label} · {Math.round(r.x)},
                        {Math.round(r.y)} · {Math.round(r.width)}×
                        {Math.round(r.height)}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconBtn
                        label="Move up"
                        icon={ArrowUp01FreeIcons}
                        disabled={i === 0}
                        onClick={() => moveRegion(r.id, -1)}
                      />
                      <IconBtn
                        label="Move down"
                        icon={ArrowDown01FreeIcons}
                        disabled={i === regions.length - 1}
                        onClick={() => moveRegion(r.id, 1)}
                      />
                      <IconBtn
                        label="Edit crop"
                        icon={PencilEdit01FreeIcons}
                        onClick={() => {
                          setEditingRegionId(r.id);
                          setSelectedRegionId(r.id);
                          setMode("crop");
                        }}
                      />
                      <IconBtn
                        label="Delete"
                        icon={Delete02FreeIcons}
                        danger
                        onClick={() => deleteRegion(r.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
            3 · Region details
          </h2>
          {selectedRegion ? (
            <RegionForm
              key={selectedRegion.id}
              region={selectedRegion}
              regionCount={regions.length}
              onPatch={(p) => patchRegion(selectedRegion.id, p)}
              onRenameId={(id) => renameRegionId(selectedRegion.id, id)}
              onSetOrderIndex={(idx) =>
                setRegionOrderIndex(selectedRegion.id, idx)
              }
            />
          ) : (
            <p className="border-2 border-dashed border-ink bg-paper-3 px-4 py-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Select a region to edit its name &amp; metadata
            </p>
          )}
        </div>
      </section>

      {/* ---- Preview ---- */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
          4 · Preview
        </h2>
        <FocusPreview
          data={data}
          selectedRegionId={selectedRegionId}
          onSelectRegion={setSelectedRegionId}
        />
      </section>

      {/* ---- Settings ---- */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
          5 · Playback settings
          <span className="ml-2 font-mono text-[10px] font-normal normal-case tracking-normal text-ink-3">
            these drive the real /road-signs/pelican gameplay
          </span>
        </h2>
        <SettingsPanel
          settings={data.settings}
          regions={regions}
          onPatch={patchSettings}
        />
      </section>

      {/* ---- Export / import ---- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
            6 · JSON
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="ink" size="sm" onClick={copyJson}>
              <HugeiconsIcon
                icon={Copy01FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="paper" size="sm" onClick={downloadJson}>
              <HugeiconsIcon
                icon={Download01FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              Download
            </Button>
          </div>
        </div>

        <div className="border-2 border-ink bg-ink">
          <div className="flex items-center justify-between border-b-2 border-ink bg-paper-3 px-3.5 py-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-ink">
            <span>{DATA_FILE_LABEL}</span>
            <span>
              {regions.length} region{regions.length === 1 ? "" : "s"}
              {dirty ? " · unsaved" : ""}
            </span>
          </div>
          <pre className="max-h-96 overflow-auto p-3.5 font-mono text-[11.5px] leading-relaxed text-paper">
            {json}
          </pre>
        </div>

        <details className="border-2 border-ink bg-surface">
          <summary className="cursor-pointer select-none px-3.5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-ink-2 hover:text-ink">
            Import — paste JSON to replace the working set
          </summary>
          <div className="space-y-2.5 border-t-2 border-ink p-3.5">
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{ "settings": { ... }, "regions": [ ... ] }'
              className="min-h-32 font-mono text-[12px]"
            />
            {importError && (
              <p className="font-mono text-[11px] text-rush">{importError}</p>
            )}
            <Button
              variant="ink"
              size="sm"
              onClick={loadFromJson}
              disabled={!importText.trim()}
            >
              Load into editor
            </Button>
          </div>
        </details>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IconBtn({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: IconSvgElement;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center border-2 border-ink bg-surface text-ink outline-none transition-colors",
        "hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper",
        "disabled:pointer-events-none disabled:opacity-40",
        danger && "hover:bg-rush focus-visible:bg-rush",
      )}
    >
      <HugeiconsIcon icon={icon} size={13} strokeWidth={2.25} />
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {hint && (
          <span className="ml-1.5 font-mono text-[9.5px] font-normal lowercase tracking-normal text-ink-3">
            {hint}
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

function RegionForm({
  region,
  regionCount,
  onPatch,
  onRenameId,
  onSetOrderIndex,
}: {
  region: FocusRegion;
  regionCount: number;
  onPatch: (p: Partial<FocusRegion>) => void;
  onRenameId: (id: string) => void;
  onSetOrderIndex: (index: number) => void;
}) {
  const [idDraft, setIdDraft] = React.useState(region.id);
  React.useEffect(() => setIdDraft(region.id), [region.id]);
  const cat = getSignCategory(region.category);

  return (
    <div className="space-y-4 border-2 border-ink bg-surface p-4">
      <Field label="Name" hint="shown when revealed">
        <Input
          value={region.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="e.g. Pelican crossing"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectRow
          label="Category"
          value={region.category}
          options={SIGN_CATEGORIES.map((c) => ({
            value: c.id,
            label: `${c.emoji} ${c.label}`,
          }))}
          onValueChange={(v) => onPatch({ category: v as SignCategoryId })}
        />
        <Field
          label="Code"
          hint={cat.prefix ? `optional — e.g. ${cat.prefix}.1` : "optional"}
        >
          <Input
            value={region.code ?? ""}
            onChange={(e) => onPatch({ code: e.target.value || undefined })}
            placeholder={cat.prefix ? `${cat.prefix}.1` : "e.g. W.1"}
          />
        </Field>
      </div>
      <p className="-mt-1 font-mono text-[9.5px] uppercase tracking-widest text-ink-3">
        {cat.emoji} {cat.shape || "no shape hint"}
        {cat.count > 0 ? ` · ${cat.count} signs in the Code` : ""}
      </p>

      <Field label="Note" hint="optional — rule context / what to do">
        <Textarea
          value={region.note ?? ""}
          onChange={(e) => onPatch({ note: e.target.value || undefined })}
          className="min-h-20"
          placeholder="Pedestrians can stop the traffic — give way when the lights flash amber."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Audio path"
          hint="optional — file in public/assets/road-signs/sounds/"
        >
          <div className="flex gap-2">
            <Input
              value={region.audioSrc ?? ""}
              onChange={(e) =>
                onPatch({ audioSrc: e.target.value || undefined })
              }
              placeholder="/assets/road-signs/sounds/pelican.mp3"
            />
            <Button
              variant="paper"
              type="button"
              disabled={!region.audioSrc}
              onClick={() => {
                if (!region.audioSrc) return;
                try {
                  void new Audio(region.audioSrc).play().catch(() => {});
                } catch {
                  /* ignore */
                }
              }}
              aria-label="Play audio"
            >
              ▶
            </Button>
          </div>
        </Field>
        <Field label="Reveal delay" hint="seconds — blank = use default">
          <Input
            type="number"
            min={0}
            max={30}
            step={0.5}
            value={region.revealDelay ?? ""}
            onChange={(e) =>
              onPatch({
                revealDelay:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder={String(
              DEFAULT_IMAGE_FOCUS_SETTINGS.defaultRevealDelay,
            )}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Region id" hint="slug — used as the key">
          <Input
            value={idDraft}
            onChange={(e) => setIdDraft(e.target.value)}
            onBlur={() => onRenameId(idDraft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRenameId(idDraft);
              }
            }}
            className="font-mono text-[13px]"
          />
        </Field>
        <Field label="Order index" hint={`0 … ${Math.max(0, regionCount - 1)}`}>
          <Input
            type="number"
            min={0}
            max={Math.max(0, regionCount - 1)}
            step={1}
            value={region.index}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return;
              onSetOrderIndex(Number(v));
            }}
          />
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t-2 border-dashed border-ink pt-3">
        {(["x", "y", "width", "height"] as const).map((k) => (
          <Field key={k} label={k}>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={region[k]}
              onChange={(e) =>
                onPatch({ [k]: Number(e.target.value) } as Partial<FocusRegion>)
              }
              className="px-2 text-[13px]"
            />
          </Field>
        ))}
      </div>
      <p className="font-mono text-[9.5px] uppercase tracking-widest text-ink-3">
        all geometry values are % of the image · saved zoom{" "}
        {region.zoom?.toFixed(2) ?? "—"}×
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SettingsPanel({
  settings,
  regions,
  onPatch,
}: {
  settings: ImageFocusSettings;
  regions: FocusRegion[];
  onPatch: (p: Partial<ImageFocusSettings>) => void;
}) {
  const shuffled = settings.randomization === "shuffle";
  const maxStart = Math.max(0, regions.length - 1);
  const startRegion = regions[Math.min(settings.startIndex, maxStart)];
  const startHint =
    regions.length === 0
      ? "no regions"
      : startRegion
        ? `→ ${startRegion.name || `region ${settings.startIndex + 1}`}`
        : "";

  return (
    <div className="space-y-5 border-2 border-ink bg-paper-3 p-4">
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <SliderRow
          label="Blur intensity"
          value={settings.blurIntensity}
          min={0}
          max={20}
          step={1}
          unit="px"
          onValueChange={(n) => onPatch({ blurIntensity: n })}
        />
        <SliderRow
          label="Dim intensity"
          value={settings.dimIntensity}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onValueChange={(n) => onPatch({ dimIntensity: n })}
        />
        <SliderRow
          label="Animation duration"
          value={settings.animationDuration}
          min={200}
          max={2000}
          step={50}
          unit="ms"
          onValueChange={(n) => onPatch({ animationDuration: n })}
        />
        <SliderRow
          label="Default reveal delay"
          value={settings.defaultRevealDelay}
          min={0}
          max={30}
          step={0.5}
          unit="s"
          onValueChange={(n) => onPatch({ defaultRevealDelay: n })}
        />
        <SliderRow
          label="Initial display"
          value={settings.initialDisplayDuration}
          min={0.5}
          max={5}
          step={0.1}
          unit="s"
          onValueChange={(n) => onPatch({ initialDisplayDuration: n })}
        />
        <SliderRow
          label="Between regions"
          value={settings.betweenRegionsDuration}
          min={0.3}
          max={5}
          step={0.1}
          unit="s"
          onValueChange={(n) => onPatch({ betweenRegionsDuration: n })}
        />
        <SliderRow
          label="Auto-advance delay"
          value={settings.autoAdvanceDelay}
          min={1}
          max={60}
          step={1}
          unit="s"
          onValueChange={(n) => onPatch({ autoAdvanceDelay: n })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          label="Auto-advance"
          description="Move to the next sign after the answer shows"
          checked={settings.autoAdvance}
          onCheckedChange={(b) => onPatch({ autoAdvance: b })}
        />
        <ToggleRow
          label="Play audio"
          description="Play a sign's sound on reveal"
          checked={settings.playAudio}
          onCheckedChange={(b) => onPatch({ playAudio: b })}
        />
        <ToggleRow
          label="Loop playback"
          description="Wrap from the last sign back to the first"
          checked={settings.loopPlayback}
          onCheckedChange={(b) => onPatch({ loopPlayback: b })}
        />
        <ToggleRow
          label="Reverse order"
          description={
            shuffled ? "Ignored while shuffled" : "Play last → first"
          }
          checked={settings.reverseOrder}
          onCheckedChange={(b) => onPatch({ reverseOrder: b })}
          disabled={shuffled}
        />
        <SelectRow
          label="Reveal mode"
          value={settings.revealMode}
          options={[
            { value: "auto", label: "Auto — reveal after a timer" },
            { value: "manual", label: "Manual — tap to reveal" },
          ]}
          onValueChange={(v) => onPatch({ revealMode: v })}
        />
        <SelectRow
          label="Region order"
          value={settings.randomization}
          options={[
            { value: "none", label: "Sequential" },
            { value: "shuffle", label: "Shuffled" },
          ]}
          onValueChange={(v) => onPatch({ randomization: v })}
        />
        <NumberRow
          label="Start at region"
          hint={startHint}
          value={settings.startIndex}
          min={0}
          max={maxStart}
          step={1}
          disabled={shuffled || regions.length === 0}
          onValueChange={(n) =>
            onPatch({ startIndex: Math.min(Math.max(0, n), maxStart) })
          }
        />
      </div>
    </div>
  );
}
