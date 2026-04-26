import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      // Project default: ink panel, paper text, rush stamp shadow. Per-toast
      // overrides still work via the `style`/`className` props on toast().
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "grid w-full max-w-[420px] grid-cols-[auto_1fr_auto] items-center gap-3",
            "border-2 border-ink bg-ink px-3.5 py-3 text-paper",
            "shadow-stamp-rush",
          ].join(" "),
          icon: [
            "flex size-8 items-center justify-center border-2 border-paper bg-rush text-white",
            "font-display text-sm font-extrabold",
          ].join(" "),
          title: [
            "font-display text-[13px] font-bold uppercase tracking-wide text-paper",
          ].join(" "),
          description: "text-[12px] text-paper/80",
          actionButton: [
            "ml-auto bg-transparent font-mono text-[11px] font-bold uppercase tracking-wider text-paper",
            "hover:underline focus-visible:underline outline-none cursor-pointer",
          ].join(" "),
          cancelButton: [
            "bg-transparent font-mono text-[11px] font-bold uppercase tracking-wider text-paper/70",
            "hover:text-paper focus-visible:text-paper outline-none cursor-pointer",
          ].join(" "),
          closeButton: [
            "border-2 border-paper bg-transparent text-paper",
            "hover:bg-paper hover:text-ink",
          ].join(" "),
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
