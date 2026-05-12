import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ImageCropFreeIcons,
  Menu01FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/tools-layout";

import { TOOLS } from "~/lib/tools";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Tools · DriveRush" },
    { name: "robots", content: "noindex,nofollow" },
    {
      name: "description",
      content: "Internal authoring tools for DriveRush content.",
    },
  ];
}

/** The tool list, rendered both in the desktop sidebar and the mobile sheet. */
function ToolNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      <Link
        to="/tools"
        onClick={onNavigate}
        data-active={pathname === "/tools" || undefined}
        className={cn(
          "flex items-center gap-2.5 border-2 border-transparent px-3 py-2",
          "font-mono text-[11px] uppercase tracking-widest text-ink-3",
          "outline-none transition-colors duration-100 ease-snap",
          "hover:text-ink focus-visible:border-ink focus-visible:bg-paper-3 focus-visible:text-ink",
          "data-[active]:bg-ink data-[active]:text-paper data-[active]:hover:text-paper",
        )}
      >
        All tools
      </Link>

      <div className="my-2 border-t border-dashed border-ink" />

      {TOOLS.map((tool) => {
        const active = pathname === tool.path;
        const soon = tool.status === "soon";
        const className = cn(
          "group/tool flex items-start gap-2.5 border-2 border-transparent px-3 py-2.5",
          "outline-none transition-colors duration-100 ease-snap",
          soon
            ? "cursor-not-allowed text-ink-4"
            : "text-ink-2 hover:text-ink focus-visible:border-ink focus-visible:bg-paper-3 focus-visible:text-ink",
          active && "bg-ink text-paper hover:text-paper",
        );
        const inner = (
          <>
            <HugeiconsIcon
              icon={tool.icon}
              size={18}
              strokeWidth={2}
              className="mt-px shrink-0"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-display text-[12.5px] font-extrabold uppercase tracking-wide">
                {tool.title}
                {soon && (
                  <span className="border border-current px-1 py-px font-mono text-[8.5px] font-bold uppercase tracking-widest">
                    Soon
                  </span>
                )}
              </span>
            </span>
          </>
        );
        return soon ? (
          <span key={tool.slug} className={className} aria-disabled>
            {inner}
          </span>
        ) : (
          <Link
            key={tool.slug}
            to={tool.path}
            onClick={onNavigate}
            data-active={active || undefined}
            className={className}
          >
            {inner}
          </Link>
        );
      })}

      <div className="my-2 border-t border-dashed border-ink" />

      <Link
        to="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 px-3 py-2",
          "font-mono text-[10.5px] uppercase tracking-widest text-ink-3",
          "outline-none transition-colors duration-100 hover:text-ink focus-visible:text-ink",
        )}
      >
        <HugeiconsIcon
          icon={ArrowLeft02FreeIcons}
          size={13}
          strokeWidth={2.5}
        />
        Back to site
      </Link>
    </nav>
  );
}

function SidebarHeader() {
  return (
    <Link
      to="/tools"
      className="flex items-center gap-2.5 border-b-2 border-ink bg-ink px-4 py-3.5 text-paper outline-none"
    >
      <span className="flex size-7 items-center justify-center border-2 border-paper bg-paper text-ink">
        <HugeiconsIcon icon={ImageCropFreeIcons} size={15} strokeWidth={2.25} />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[13px] font-extrabold uppercase tracking-wide">
          DriveRush
        </span>
        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-ink-200">
          Tools · internal
        </span>
      </span>
    </Link>
  );
}

export default function ToolsLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper-2 text-ink md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-ink bg-surface md:flex">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto p-3">
          <ToolNav />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-ink bg-surface px-4 py-3 md:hidden">
        <Link to="/tools" className="flex items-center gap-2 outline-none">
          <span className="flex size-7 items-center justify-center border-2 border-ink bg-ink text-paper">
            <HugeiconsIcon
              icon={ImageCropFreeIcons}
              size={14}
              strokeWidth={2.25}
            />
          </span>
          <span className="font-display text-[13px] font-extrabold uppercase tracking-wide">
            DriveRush <span className="text-ink-3">Tools</span>
          </span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="paper" size="sm" aria-label="Open tools menu">
              <HugeiconsIcon
                icon={Menu01FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
              Tools
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader>
              <SheetTitle>DriveRush Tools</SheetTitle>
            </SheetHeader>
            <SheetBody className="p-3">
              <ToolNav onNavigate={() => setOpen(false)} />
            </SheetBody>
          </SheetContent>
        </Sheet>
      </header>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
