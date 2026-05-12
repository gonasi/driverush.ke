import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  const { showCloseButton = true, ...rest } = props as typeof props & {
    showCloseButton?: boolean;
  };
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "border-2 border-ink bg-surface text-foreground shadow-stamp-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=open]:slide-in-from-top-1 data-[state=closed]:slide-out-to-top-1",
          className,
        )}
        {...rest}
      >
        <DialogTitleBar showClose={showCloseButton} />
        <div className="contents">{children}</div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogTitleBar({ showClose }: { showClose: boolean }) {
  return (
    <div
      data-slot="dialog-titlebar"
      className="flex items-center justify-between gap-3 bg-ink px-4 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-paper"
    >
      <span>DR · DIALOG</span>
      {showClose && (
        <DialogPrimitive.Close
          aria-label="Close dialog"
          className={cn(
            "-my-1 inline-flex size-6 shrink-0 items-center justify-center",
            "border-2 border-paper text-paper outline-none",
            "transition-colors duration-100",
            "hover:bg-paper hover:text-ink",
            "focus-visible:bg-paper focus-visible:text-ink",
          )}
        >
          <HugeiconsIcon
            icon={Cancel01FreeIcons}
            size={13}
            strokeWidth={2.75}
          />
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 px-6 pt-6", className)}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "px-6 pb-3 text-[14px] leading-relaxed text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex justify-end gap-2.5 border-t-2 border-dashed border-ink px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-display text-[22px] font-extrabold uppercase tracking-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-[14px] leading-relaxed text-ink-3", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
