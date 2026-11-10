/**
 * Every sign in one class, each linking to its own page, with buttons to drill
 * the class. Used inside the class guides' MDX, just before their sources.
 */
import { Link } from "react-router";

import type { SignCategoryId } from "~/lib/image-focus";
import { SIGN_PAGES, signPagePath } from "~/lib/road-sign-pages";
import { signClassPage } from "~/lib/sign-class-pages";
import { trainerHref } from "~/lib/trainer-rounds";

import { Button } from "~/components/ui/button";
import { SignCredit } from "~/components/brand/sign-credit";
import { SignImage } from "~/components/brand/sign-image";

export function ClassSigns({ category }: { category: SignCategoryId }) {
  const page = signClassPage(category)!;
  const signs = SIGN_PAGES.filter((s) => s.category === category);
  return (
    <section className="mt-12" aria-labelledby="class-signs">
      <h2
        id="class-signs"
        className="m-0 mb-4 border-b-2 border-ink pb-3 font-display text-xl font-extrabold uppercase tracking-tight"
      >
        All {signs.length} {page.name.toLowerCase()}
      </h2>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Drill this class
        </span>
        <Button variant="rush" size="sm" asChild>
          <Link
            to={trainerHref("/road-signs/pelican", {
              category: page.category,
              go: true,
            })}
          >
            On the chart
          </Link>
        </Button>
        <Button variant="paper" size="sm" asChild>
          <Link
            to={trainerHref("/road-signs/3d", {
              category: page.category,
              go: true,
            })}
          >
            In 3D
          </Link>
        </Button>
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {signs.map((sign) => (
          <li key={sign.id}>
            <Link
              to={signPagePath(sign)}
              className="grid h-full grid-cols-[56px_1fr] items-start gap-3 border-2 border-ink bg-paper-3 p-3 no-underline outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
            >
              <SignImage sign={sign} className="size-14 border-2 border-ink" />
              <span className="min-w-0">
                <span className="block font-display text-[12.5px] font-extrabold uppercase leading-tight tracking-[0.02em] text-ink">
                  {sign.name}
                </span>
                <span className="mt-1 block font-sans text-[13px] leading-snug text-ink-2">
                  {sign.note}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <SignCredit className="mt-6" />
    </section>
  );
}
