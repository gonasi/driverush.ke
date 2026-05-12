import * as React from "react";

import { cn } from "~/lib/utils";

type PricingFeature = {
  label: React.ReactNode;
  /** Crossed-out — not included in this tier. */
  off?: boolean;
};

type PricingTierProps = React.ComponentProps<"div"> & {
  /** Tier name, e.g. "PASS". */
  name: React.ReactNode;
  /** One-liner under the name. */
  description?: React.ReactNode;
  /** Currency code shown small, e.g. "KES". */
  currency?: React.ReactNode;
  /** Big price, e.g. "499" or "0". */
  price: React.ReactNode;
  /** Billing cadence, e.g. "PER MONTH". */
  per?: React.ReactNode;
  /** Highlight this tier — ink card, italic rush price. */
  featured?: boolean;
  /** Corner ribbon, e.g. "★ POPULAR". */
  ribbon?: React.ReactNode;
  features: PricingFeature[];
  /** Footer CTA — typically a <Button>; rendered full-width and centred. */
  cta?: React.ReactNode;
};

/** Pricing-tier card — stamped, ledger-ruled feature list, optional ★ ribbon. */
function PricingTier({
  className,
  name,
  description,
  currency,
  price,
  per,
  featured,
  ribbon,
  features,
  cta,
  ...props
}: PricingTierProps) {
  const rule = featured ? "border-paper" : "border-ink";
  return (
    <div
      data-slot="pricing-tier"
      data-featured={featured || undefined}
      className={cn(
        "flex flex-col border-2 border-ink bg-surface",
        featured && "bg-ink text-paper",
        className,
      )}
      {...props}
    >
      <header className={cn("relative border-b-2 p-[18px]", rule)}>
        <div className="font-display text-base font-extrabold uppercase tracking-[0.04em]">
          {name}
        </div>
        {description != null && (
          <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {description}
          </div>
        )}
        {ribbon != null && (
          <span className="absolute -right-0.5 -top-0.5 border-2 border-ink bg-rush px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white">
            {ribbon}
          </span>
        )}
      </header>

      <div className={cn("border-b-2 px-[18px] py-6 text-center", rule)}>
        <div>
          {currency != null && (
            <span className="mr-1 align-super font-mono text-sm font-bold">
              {currency}
            </span>
          )}
          <span
            className={cn(
              "font-display text-[56px] font-extrabold leading-none tracking-[-0.04em] tabular-nums",
              featured && "italic text-rush",
            )}
          >
            {price}
          </span>
        </div>
        {per != null && (
          <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {per}
          </div>
        )}
      </div>

      <ul className="m-0 flex-1 list-none px-[18px] py-4">
        {features.map((f, i) => (
          <li
            key={i}
            className={cn(
              "grid grid-cols-[18px_1fr] items-baseline gap-2 border-b border-dashed py-[7px] text-[13px] last:border-b-0",
              featured
                ? "border-ink-3"
                : "border-line-soft dark:border-paper-2",
              f.off && "text-ink-4 line-through",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "font-display font-extrabold",
                f.off ? "text-ink-4" : "text-rush",
              )}
            >
              {f.off ? "✕" : "→"}
            </span>
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      {cta != null && (
        <footer
          className={cn(
            "border-t-2 p-4 [&>*]:w-full [&>*]:justify-center",
            rule,
          )}
        >
          {cta}
        </footer>
      )}
    </div>
  );
}

export { PricingTier };
export type { PricingFeature };
