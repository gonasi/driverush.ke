import * as React from "react";

import { cn } from "~/lib/utils";

type CodeBlockProps = React.ComponentProps<"div"> & {
  /** Left side of the chrome bar, e.g. "tokens.css". */
  filename?: React.ReactNode;
  /** Right side of the chrome bar, e.g. "· v 2.0". */
  meta?: React.ReactNode;
  /**
   * The code, as pre-formatted text/JSX. Use {@link CodeKey},
   * {@link CodeValue} and {@link CodeComment} for syntax tinting.
   */
  children: React.ReactNode;
};

/** Spec / code block — ink panel with a paper chrome bar and tinted spans. */
function CodeBlock({
  className,
  filename,
  meta,
  children,
  ...props
}: CodeBlockProps) {
  return (
    <div
      data-slot="code-block"
      className={cn(
        "border-2 border-ink bg-ink font-mono text-xs text-paper",
        className,
      )}
      {...props}
    >
      {(filename != null || meta != null) && (
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper-3 px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-widest text-ink">
          <span>{filename}</span>
          <span>{meta}</span>
        </div>
      )}
      <pre className="overflow-x-auto whitespace-pre p-3.5 leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

/** Property / identifier — amber. */
function CodeKey(props: React.ComponentProps<"span">) {
  return <span className="text-amber" {...props} />;
}
/** Literal / value — cyan. */
function CodeValue(props: React.ComponentProps<"span">) {
  return <span className="text-route-cyan" {...props} />;
}
/** Comment — muted italic. */
function CodeComment(props: React.ComponentProps<"span">) {
  return <span className="italic text-ink-4" {...props} />;
}

export { CodeBlock, CodeKey, CodeValue, CodeComment };
