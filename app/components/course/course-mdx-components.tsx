/**
 * MDX components for course `rich_text` block bodies. Passed to the compiled
 * MDX via the runtime `components` prop (the provider's `useMDXComponents`
 * merges them on top of the global markdown styling) — so course `.mdx` can use
 * `<Callout type=…>`, `<Rule>`, `<Mnemonic>`, `<MediaHint>`, `<Term>` without
 * imports, and the blog provider is untouched.
 *
 * The spec's `<Callout type=…>` differs from the brand `Callout` (which takes an
 * `icon`); this wraps it, mapping the `type` to an icon + label.
 */
import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert02FreeIcons,
  Image02FreeIcons,
  InformationCircleFreeIcons,
  OctagonFreeIcons,
  PlayCircleFreeIcons,
  RoadFreeIcons,
  StarFreeIcons,
} from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";
import { Callout as BrandCallout } from "~/components/brand/callout";

type CalloutType = "tip" | "warning" | "rule" | "analogy";

const CALLOUT_ICON: Record<CalloutType, IconSvgElement> = {
  tip: StarFreeIcons,
  warning: Alert02FreeIcons,
  rule: OctagonFreeIcons,
  analogy: RoadFreeIcons,
};

const CALLOUT_LABEL: Record<CalloutType, string> = {
  tip: "Exam tip",
  warning: "Warning",
  rule: "Rule",
  analogy: "Analogy",
};

/** Spec-shaped callout: `<Callout type="tip|warning|rule|analogy">`. */
function Callout({
  type = "tip",
  children,
  ...rest
}: React.ComponentProps<typeof BrandCallout> & { type?: CalloutType }) {
  return (
    <BrandCallout
      className="my-6"
      icon={CALLOUT_ICON[type] ?? InformationCircleFreeIcons}
      iconLabel={CALLOUT_LABEL[type] ?? "Note"}
      {...rest}
    >
      {children}
    </BrandCallout>
  );
}

/** The one thing the learner must remember from a block — a hard ink-headed rule. */
function Rule({ children }: { children?: React.ReactNode }) {
  return (
    <div className="my-6 border-2 border-ink bg-surface shadow-stamp-sm">
      <div className="flex items-center gap-2 border-b-2 border-ink bg-ink px-4 py-2 text-paper">
        <HugeiconsIcon icon={OctagonFreeIcons} size={15} strokeWidth={2.5} />
        <span className="font-mono text-[11px] uppercase tracking-widest">
          The rule
        </span>
      </div>
      <p className="m-0 px-4 py-3.5 font-serif text-[17px] leading-snug text-ink">
        {children}
      </p>
    </div>
  );
}

/** Memory hook / mnemonic — newlines preserved so each line reads as a line. */
function Mnemonic({ children }: { children?: React.ReactNode }) {
  return (
    <div className="my-6 border-2 border-dashed border-ink bg-paper-2 px-5 py-4">
      <div className="mb-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3">
        <HugeiconsIcon icon={StarFreeIcons} size={14} strokeWidth={2.5} />
        Remember
      </div>
      <p className="m-0 whitespace-pre-line font-mono text-[13.5px] leading-relaxed text-ink">
        {children}
      </p>
    </div>
  );
}

const MEDIA_ICON: Record<string, IconSvgElement> = {
  diagram: Image02FreeIcons,
  lottie: PlayCircleFreeIcons,
  photo: Image02FreeIcons,
};

/**
 * Placeholder for a not-yet-produced media asset. Renders the alt text in a
 * dashed panel so a rich_text body is never broken by missing art; swap for the
 * real renderer when assets land.
 */
function MediaHint({
  type = "diagram",
  alt,
  caption,
}: {
  type?: "diagram" | "lottie" | "photo";
  id?: string;
  alt: string;
  caption?: string;
  placement?: string;
}) {
  return (
    <figure className="my-6 grid gap-2 border-2 border-dashed border-ink bg-paper-3 p-4">
      <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <HugeiconsIcon
          icon={MEDIA_ICON[type] ?? Image02FreeIcons}
          size={14}
          strokeWidth={2.5}
        />
        {type} · placeholder
      </div>
      <div className="flex min-h-24 items-center justify-center border border-line-soft bg-surface px-4 py-6 text-center font-serif text-[14px] italic leading-snug text-ink-2">
        {alt}
      </div>
      {caption && (
        <figcaption className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Inline key-term highlight (definition tooltip is a future enhancement). */
function Term({
  children,
  className,
}: {
  id?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-semibold text-rush underline decoration-dotted decoration-rush/50 underline-offset-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Merge-in map passed to `<Body components={courseMdxComponents} />`. */
export const courseMdxComponents = {
  Callout,
  Rule,
  Mnemonic,
  MediaHint,
  Term,
} as const;

export { Callout, Rule, Mnemonic, MediaHint, Term };
