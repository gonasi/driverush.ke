/**
 * Shared top navigation. Three primary destinations (Course · Practice ·
 * Signs) so the hierarchy is obvious. Schools + Blog live in the footer and
 * pick up traffic via contextual cross-links from blog posts. The primary CTA
 * sends learners straight into the homepage's live sign challenge anchor.
 *
 * Used from `home.tsx`, `blogs.tsx`, and any other surface that wants the
 * full nav. Brutalist surfaces like the lesson player intentionally don't
 * mount it.
 */
import { Link, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  Menu01FreeIcons,
} from "@hugeicons/core-free-icons";

import { isNavLinkActive } from "~/lib/nav";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { AppBar, AppBarLink } from "~/components/brand/app-bar";
import { PoweredByGonasi } from "~/components/brand/powered-by-gonasi";

export const NAV_LINKS = [
  { label: "Course", href: "/courses" },
  { label: "Practice", href: "/practice" },
  { label: "Signs", href: "/road-signs" },
];

export function SiteNav() {
  const { pathname, search } = useLocation();
  return (
    <AppBar
      nav={NAV_LINKS.map((l) => (
        <AppBarLink
          key={l.href}
          asChild
          active={isNavLinkActive(l.href, pathname, search)}
        >
          <Link to={l.href}>{l.label}</Link>
        </AppBarLink>
      ))}
      trailing={
        <>
          <Button variant="rush" size="sm" asChild>
            <Link to="/#try-now">
              <span className="hidden sm:inline">Try a sign</span>
              <span className="sm:hidden">Start</span>
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="paper"
                size="sm"
                aria-label="Open menu"
                className="md:hidden"
              >
                <HugeiconsIcon
                  icon={Menu01FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <nav className="grid gap-3">
                  <SheetClose asChild>
                    <Link
                      to="/#try-now"
                      className="flex items-center justify-between gap-3 border-2 border-ink bg-rush px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-white shadow-stamp-sm"
                    >
                      Try a sign
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={14}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </SheetClose>
                  {NAV_LINKS.map((l) => (
                    <SheetClose asChild key={l.href}>
                      <Link
                        to={l.href}
                        className="border-2 border-ink bg-surface px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink shadow-stamp-sm hover:bg-paper-3"
                      >
                        {l.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      to="/driving-schools-kenya"
                      className="border-2 border-ink bg-surface px-4 py-3 font-mono text-[12px] uppercase tracking-widest text-ink-2 hover:bg-paper-3"
                    >
                      Schools
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/blogs"
                      className="border-2 border-ink bg-surface px-4 py-3 font-mono text-[12px] uppercase tracking-widest text-ink-2 hover:bg-paper-3"
                    >
                      Blog
                    </Link>
                  </SheetClose>
                </nav>
                <div className="mt-6">
                  <Button variant="paper" size="lg" asChild className="w-full">
                    <Link to="/practice?mode=test">
                      Take a quick test
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={16}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </Button>
                </div>
                <div className="mt-6 border-t border-dashed border-ink pt-4">
                  <PoweredByGonasi
                    variant="inline"
                    tone="auto"
                    utmMedium="mobile_menu"
                  />
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </>
      }
    />
  );
}
