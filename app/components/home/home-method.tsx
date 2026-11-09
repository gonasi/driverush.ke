/**
 * Why the trainers work, in three short points, with a link to the full write-up.
 * Sits below the product (see lead-with-the-product): it answers "why this and
 * not the booklet?" for anyone who scrolls, without getting between a visitor
 * and a sign.
 */
import { Link } from "react-router";

const POINTS = [
  {
    title: "Name it before you see it",
    body: "Reading a sign with its name only asks you to agree. Pulling the name from memory is the skill the test needs, and the effort is what makes it stick.",
  },
  {
    title: "Misses come back sooner",
    body: "Each sign has its own review schedule: one day, then two, four, eight. Miss one and it returns in the same run. A sign counts as known only after you've recalled it on two different days.",
  },
  {
    title: "See it like on the road",
    body: "The chart shows the system: triangles warn, red rings forbid, blue circles order. In 3D you read each sign from an angle, the way you meet it from the driver's seat.",
  },
];

export function HomeMethod() {
  return (
    <section
      aria-labelledby="home-method"
      className="mx-auto w-full max-w-4xl px-5 pb-12 sm:px-9"
    >
      <h2
        id="home-method"
        className="m-0 border-b-2 border-ink pb-3 font-display text-xl font-extrabold uppercase tracking-tight sm:text-2xl"
      >
        Why the signs stick
      </h2>
      <ol className="m-0 mt-5 grid list-none gap-5 p-0 sm:grid-cols-3">
        {POINTS.map((point, i) => (
          <li key={point.title} className="grid content-start gap-1.5">
            <span className="font-mono text-[13px] font-bold text-rush">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-[0.02em] text-ink">
              {point.title}
            </span>
            <p className="m-0 font-serif text-[15.5px] leading-snug text-ink-2">
              {point.body}
            </p>
          </li>
        ))}
      </ol>
      <p className="m-0 mt-5 font-serif text-[15.5px] leading-snug text-ink-2">
        Ten signs a day for a couple of weeks beats one long night before the
        test.{" "}
        <Link
          to="/blogs/how-to-memorise-kenyan-road-signs"
          className="font-sans font-bold text-ink underline decoration-rush decoration-2 underline-offset-4 hover:text-rush"
        >
          How the method works
        </Link>
      </p>
    </section>
  );
}
