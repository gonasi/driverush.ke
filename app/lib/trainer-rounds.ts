/**
 * What a trainer run contains, shared by both stores: a short round of the signs
 * you most need (the default), the whole chart, or a drill of specific signs.
 * Also the deep-link format that hands signs from one surface to a trainer.
 */
import type { SignCategoryId } from "./image-focus";
import { boxOf, isDue, type SignProgress } from "./pelican-progress";

export const ROUND_SIZE = 10;

export type RunScope =
  | { kind: "round"; categories?: SignCategoryId[] }
  | { kind: "chart" }
  | { kind: "drill"; ids: string[] };

export type RunScopeKind = RunScope["kind"];

/** Hands-free runs write no grades, so a round would replay the same ten forever. */
export function defaultScope(selfGrading: boolean): RunScope {
  return selfGrading ? { kind: "round" } : { kind: "chart" };
}

/**
 * Choose a round from an already-ordered pool: signs due for review (weakest
 * first), then signs never seen, then signs not due yet. The pool's order is kept
 * for the chosen set, so shuffle and in-order settings still mean what they say.
 */
export function pickRound<T extends { id: string }>(
  pool: readonly T[],
  progress: SignProgress,
  size = ROUND_SIZE,
  now = Date.now(),
): T[] {
  const rank = (sign: T) => {
    const entry = progress[sign.id];
    if (!entry) return 1;
    return isDue(entry, now) ? 0 : 2;
  };
  const ranked = pool
    .map((sign, index) => ({ sign, index }))
    .sort(
      (a, b) =>
        rank(a.sign) - rank(b.sign) ||
        boxOf(progress, a.sign.id) - boxOf(progress, b.sign.id) ||
        a.index - b.index,
    );
  const chosen = new Set(ranked.slice(0, size).map((r) => r.sign.id));
  return pool.filter((sign) => chosen.has(sign.id));
}

/** This run's numbers. A miss re-queues a sign, so the queue can hold it twice. */
export function runTally(
  queue: readonly { id: string }[],
  recalled: readonly string[],
  missed: readonly string[],
) {
  return {
    signsTotal: new Set(queue.map((s) => s.id)).size,
    recalled: recalled.length,
    firstTry: recalled.filter((id) => !missed.includes(id)).length,
  };
}

// ---- deep links --------------------------------------------------------------

type LinkableSign = { id: string; code?: string; category: string };

/** `?codes=W.1,W.2` drills those signs; `?cat=warning` runs a round of that class. */
export function parseTrainerLink(
  params: URLSearchParams,
  signs: readonly LinkableSign[],
): RunScope | null {
  const codes = params.get("codes");
  if (codes) {
    const wanted = new Set(codes.split(","));
    const ids = signs
      .filter((s) => s.code && wanted.has(s.code))
      .map((s) => s.id);
    if (ids.length > 0) return { kind: "drill", ids };
  }
  const category = params.get("cat");
  if (category && signs.some((s) => s.category === category)) {
    return { kind: "round", categories: [category as SignCategoryId] };
  }
  return null;
}

/** Build a trainer URL. `go` starts the run on arrival, skipping the ready card. */
export function trainerHref(
  path: string,
  opts: { codes?: readonly string[]; category?: string; go?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (opts.codes?.length) params.set("codes", opts.codes.join(","));
  if (opts.category) params.set("cat", opts.category);
  if (opts.go) params.set("go", "1");
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
