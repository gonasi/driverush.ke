import * as React from "react";
import {
  FocusPointFreeIcons,
  RotateClockwiseFreeIcons,
  ShuffleFreeIcons,
  Tick02FreeIcons,
  TrafficLightFreeIcons,
  VolumeHighFreeIcons,
} from "@hugeicons/core-free-icons";

import {
  SIGN_CATEGORIES,
  type SignCategory,
  type SignCategoryId,
} from "~/lib/signs-3d";
import { masteredCount } from "~/lib/pelican-progress";
import { useSigns3DStore } from "~/lib/signs-3d-store";

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

/** The 3D trainer's right-side settings sheet — driven by the Zustand store. */
export function Sign3DSettingsSheet() {
  const settings = useSigns3DStore((s) => s.settings);
  const progress = useSigns3DStore((s) => s.progress);
  const board = useSigns3DStore((s) => s.board);
  const open = useSigns3DStore((s) => s.settingsOpen);
  const setOpen = useSigns3DStore((s) => s.setSettingsOpen);
  const setSetting = useSigns3DStore((s) => s.setSetting);
  const resetSettings = useSigns3DStore((s) => s.resetSettings);
  const resetProgress = useSigns3DStore((s) => s.resetProgress);

  const signs = board?.signs ?? [];
  const shuffled = settings.order === "shuffle";

  const countByCat = React.useMemo(() => {
    const m = new Map<SignCategoryId, number>();
    for (const r of signs) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return m;
  }, [signs]);

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
    ? signs.length
    : signs.filter((r) => settings.categories.includes(r.category)).length;
  const mastered = masteredCount(
    progress,
    signs.map((r) => r.id),
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
            description={`${practiceCount} of ${signs.length} sign${signs.length === 1 ? "" : "s"}`}
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
            {signs.length === 0 ? (
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
                      {` · ${mappedN}`}
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
                { value: "sequential", label: "Sequential · board order" },
                { value: "shuffle", label: "Shuffled · random each run" },
              ]}
              onValueChange={(v) => setSetting({ order: v })}
            />
            <ToggleRow
              label="Reverse"
              description={
                shuffled ? "Off while shuffled" : "Play the list last to first"
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
                { value: "auto", label: "Auto · reveal after a timer" },
                { value: "manual", label: "Manual · tap to reveal" },
              ]}
              onValueChange={(v) => setSetting({ revealMode: v })}
            />
            {settings.revealMode === "auto" && (
              <SliderRow
                label="Reveal after"
                value={settings.revealDelay}
                min={1}
                max={12}
                step={0.5}
                unit="s"
                onValueChange={(n) => setSetting({ revealDelay: n })}
              />
            )}
            <ToggleRow
              label="Auto-advance"
              description={
                settings.selfGrading
                  ? "Not used while self-grading: a Knew it / Missed it tap moves you on"
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
              <strong>Missed it</strong>. Missed signs come back later in the
              run, so a run only ends once you've recalled every sign. Recall a
              sign cleanly a couple of times and it counts as{" "}
              <strong>mastered</strong>. Tracked separately from the Pelican
              trainer, on this device only.
            </p>
            <div className="flex items-center justify-between gap-3 border-2 border-ink bg-paper-3 px-3 py-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-2">
                Known {mastered} / {signs.length}
              </span>
              <Button
                variant="paper"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm("Reset your mastery meter for every sign?")
                  )
                    resetProgress();
                }}
              >
                Reset mastery
              </Button>
            </div>
          </SettingSection>

          {/* ---- Audio & motion ---- */}
          <SettingSection title="Audio & motion" icon={VolumeHighFreeIcons}>
            <ToggleRow
              label="Play sound"
              description="Whoosh, reveal chime, and a sign's spoken name (if it has one)"
              checked={settings.playAudio}
              onCheckedChange={(b) => setSetting({ playAudio: b })}
            />
            <ToggleRow
              label="Auto-spin"
              icon={RotateClockwiseFreeIcons}
              description="Slowly turntable the sign while you study it (off if your device prefers reduced motion)"
              checked={settings.autoRotate}
              onCheckedChange={(b) => setSetting({ autoRotate: b })}
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
