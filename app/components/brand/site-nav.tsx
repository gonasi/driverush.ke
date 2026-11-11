/**
 * Shared top navigation: the things you can train on, most wanted first. The
 * Model Town Board leads, then the two sign trainers and the full list of
 * signs. Blog lives in the footer and the mobile menu.
 */
import { Link, useLocation } from "react-router";
import { Icon } from "~/components/brand/icon";
import { ArrowRightIcon, MenuIcon } from "~/components/brand/icons";

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
  // The board is what most learners come for, so it leads.
  { label: "Model Town Board", short: "Board", href: "/model-town-board" },
  { label: "Pelican chart", href: "/road-signs/pelican" },
  { label: "3D signs", href: "/road-signs/3d" },
  // Exact match: the trainers live under this path and have their own items.
  { label: "All signs", href: "/road-signs", exact: true },
];

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
              <Link to={l.href}>
                {l.short ? (
                  <>
                    <span className="lg:hidden">{l.short}</span>
                    <span className="hidden lg:inline">{l.label}</span>
                  </>
                ) : (
                  l.label
                )}
              </Link>
            </AppBarLink>
          ))}
        </>
      }
      trailing={
        <>
          <Button variant="rush" size="sm" asChild>
            <Link to="/#try-now">
              Start
              <Icon icon={ArrowRightIcon} size={14} className="dr-arrow" />
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
                <Icon icon={MenuIcon} size={16} />
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
