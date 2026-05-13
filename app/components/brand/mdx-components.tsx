/**
 * Shared MDX component mapping. The MDX provider import source is configured
 * in `vite.config.ts`; every `.mdx` module imports `useMDXComponents` from
 * here at compile time, so any element a post uses without a JSX tag (plain
 * markdown `h1`, `p`, `a`, etc.) flows through these brand-aligned renderers.
 *
 * Blog posts can still import and place brand components inline — this only
 * styles the markdown shapes.
 */
import * as React from "react";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

type AnchorProps = React.ComponentProps<"a">;

/** Internal links go through React Router so SPA transitions are kept. */
function MdxLink({ href, className, children, ...rest }: AnchorProps) {
  const isInternal = href?.startsWith("/") || href?.startsWith("#");
  const classes = cn(
    "font-semibold text-rush underline-offset-[3px] decoration-rush/40 hover:decoration-rush hover:underline focus-visible:underline",
    className,
  );

  if (isInternal && href) {
    return (
      <Link to={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={classes}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  );
}

const components = {
  h1: (props: React.ComponentProps<"h1">) => (
    <h1
      {...props}
      className={cn(
        "m-0 mb-6 font-display text-[clamp(36px,6vw,64px)] font-extrabold uppercase leading-[0.92] tracking-tight text-ink",
        "[&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush",
        props.className,
      )}
    />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2
      {...props}
      className={cn(
        "mt-14 mb-4 border-b-2 border-ink pb-3 font-display text-[clamp(24px,3.4vw,36px)] font-extrabold uppercase leading-[1.02] tracking-tight text-ink",
        "[&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush",
        props.className,
      )}
    />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3
      {...props}
      className={cn(
        "mt-10 mb-3 font-display text-xl font-extrabold uppercase tracking-tight text-ink",
        "[&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush",
        props.className,
      )}
    />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p
      {...props}
      className={cn(
        "my-4 font-serif text-[17px] leading-relaxed text-ink-2",
        "[&_em]:not-italic [&_em]:italic [&_em]:text-rush",
        props.className,
      )}
    />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul
      {...props}
      className={cn(
        "my-5 list-none space-y-2 border-l-2 border-dashed border-ink pl-5 font-serif text-[17px] leading-relaxed text-ink-2",
        "[&_li]:relative [&_li]:pl-5",
        "[&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.7em] [&_li]:before:size-2 [&_li]:before:bg-rush",
        props.className,
      )}
    />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      {...props}
      className={cn(
        "my-5 list-decimal space-y-2 pl-7 font-serif text-[17px] leading-relaxed text-ink-2 marker:font-display marker:font-extrabold marker:text-rush",
        props.className,
      )}
    />
  ),
  li: (props: React.ComponentProps<"li">) => <li {...props} />,
  a: MdxLink,
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      {...props}
      className={cn(
        "my-7 border-l-4 border-rush bg-paper-2 px-5 py-4 font-serif text-[19px] italic leading-snug text-ink",
        "[&_p]:m-0 [&_p]:font-serif [&_p]:italic [&_p]:text-ink",
        props.className,
      )}
    />
  ),
  hr: (props: React.ComponentProps<"hr">) => (
    <hr
      {...props}
      className={cn(
        "my-12 h-0 border-0 border-t-2 border-dashed border-ink",
        props.className,
      )}
    />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      {...props}
      className={cn(
        "rounded-none border border-ink bg-paper-2 px-1.5 py-0.5 font-mono text-[13px] text-ink",
        props.className,
      )}
    />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      {...props}
      className={cn(
        "my-6 overflow-x-auto border-2 border-ink bg-paper-2 p-4 font-mono text-[13px] leading-relaxed text-ink",
        props.className,
      )}
    />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong {...props} className={cn("font-bold text-ink", props.className)} />
  ),
} as const;

/**
 * MDX provider import source hook. The MDX runtime calls this for every
 * compiled `.mdx` module; merging caller-supplied components lets a single
 * post override one element if it ever needs to.
 */
export function useMDXComponents(extra: Record<string, unknown> = {}) {
  return { ...components, ...extra };
}
