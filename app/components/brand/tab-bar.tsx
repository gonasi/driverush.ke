/**
 * The phone's way around the site: four tabs fixed to the bottom of every
 * page, the current one marked. It replaces the menu button, so a learner can
 * always see where they are and get anywhere in one tap. Wide screens use the
 * links in the top bar instead. The games cover it while they are open.
 */
import { Link, useLocation } from "react-router";

import { analytics } from "~/lib/analytics";
import { SITE_TABS, activeTab, tabBarHidden } from "~/lib/nav";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import {
  BookIcon,
  HomeIcon,
  RoadIcon,
  WarningIcon,
  type IconDef,
} from "~/components/brand/icons";

const ICONS: Record<(typeof SITE_TABS)[number]["id"], IconDef> = {
  home: HomeIcon,
  board: RoadIcon,
  signs: WarningIcon,
  guides: BookIcon,
};

export function TabBar() {
  const { pathname } = useLocation();
  if (tabBarHidden(pathname)) return null;
  const current = activeTab(pathname);
  return (
    <>
      {/* Holds the page clear of the bar. */}
      <div
        aria-hidden
        className="h-[calc(3.75rem+env(safe-area-inset-bottom))] md:hidden"
      />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="m-0 grid list-none grid-cols-4 p-0">
          {SITE_TABS.map((tab) => {
            const on = tab.id === current;
            return (
              <li key={tab.id}>
                <Link
                  to={tab.href}
                  aria-current={on ? "page" : undefined}
                  onClick={() =>
                    analytics.navTabClicked({ tab: tab.id, from: pathname })
                  }
                  className={cn(
                    "relative flex h-[3.75rem] flex-col items-center justify-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest outline-none transition-colors focus-visible:bg-paper-2",
                    on
                      ? "text-ink before:absolute before:inset-x-3 before:-top-0.5 before:h-[3px] before:bg-rush"
                      : "text-ink-3 hover:text-ink",
                  )}
                >
                  <Icon icon={ICONS[tab.id]} size={22} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
