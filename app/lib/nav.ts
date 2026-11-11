/**
 * Top-nav helpers. The site has two `SiteNav` components today (home.tsx and
 * blogs.tsx) and both need the same "is this link the current page?" logic,
 * so the rule lives here.
 */

/**
 * True if `href` represents the page the user is currently on.
 *
 * - Hrefs without a query string match by path. The path is considered active
 *   on its exact route _and_ on any descendant route, so `/blogs` lights up
 *   on `/blogs/:slug`, `/road-signs` on `/road-signs/pelican`, etc.
 * - Hrefs with a query string require an exact path + query match, so the
 *   item doesn't compete with an unfiltered item for the same path.
 * - The home href (`/`) only matches the exact root path so it doesn't claim
 *   every nested route.
 */
export function isNavLinkActive(
  href: string,
  pathname: string,
  search: string,
): boolean {
  const [hrefPath, hrefQuery] = href.split("?");

  if (hrefQuery !== undefined) {
    return pathname === hrefPath && search.replace(/^\?/, "") === hrefQuery;
  }

  if (hrefPath === "/") return pathname === "/";

  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

/**
 * The site's four places. The phone's tab bar and the top bar's links are both
 * built from this list, so they always agree.
 */
export const SITE_TABS = [
  { id: "home", label: "Home", href: "/" },
  { id: "board", label: "Board", href: "/model-town-board" },
  { id: "signs", label: "Signs", href: "/road-signs" },
  { id: "guides", label: "Guides", href: "/guides" },
] as const;

export type SiteTabId = (typeof SITE_TABS)[number]["id"];

/**
 * Reading pages that live under the Board's and the Signs' addresses. A learner
 * reading one is in Guides, which is where its link is.
 */
const GUIDE_PATHS = [
  "/model-town-board/diagram",
  "/model-town-board/lane-options",
  "/model-town-board/questions",
  "/model-town-board/roundabout",
  "/model-town-board/rules",
  "/model-town-board/parking",
  "/road-signs/warning-signs",
  "/road-signs/mandatory-signs",
  "/road-signs/prohibitory-signs",
];

/** Which tab a page belongs to. `null` for pages outside all four. */
export function activeTab(pathname: string): SiteTabId | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (GUIDE_PATHS.includes(path)) return "guides";
  if (isNavLinkActive("/model-town-board", path, "")) return "board";
  if (isNavLinkActive("/road-signs", path, "")) return "signs";
  if (
    [
      "/guides",
      "/ntsa-test",
      "/driving-schools-kenya",
      "/derevaprep-alternative",
      "/blogs",
      "/about",
      "/privacy",
    ].some((href) => isNavLinkActive(href, path, ""))
  ) {
    return "guides";
  }
  return null;
}

/** The game fills the screen and the internal tools have their own chrome. */
export function tabBarHidden(pathname: string): boolean {
  return (
    isNavLinkActive("/model-town-board/play", pathname, "") ||
    isNavLinkActive("/tools", pathname, "")
  );
}
