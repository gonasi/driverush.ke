import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";

import type { Route } from "./+types/index";

import { TOOLS } from "~/lib/tools";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Tools · DriveRush" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function ToolsIndex() {
  return (
    <div>
      <header className="border-b-2 border-ink pb-6">
        <span className="eyebrow text-ink">Internal · authoring</span>
        <h1 className="m-0 mt-3 font-display text-[clamp(32px,5vw,52px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
          DriveRush <span className="italic text-rush">tools</span>
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-[clamp(16px,2vw,20px)] leading-tight text-ink-2">
          Small in-browser utilities for building the hardcoded learning content
          — start with the image-coordinate mapper for the road-sign trainers.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const soon = tool.status === "soon";
          return (
            <article
              key={tool.slug}
              className={cn(
                "flex h-full flex-col gap-4 border-2 border-ink bg-surface p-6 shadow-stamp",
                soon && "opacity-60",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
                  <HugeiconsIcon
                    icon={tool.icon}
                    size={24}
                    strokeWidth={2.25}
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                    {soon ? "Planned" : "Tool"}
                  </span>
                  <h2 className="m-0 mt-1.5 font-display text-[clamp(20px,2.4vw,26px)] font-extrabold uppercase leading-[0.95] tracking-tight">
                    {tool.title}
                  </h2>
                </div>
              </div>
              <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">
                {tool.blurb}
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-dashed border-ink pt-4">
                {soon ? (
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                    Coming soon
                  </span>
                ) : (
                  <Button variant="ink" size="lg" asChild>
                    <Link to={tool.path}>
                      Open
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={16}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
