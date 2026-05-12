import * as React from "react";
import {
  FocusPointFreeIcons,
  ShuffleFreeIcons,
  Tick02FreeIcons,
  TrafficLightFreeIcons,
  VolumeHighFreeIcons,
} from "@hugeicons/core-free-icons";

import {
  SIGN_CATEGORIES,
  type SignCategory,
  type SignCategoryId,
} from "~/lib/image-focus";
import { masteredCount } from "~/lib/pelican-progress";
import { usePelicanStore } from "~/lib/pelican-store";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  ChipToggle,
  SelectRow,
  SettingSection,
  SliderRow,
  ToggleRow,
} from "~/components/brand/setting-controls";

/** The trainer's right-side settings sheet — entirely driven by the Zustand store. */
export function PelicanSettingsSheet() {
  const settings = usePelicanStore((s) => s.settings);
  const progress = usePelicanStore((s) => s.progress);
  const board = usePelicanStore((s) => s.board);
  const open = usePelicanStore((s) => s.settingsOpen);
  const setOpen = usePelicanStore((s) => s.setSettingsOpen);
  const setSetting = usePelicanStore((s) => s.setSetting);
  const resetSettings = usePelicanStore((s) => s.resetSettings);
  const resetProgress = usePelicanStore((s) => s.resetProgress);

  const regions = board?.regions ?? [];
  const shuffled = settings.order === "shuffle";

  const countByCat = React.useMemo(() => {
    const m = new Map<SignCategoryId, number>();
    for (const r of regions) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return m;
  }, [regions]);

  const visibleCats: SignCategory[] = React.useMemo(
    () =>
      SIGN_CATEGORIES.filter(
        (c) => c.id !== "other" || (countByCat.get("other") ?? 0) > 0,
      ),
    [countByCat],
  );
  const universeIds = React.useMemo(
    () => visibleCats.map((c) => c.id),
    [visibleCats],
  );

  const allSelected = settings.categories.length === 0;
  const isCatActive = (id: SignCategoryId) =>
    allSelected || settings.categories.includes(id);

  const toggleCat = (id: SignCategoryId) => {
    const current = allSelected ? universeIds : settings.categories;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    if (next.length === 0) return; // never zero
    setSetting({ categories: next.length === universeIds.length ? [] : next });
  };

  const practiceCount = allSelected
    ? regions.length
    : regions.filter((r) => settings.categories.includes(r.category)).length;
  const mastered = masteredCount(
    progress,
    regions.map((r) => r.id),
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full max-w-md p-0">
        <SheetHeader>
          <SheetTitle>Trainer settings</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4 p-4">
          {/* ---- What to practise ---- */}
          <SettingSection
            title="What to practise"
            description={`${practiceCount} of ${regions.length} sign${regions.length === 1 ? "" : "s"}`}
            icon={TrafficLightFreeIcons}
            action={
              <ChipToggle
                active={allSelected}
                onToggle={() => setSetting({ categories: [] })}
              >
                All
              </ChipToggle>
            }
          >
            {regions.length === 0 ? (
              <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                No signs on the board yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleCats.map((c) => {
                  const mappedN = countByCat.get(c.id) ?? 0;
                  return (
                    <ChipToggle
                      key={c.id}
                      active={isCatActive(c.id)}
                      onToggle={() => toggleCat(c.id)}
                    >
                      {c.emoji} {c.label}
                      {c.count > 0
                        ? ` · ${mappedN}/${c.count}`
                        : ` · ${mappedN}`}
                    </ChipToggle>
                  );
                })}
              </div>
            )}
          </SettingSection>

          {/* ---- Order ---- */}
          <SettingSection title="Order" icon={ShuffleFreeIcons}>
            <SelectRow
              label="Sign order"
              value={settings.order}
              options={[
                { value: "sequential", label: "Sequential — board order" },
                { value: "shuffle", label: "Shuffled — random each run" },
              ]}
              onValueChange={(v) => setSetting({ order: v })}
            />
            <ToggleRow
              label="Loop"
              description="When you reach the end, start over from the top"
              checked={settings.loop}
              onCheckedChange={(b) => setSetting({ loop: b })}
            />
            <ToggleRow
              label="Reverse"
              description={
                shuffled ? "Off while shuffled" : "Play the list last → first"
              }
              checked={settings.reverse}
              onCheckedChange={(b) => setSetting({ reverse: b })}
              disabled={shuffled}
            />
          </SettingSection>

          {/* ---- Reveal ---- */}
          <SettingSection title="Reveal" icon={FocusPointFreeIcons}>
            <SelectRow
              label="Reveal mode"
              value={settings.revealMode}
              options={[
                { value: "auto", label: "Auto — reveal after a timer" },
                { value: "manual", label: "Manual — tap to reveal" },
              ]}
              onValueChange={(v) => setSetting({ revealMode: v })}
            />
            {settings.revealMode === "auto" && (
              <SliderRow
                label="Reveal after"
                value={settings.revealDelay}
                min={1}
                max={10}
                step={0.5}
                unit="s"
                onValueChange={(n) => setSetting({ revealDelay: n })}
              />
            )}
            <ToggleRow
              label="Auto-advance"
              description={
                settings.selfGrading
                  ? "Off while self-grading — you advance with a Knew it / Missed it tap"
                  : "Move to the next sign after the answer shows"
              }
              checked={settings.autoAdvance && !settings.selfGrading}
              onCheckedChange={(b) => setSetting({ autoAdvance: b })}
              disabled={settings.selfGrading}
            />
            {settings.autoAdvance && !settings.selfGrading && (
              <SliderRow
                label="Advance after"
                value={settings.autoAdvanceDelay}
                min={1}
                max={10}
                step={1}
                unit="s"
                onValueChange={(n) => setSetting({ autoAdvanceDelay: n })}
              />
            )}
          </SettingSection>

          {/* ---- Self-grading ---- */}
          <SettingSection title="Self-grading" icon={Tick02FreeIcons}>
            <ToggleRow
              label="Track what you know"
              description="After each sign, mark whether you knew it"
              checked={settings.selfGrading}
              onCheckedChange={(b) => setSetting({ selfGrading: b })}
            />
            <p className="text-[11.5px] leading-snug text-ink-2">
              When on, each answer shows <strong>Knew it</strong> /{" "}
              <strong>Missed it</strong>. Missed signs come back within a few
              cards; get one right 3 times and it's <strong>mastered</strong>.
              Progress is saved on this device only.
            </p>
            <div className="flex items-center justify-between gap-3 border-2 border-ink bg-paper-3 px-3 py-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-2">
                Mastered {mastered} / {regions.length}
              </span>
              <Button
                variant="paper"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset your mastery progress for every sign?",
                    )
                  )
                    resetProgress();
                }}
              >
                Reset progress
              </Button>
            </div>
          </SettingSection>

          {/* ---- Audio & visuals ---- */}
          <SettingSection title="Audio & visuals" icon={VolumeHighFreeIcons}>
            <ToggleRow
              label="Play sound"
              description="Camera whoosh, reveal chime, and a sign's audio (if it has one)"
              checked={settings.playAudio}
              onCheckedChange={(b) => setSetting({ playAudio: b })}
            />
            <SliderRow
              label="Blur"
              value={settings.blurIntensity}
              min={0}
              max={20}
              step={1}
              unit="px"
              onValueChange={(n) => setSetting({ blurIntensity: n })}
            />
            <SliderRow
              label="Dim"
              value={settings.dimIntensity}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onValueChange={(n) => setSetting({ dimIntensity: n })}
            />
          </SettingSection>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                window.confirm("Reset all trainer settings to their defaults?")
              )
                resetSettings();
            }}
          >
            Reset all settings
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
