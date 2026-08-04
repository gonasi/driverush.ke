/**
 * Shown when the lesson-player mounts on a locked lesson. Two paths out:
 *  - Back to the learning path
 *  - Take a placement test on prior content; pass = unlock everything before
 *    this lesson and continue.
 *
 * Rendered full-screen so it owns the entire viewport like the player does.
 */
import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  LockFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Lesson } from "~/lib/course-types";

import { Button } from "~/components/ui/button";
import { PlacementTest } from "./placement-test";

export function LockedPanel({
  courseSlug,
  chapterSlug,
  lesson,
}: {
  courseSlug: string;
  chapterSlug: string;
  lesson: Lesson;
}) {
  const [mode, setMode] = React.useState<"intro" | "test">("intro");

  if (mode === "test") {
    return (
      <PlacementTest
        courseSlug={courseSlug}
        chapterSlug={chapterSlug}
        targetLesson={lesson}
        onCancel={() => setMode("intro")}
      />
    );
  }

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-9 sm:py-24">
        <Link
          to={`/courses/${courseSlug}`}
          className="mb-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
        >
          <HugeiconsIcon
            icon={ArrowLeft02FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          Back to path
        </Link>
        <div className="grid gap-6 border-2 border-ink bg-surface p-7 shadow-stamp sm:p-10">
          <span className="inline-flex size-14 items-center justify-center border-2 border-ink bg-paper-3 text-ink-2">
            <HugeiconsIcon icon={LockFreeIcons} size={26} strokeWidth={2.25} />
          </span>
          <div>
            <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Locked lesson
            </p>
            <h1 className="m-0 mt-2 font-display text-[clamp(28px,5vw,44px)] font-extrabold uppercase leading-[0.95] tracking-tight">
              {lesson.title}
            </h1>
          </div>
          <p className="m-0 max-w-lg font-serif text-[16px] leading-snug text-ink-2">
            Finish the previous lessons first, or prove you already know them
            with a quick placement test. A pass unlocks every earlier lesson so
            you can pick up right here.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button variant="rush" size="lg" onClick={() => setMode("test")}>
              Take placement test
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to={`/courses/${courseSlug}`}>Back to path</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
