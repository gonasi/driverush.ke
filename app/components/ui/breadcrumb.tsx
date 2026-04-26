import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "~/lib/utils";

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Breadcrumb"
      data-slot="breadcrumb"
      className={cn(
        "inline-flex flex-wrap items-center font-mono text-[11px] uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("inline-flex flex-wrap items-center gap-x-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  className,
  asChild,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "text-ink-3 outline-none transition-colors hover:text-ink focus-visible:text-ink",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="link"
      aria-current="page"
      aria-disabled="true"
      data-slot="breadcrumb-page"
      className={cn("font-bold text-ink", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  className,
  children = "/",
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden
      data-slot="breadcrumb-separator"
      className={cn("font-bold text-rush", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
