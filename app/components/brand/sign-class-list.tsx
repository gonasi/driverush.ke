/**
 * All the trainers' signs, by class: a real crop off the chart, its name and what
 * to do about it, each class with links to drill just that class. The list is in
 * the server's HTML so search engines can read it, and native <details> keeps it
 * collapsed without JS. Status badges arrive after hydration.
 */
import { Link } from "react-router";

import { regionSpriteStyle, SIGN_CATEGORIES } from "~/lib/image-focus";
import { isDue, MASTERED_BOX, type SignProgress } from "~/lib/pelican-progress";
import { CHART_SRC, SIGN_PAGES, signPagePath } from "~/lib/road-sign-pages";
import { trainerHref } from "~/lib/trainer-rounds";
import { useSignProgress } from "~/lib/use-sign-progress";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Accordion, AccordionItem } from "~/components/brand/accordion";

const THUMB_PAD = 0.1;

/** Classes that actually have signs, in the chart's order. */
const CLASSES = SIGN_CATEGORIES.map((category) => ({
  category,
  signs: SIGN_PAGES.filter((s) => s.category === category.id),
})).filter((c) => c.signs.length > 0);

function SignStatus({ entry }: { entry: SignProgress[string] | undefined }) {
  if (!entry) return null;
  if (isDue(entry)) return <Badge variant="amber">Due</Badge>;
  return entry.box >= MASTERED_BOX ? (
    <Badge variant="green">Known</Badge>
  ) : (
    <Badge variant="outline">Learning</Badge>
  );
}

export function SignClassList() {
  const progress = useSignProgress();
  return (
    <Accordion>
      {CLASSES.map(({ category, signs }, index) => (
        <AccordionItem
          key={category.id}
          open={index === 0}
          summary={
            <span className="flex flex-1 items-center gap-2.5">
              <span
                aria-hidden
                className="size-7 shrink-0 border-2 border-ink bg-white"
                style={regionSpriteStyle(signs[0], CHART_SRC, THUMB_PAD)}
              />
              <span>{category.label}</span>
              <span className="ml-auto font-mono text-[10px] font-normal normal-case tracking-wider opacity-70">
                {signs.length} signs
              </span>
            </span>
          }
        >
          <div id={category.id} className="scroll-mt-20 font-sans">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                Drill this class
              </span>
              <Button variant="paper" size="sm" asChild>
                <Link
                  to={trainerHref("/road-signs/pelican", {
                    category: category.id,
                    go: true,
                  })}
                >
                  On the chart
                </Link>
              </Button>
              <Button variant="paper" size="sm" asChild>
                <Link
                  to={trainerHref("/road-signs/3d", {
                    category: category.id,
                    go: true,
                  })}
                >
                  In 3D
                </Link>
              </Button>
            </div>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {signs.map((sign) => (
                <li
                  key={sign.id}
                  className="dr-skip-offscreen grid grid-cols-[64px_1fr] items-start gap-3 border-2 border-ink bg-paper-3 p-3"
                >
                  <div
                    role="img"
                    aria-label={`Road sign: ${sign.name}`}
                    className="size-16 border-2 border-ink bg-white"
                    style={regionSpriteStyle(sign, CHART_SRC, THUMB_PAD)}
                  />
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={signPagePath(sign)}
                        className="font-display text-[12.5px] font-extrabold uppercase leading-tight tracking-[0.02em] text-ink underline-offset-2 hover:text-rush hover:underline"
                      >
                        {sign.name}
                      </Link>
                      <SignStatus entry={progress?.pelican[sign.id]} />
                    </div>
                    {sign.note && (
                      <p className="m-0 mt-1 text-[13px] leading-snug text-ink-2">
                        {sign.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
