import * as React from "react";
import { useFetcher } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import {
  ArrowDown01FreeIcons,
  ArrowUp01FreeIcons,
  Copy01FreeIcons,
  Delete02FreeIcons,
  Download01FreeIcons,
  FloppyDiskFreeIcons,
  PlusSignFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/sign-3d";

import {
  emptyBoard3D,
  moveSignToIndex,
  SIGN_CATEGORIES,
  type Sign3D,
  type SignCategoryId,
  type Signs3DData,
} from "~/lib/signs-3d";
import {
  isDevWriteEnabled,
  listModelFiles,
  listSoundFiles,
  readBoard3D,
  writeBoard3D,
} from "~/lib/road-signs-3d-data.server";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { SelectRow, SliderRow } from "~/components/brand/setting-controls";
import { Sign3DViewer } from "~/components/brand/sign-3d-viewer";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "3D sign mapper · DriveRush Tools" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

const DATA_FILE_LABEL = "app/data/road-signs-3d.json";

// Radix Select forbids empty-string item values, so use a sentinel for "no audio".
const NO_AUDIO = "__none__";

export function loader(_: Route.LoaderArgs) {
  return {
    data: readBoard3D(),
    modelFiles: listModelFiles(),
    soundFiles: listSoundFiles(),
    canSave: isDevWriteEnabled(),
  };
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
  const saved = writeBoard3D(parsed);
  return { ok: true as const, savedAt: Date.now(), data: saved };
}

// ---------------------------------------------------------------------------

/** GLB stem (e.g. "P_27a") → a best-guess Highway Code ("P.27a") for new signs. */
function guessCode(modelSrc: string): string {
  const stem =
    modelSrc
      .split("/")
      .pop()
      ?.replace(/\.glb$/i, "") ?? "";
  return stem.replace("_", ".");
}

function fileLabel(src: string): string {
  return src.split("/").pop() ?? src;
}

export default function Sign3DTool({ loaderData }: Route.ComponentProps) {
  const { data: savedData, modelFiles, soundFiles, canSave } = loaderData;
  const saveFetcher = useFetcher<typeof action>();

  const [board, setBoard] = React.useState<Signs3DData>(
    savedData ?? emptyBoard3D(),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(
    savedData?.signs[0]?.id ?? null,
  );
  const [copied, setCopied] = React.useState(false);

  const savedJson = React.useMemo(() => JSON.stringify(savedData), [savedData]);
  const currentJson = React.useMemo(() => JSON.stringify(board), [board]);
  const dirty = currentJson !== savedJson;
  const saving = saveFetcher.state !== "idle";

  React.useEffect(() => {
    if (saveFetcher.data?.ok) toast.success(`Saved to ${DATA_FILE_LABEL}`);
  }, [saveFetcher.data]);

  const signs = React.useMemo(
    () => [...board.signs].sort((a, b) => a.index - b.index),
    [board.signs],
  );
  const mapped = React.useMemo(
    () => new Set(signs.map((s) => s.modelSrc)),
    [signs],
  );
  const unmapped = React.useMemo(
    () => modelFiles.filter((m) => !mapped.has(m)),
    [modelFiles, mapped],
  );
  const selected = signs.find((s) => s.id === selectedId) ?? null;

  // ---- mutations ----
  const setSigns = (next: Sign3D[]) => setBoard((b) => ({ ...b, signs: next }));

  const updateSign = (id: string, patch: Partial<Sign3D>) =>
    setSigns(signs.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const moveSign = (id: string, dir: -1 | 1) => {
    const cur = signs.findIndex((s) => s.id === id);
    if (cur < 0) return;
    setSigns(moveSignToIndex(signs, id, cur + dir));
  };

  const removeSign = (id: string) => {
    const next = signs
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, index: i }));
    setSigns(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const addUnmapped = (modelSrc: string) => {
    const stem = fileLabel(modelSrc).replace(/\.glb$/i, "");
    const id = `sign-3d-${stem.toLowerCase()}`;
    const sign: Sign3D = {
      id,
      name: "",
      category: "other",
      code: guessCode(modelSrc),
      modelSrc,
      index: signs.length,
    };
    setSigns([...signs, sign]);
    setSelectedId(id);
  };

  // ---- export ----
  const json = React.useMemo(() => JSON.stringify(board, null, 2), [board]);
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
    a.download = "road-signs-3d.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const saveToProject = () =>
    saveFetcher.submit({ data: json }, { method: "post" });

  const categoryOptions = SIGN_CATEGORIES.map((c) => ({
    value: c.id,
    label: `${c.emoji} ${c.label}`,
  }));
  const soundOptions = [
    { value: NO_AUDIO, label: "— No audio —" },
    ...soundFiles.map((s) => ({ value: s, label: fileLabel(s) })),
  ];

  return (
    <div>
      <header className="border-b-2 border-ink pb-6">
        <span className="eyebrow text-ink">Internal · authoring</span>
        <h1 className="m-0 mt-3 font-display text-[clamp(32px,5vw,52px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
          3D sign <span className="italic text-rush">mapper</span>
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-[clamp(16px,2vw,20px)] leading-tight text-ink-2">
          Preview each road-sign GLB, set its name / note / audio and tune the
          3D framing, then save to{" "}
          <code className="font-mono text-[0.85em]">{DATA_FILE_LABEL}</code> —
          the trainer's source of truth.
        </p>
      </header>

      {/* save / export bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-2 border-ink bg-surface p-3 shadow-stamp">
        <Button
          variant="ink"
          size="sm"
          disabled={!canSave || !dirty || saving}
          onClick={saveToProject}
        >
          <HugeiconsIcon
            icon={FloppyDiskFreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          {saving ? "Saving…" : "Save to project"}
        </Button>
        <Button variant="paper" size="sm" onClick={copyJson}>
          <HugeiconsIcon icon={Copy01FreeIcons} size={14} strokeWidth={2.5} />
          {copied ? "Copied!" : "Copy JSON"}
        </Button>
        <Button variant="paper" size="sm" onClick={downloadJson}>
          <HugeiconsIcon
            icon={Download01FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          Download
        </Button>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {signs.length} mapped
          {unmapped.length > 0 ? ` · ${unmapped.length} unmapped` : ""}
          {dirty ? " · unsaved" : ""}
        </span>
      </div>
      {!canSave && (
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Save-to-project is dev-only — use Copy / Download in production.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ---- sign list ---- */}
        <aside className="space-y-4">
          <div className="border-2 border-ink bg-surface">
            <div className="border-b-2 border-ink bg-paper-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-2">
              Signs · {signs.length}
            </div>
            <ul className="m-0 max-h-[60vh] list-none overflow-auto p-0">
              {signs.map((s, i) => (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 border-b border-dashed border-ink/40 px-2 py-1.5",
                    selectedId === s.id && "bg-paper-3",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className="min-w-0 flex-1 text-left outline-none"
                  >
                    <span className="block truncate font-display text-[12px] font-bold uppercase tracking-wide text-ink">
                      {s.name || "(unnamed)"}
                    </span>
                    <span className="block truncate font-mono text-[9.5px] uppercase tracking-widest text-ink-3">
                      {s.code ?? "—"} · {fileLabel(s.modelSrc)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => moveSign(s.id, -1)}
                    className="text-ink-3 outline-none hover:text-ink disabled:opacity-30"
                  >
                    <HugeiconsIcon
                      icon={ArrowUp01FreeIcons}
                      size={14}
                      strokeWidth={2.5}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === signs.length - 1}
                    onClick={() => moveSign(s.id, 1)}
                    className="text-ink-3 outline-none hover:text-ink disabled:opacity-30"
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01FreeIcons}
                      size={14}
                      strokeWidth={2.5}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {unmapped.length > 0 && (
            <div className="border-2 border-dashed border-ink bg-surface">
              <div className="border-b-2 border-dashed border-ink bg-paper-3 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-2">
                Unmapped GLBs · {unmapped.length}
              </div>
              <ul className="m-0 list-none p-0">
                {unmapped.map((m) => (
                  <li
                    key={m}
                    className="flex items-center gap-2 border-b border-dashed border-ink/40 px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-widest text-ink-3">
                      {fileLabel(m)}
                    </span>
                    <Button
                      variant="paper"
                      size="sm"
                      onClick={() => addUnmapped(m)}
                    >
                      <HugeiconsIcon
                        icon={PlusSignFreeIcons}
                        size={13}
                        strokeWidth={2.5}
                      />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* ---- editor ---- */}
        <section>
          {!selected ? (
            <div className="flex min-h-72 items-center justify-center border-2 border-dashed border-ink bg-paper-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Select a sign to edit
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {/* preview + framing */}
              <div className="space-y-3">
                <div className="relative aspect-square w-full overflow-hidden border-2 border-ink bg-ink">
                  <Sign3DViewer
                    modelSrc={selected.modelSrc}
                    yaw={selected.yaw}
                    pitch={selected.pitch}
                    zoom={selected.zoom}
                    autoRotate={false}
                    interactive
                    onDark
                    loaderLabel="Loading model"
                    className="absolute inset-0"
                  />
                </div>
                <SliderRow
                  label="Yaw (turn)"
                  value={selected.yaw ?? 0}
                  min={-180}
                  max={180}
                  step={5}
                  unit="°"
                  onValueChange={(n) => updateSign(selected.id, { yaw: n })}
                />
                <SliderRow
                  label="Pitch (tilt)"
                  value={selected.pitch ?? 0}
                  min={-45}
                  max={45}
                  step={5}
                  unit="°"
                  onValueChange={(n) => updateSign(selected.id, { pitch: n })}
                />
                <SliderRow
                  label="Zoom"
                  value={selected.zoom ?? 1}
                  min={0.5}
                  max={2}
                  step={0.05}
                  format={(v) => `${v.toFixed(2)}×`}
                  onValueChange={(n) => updateSign(selected.id, { zoom: n })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSign(selected.id)}
                >
                  <HugeiconsIcon
                    icon={Delete02FreeIcons}
                    size={14}
                    strokeWidth={2.5}
                  />
                  Remove from board
                </Button>
              </div>

              {/* metadata */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={selected.name}
                    onChange={(e) =>
                      updateSign(selected.id, { name: e.target.value })
                    }
                    placeholder="e.g. No entry"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input
                    value={selected.code ?? ""}
                    onChange={(e) =>
                      updateSign(selected.id, { code: e.target.value })
                    }
                    placeholder="e.g. P.1"
                  />
                </div>
                <SelectRow<SignCategoryId>
                  label="Category"
                  value={selected.category}
                  options={categoryOptions}
                  onValueChange={(v) =>
                    updateSign(selected.id, { category: v })
                  }
                />
                <SelectRow
                  label="Audio clip"
                  value={selected.audioSrc ?? NO_AUDIO}
                  options={soundOptions}
                  onValueChange={(v) =>
                    updateSign(selected.id, {
                      audioSrc: v === NO_AUDIO ? undefined : v,
                    })
                  }
                />
                <div className="space-y-1.5">
                  <Label>Note</Label>
                  <Textarea
                    rows={5}
                    value={selected.note ?? ""}
                    onChange={(e) =>
                      updateSign(selected.id, { note: e.target.value })
                    }
                    placeholder="What the driver should do…"
                  />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  {fileLabel(selected.modelSrc)}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
