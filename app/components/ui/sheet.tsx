import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01FreeIcons } from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-ink/60 backdrop-blur-[1px]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  [
    "fixed z-50 flex flex-col gap-0 border-2 border-ink bg-surface text-foreground shadow-stamp-xl",
    "data-[state=open]:animate-in data-[state=closed]:animate-out duration-200",
  ].join(" "),
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto max-h-[80vh] data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        bottom:
          "inset-x-0 bottom-0 h-auto max-h-[80vh] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        left: "inset-y-0 left-0 w-3/4 max-w-sm data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        right:
          "inset-y-0 right-0 w-3/4 max-w-sm data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
      },
    },
    defaultVariants: { side: "right" },
  },
);

type SheetContentProps = React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean;
  };

function SheetContent({
  className,
  side,
  children,
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              "absolute right-3 top-3 inline-flex size-8 items-center justify-center",
              "border-2 border-ink bg-surface text-ink outline-none",
              "transition-colors duration-100 hover:bg-ink hover:text-paper",
              "focus-visible:bg-ink focus-visible:text-paper",
            )}
          >
            <HugeiconsIcon
              icon={Cancel01FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex items-center justify-between border-b-2 border-ink bg-ink px-4 py-3 font-mono text-[10.5px] font-bold uppercase tracking-widest text-paper",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-display text-base font-extrabold uppercase tracking-wide text-paper",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-[13px] leading-relaxed text-ink-3", className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto p-5", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex items-center justify-end gap-2.5 border-t-2 border-dashed border-ink p-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
};
