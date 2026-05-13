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
 *   "Quick test" item (`/practice?mode=test`) doesn't compete with the plain
 *   "Practice" item (`/practice`) when the user is on the unmoded page.
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
