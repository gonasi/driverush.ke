/**
 * Shared top navigation. The site does one thing, so the nav is that thing: the
 * two trainers, the full list of signs, and a marked "soon" item for the Model
 * Town Board. Blog lives in the footer and the mobile menu.
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
import { Logo } from "~/components/brand/logo";
import { PoweredByGonasi } from "~/components/brand/powered-by-gonasi";

export const NAV_LINKS = [
  { label: "Pelican chart", href: "/road-signs/pelican" },
  { label: "3D signs", href: "/road-signs/3d" },
  // Exact match: the trainers live under this path and have their own items.
  { label: "All signs", href: "/road-signs", exact: true },
];

const BOARD_HREF = "/model-town-board";

function SoonBadge() {
  return (
    <span className="ml-1.5 border border-ink bg-amber px-1 py-px font-mono text-[9px] font-bold uppercase leading-none tracking-wider text-amber-foreground">
      Soon
    </span>
  );
}

export function SiteNav() {
  const { pathname, search } = useLocation();
  return (
    <AppBar
      brand={
        <Link to="/" aria-label="DriveRush home" className="outline-none">
          <Logo variant="plain" height={40} themed priority />
        </Link>
      }
      nav={
        <>
          {NAV_LINKS.map((l) => (
            <AppBarLink
              key={l.href}
              asChild
              active={
                l.exact
                  ? pathname === l.href
                  : isNavLinkActive(l.href, pathname, search)
              }
            >
              <Link to={l.href}>{l.label}</Link>
            </AppBarLink>
          ))}
          <AppBarLink asChild active={pathname === BOARD_HREF}>
            <Link to={BOARD_HREF}>
              <span className="lg:hidden">Board</span>
              <span className="hidden lg:inline">Model Town Board</span>
              <SoonBadge />
            </Link>
          </AppBarLink>
        </>
      }
      trailing={
        <>
          <Button variant="rush" size="sm" asChild>
            <Link to="/#try-now">
              Start
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={14}
                strokeWidth={2.5}
                className="dr-arrow"
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
                      to={BOARD_HREF}
                      className="flex items-center justify-between gap-3 border-2 border-dashed border-ink bg-paper-3 px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink"
                    >
                      Model Town Board
                      <SoonBadge />
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
