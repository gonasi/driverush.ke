import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpCircleFreeIcons } from "@hugeicons/core-free-icons";

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { useCourseUiStore } from "~/lib/course-ui-store";

/**
 * The "Why?" bottom sheet — a single instance lives in the player. Any block
 * renderer opens it via `useCourseUiStore().openWhy({ title, body })` after an
 * answer; it slides up from the bottom (Gonasi-style) with the reasons.
 */
export function WhySheet() {
  const why = useCourseUiStore((s) => s.why);
  const closeWhy = useCourseUiStore((s) => s.closeWhy);

  return (
    <Sheet
      open={why != null}
      onOpenChange={(open) => {
        if (!open) closeWhy();
      }}
    >
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>{why?.title ?? "Why?"}</SheetTitle>
        </SheetHeader>
        <SheetDescription className="sr-only">
          Explanation and reasons for this question.
        </SheetDescription>
        <SheetBody>{why?.body}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/** Opens the Why sheet with the given reasons. Used in answer feedback. */
export function WhyButton({
  body,
  title = "Why?",
}: {
  body: ReactNode;
  title?: string;
}) {
  const openWhy = useCourseUiStore((s) => s.openWhy);
  return (
    <Button variant="paper" size="sm" onClick={() => openWhy({ title, body })}>
      <HugeiconsIcon icon={HelpCircleFreeIcons} size={14} strokeWidth={2.5} />
      Why?
    </Button>
  );
}
