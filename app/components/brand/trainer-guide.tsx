import { Link } from "react-router";

import {
  SIGN_CLASS_GUIDE,
  SIGN_PAGES,
  signPagePath,
} from "~/lib/road-sign-pages";

/**
 * The written half of a trainer page: how the trainer works, tips, and every
 * sign it covers, linked to its page. The trainers themselves only run in the
 * browser, so without this a crawler sees a loading panel and nothing else.
 *
 * Sits below the player (the product comes first), with the long sign list
 * folded away in a <details>.
 */
export function TrainerGuide({
  name,
  steps,
  tips,
  why,
  codes,
}: {
  /** "the Pelican chart", "3D signs": used inside headings. */
  name: string;
  steps: { title: string; body: string }[];
  tips: string[];
  why: { title: string; body: string[] };
  /** Codes of the signs this trainer drills, in any order. */
  codes: Set<string>;
}) {
  const signs = SIGN_PAGES.filter((s) => s.code && codes.has(s.code));
  const classes = Object.entries(SIGN_CLASS_GUIDE)
    .map(([id, guide]) => ({
      id,
      guide,
      signs: signs.filter((s) => s.category === id),
    }))
    .filter((c) => c.signs.length > 0);

  return (
    <section
      aria-label={`About ${name}`}
      className="mt-14 grid gap-10 border-t-2 border-ink pt-8 font-serif text-[17px] leading-relaxed text-ink-2"
    >
      <div>
        <Heading>How the {name} trainer works</Heading>
        <ol className="m-0 grid list-none gap-4 p-0">
          {steps.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="font-mono text-[13px] font-bold text-rush">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="m-0">
                <strong className="font-sans text-ink">{step.title}.</strong>{" "}
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <Heading>{why.title}</Heading>
        <div className="grid gap-3">
          {why.body.map((p) => (
            <p key={p} className="m-0">
              {p}
            </p>
          ))}
        </div>
      </div>

      <div>
        <Heading>Tips that make the signs stick</Heading>
        <ul className="m-0 grid list-disc gap-3 pl-5 marker:text-rush">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <details className="group border-2 border-ink bg-paper-3 font-sans">
        <summary className="cursor-pointer px-4 py-3 font-display text-[15px] font-extrabold uppercase tracking-tight text-ink">
          All {signs.length} signs in this trainer
        </summary>
        <div className="grid gap-6 border-t-2 border-ink px-4 py-5">
          {classes.map(({ id, guide, signs: list }) => (
            <div key={id}>
              <h3 className="m-0 mb-1 font-display text-[13px] font-extrabold uppercase tracking-wide text-ink">
                {guide.label} · {list.length}
              </h3>
              <p className="m-0 mb-3 text-[13.5px] leading-snug text-ink-2">
                {guide.rule}
              </p>
              <ul className="m-0 grid list-none gap-x-4 gap-y-1.5 p-0 text-[14px] sm:grid-cols-2">
                {list.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to={signPagePath(s)}
                      className="text-ink hover:text-rush hover:underline"
                    >
                      {s.name}
                    </Link>{" "}
                    <span className="font-mono text-[11px] text-ink-3">
                      {s.code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 mb-3 font-display text-xl font-extrabold uppercase tracking-tight text-ink">
      {children}
    </h2>
  );
}
