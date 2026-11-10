/**
 * `/road-signs/:slug`: one Kenyan road sign. People search for individual signs by
 * name, so each gets a page that answers the question and then gets them
 * practising it. The data is static, and the loader exists only so an unknown slug
 * returns a real 404.
 */
import { Link } from "react-router";

import type { Route } from "./+types/road-sign";

import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import {
  hasSign3D,
  isSignConfirmed,
  relatedSigns,
  SIGN_CLASS_GUIDE,
  signGuide,
  signPageByCode,
  signPageBySlug,
  signPagePath,
} from "~/lib/road-sign-pages";
import { signClassPage } from "~/lib/sign-class-pages";
import { absUrl, breadcrumbLd, graphLd, pageMeta } from "~/lib/site";
import { trainerHref } from "~/lib/trainer-rounds";

import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";
import { SignCredit } from "~/components/brand/sign-credit";
import { SignImage } from "~/components/brand/sign-image";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { InlineAd } from "~/components/brand/inline-ad";

const DESCRIPTION_LIMIT = 155;

/** Cut at a word boundary so a search result never ends mid-word. */
function clip(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, text.lastIndexOf(" ", limit - 1))}…`;
}

export function loader({ params }: Route.LoaderArgs) {
  const sign = signPageBySlug(params.slug);
  if (!sign) throw new Response("Not found", { status: 404 });
  return { slug: sign.slug };
}

export function meta({ data }: Route.MetaArgs) {
  const sign = signPageBySlug(data?.slug);
  if (!sign) {
    return [
      { title: "Road sign not found · DriveRush Kenya" },
      { name: "robots", content: "noindex, follow" },
    ];
  }
  const guide = SIGN_CLASS_GUIDE[sign.category!];
  const classPage = signClassPage(sign.category);
  const path = signPagePath(sign);
  return [
    ...pageMeta({
      title: `${sign.name} sign in Kenya (${sign.code}): what it means`,
      description: clip(
        `${sign.name} (${sign.code}) is a Kenyan ${guide.singular}. ${sign.note}`,
        DESCRIPTION_LIMIT,
      ),
      path,
      ogImage: ogCardPath("road-signs"),
      ogImageAlt: ogCardAlt("road-signs"),
    }),
    ...(isSignConfirmed(sign)
      ? []
      : [{ name: "robots", content: "noindex, follow" }]),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Road signs", url: "/road-signs" },
        ...(classPage ? [{ name: classPage.name, url: classPage.path }] : []),
        { name: sign.name!, url: path },
      ]),
      {
        "@type": "DefinedTerm",
        name: sign.name,
        termCode: sign.code,
        description: sign.note,
        url: absUrl(path),
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name: "Kenyan road signs",
          url: absUrl("/road-signs"),
        },
      },
    ),
  ];
}

export default function RoadSign({ loaderData }: Route.ComponentProps) {
  const sign = signPageBySlug(loaderData.slug)!;
  const guide = SIGN_CLASS_GUIDE[sign.category!];
  const classPage = signClassPage(sign.category);
  const codes = sign.code ? [sign.code] : [];
  const extra = signGuide(sign);
  const lookAlikes = (extra?.confusedWith ?? []).flatMap(({ code, how }) => {
    const other = signPageByCode(code);
    return other ? [{ other, how }] : [];
  });

  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <div className="mx-auto w-full max-w-4xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3"
          >
            <Link to="/road-signs" className="hover:text-ink hover:underline">
              Road signs
            </Link>
            <span aria-hidden>/</span>
            <Link
              to={classPage?.path ?? `/road-signs#${sign.category}`}
              className="hover:text-ink hover:underline"
            >
              {guide.label}
            </Link>
          </nav>

          <header className="grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center sm:gap-8">
            <SignImage
              sign={sign}
              label={`${sign.name} road sign (${sign.code})`}
              className="aspect-square w-full max-w-[240px] border-2 border-ink"
            />
            <div className="grid justify-items-start gap-3">
              <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                Kenyan {guide.singular} · {sign.code}
              </p>
              <h1 className="m-0 font-display text-[clamp(30px,5.6vw,56px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
                {sign.name}
              </h1>
              <div className="mt-1 flex flex-wrap gap-2.5">
                <Button variant="rush" asChild>
                  <Link
                    to={trainerHref("/road-signs/pelican", { codes, go: true })}
                  >
                    Practise this sign
                  </Link>
                </Button>
                {hasSign3D(sign) && (
                  <Button variant="paper" asChild>
                    <Link
                      to={trainerHref("/road-signs/3d", { codes, go: true })}
                    >
                      Spin it in 3D
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </header>

          <section className="mt-10 grid gap-8 border-t-2 border-ink pt-8 font-serif text-[18px] leading-relaxed text-ink-2">
            {extra && (
              <Block title="What it looks like">
                <p className="m-0">{extra.looks}</p>
              </Block>
            )}
            <Block title="What it means">
              <p className="m-0">{sign.detail}</p>
            </Block>
            <Block title="What to do">
              <p className="m-0">{sign.note}</p>
            </Block>
            {extra && (
              <>
                <Block title="Where you'll see it in Kenya">
                  <p className="m-0">{extra.where}</p>
                </Block>
                <Block title="Common mistakes">
                  <ul className="m-0 grid list-disc gap-3 pl-5 marker:text-rush">
                    {extra.mistakes.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </Block>
                {lookAlikes.length > 0 && (
                  <Block title="Don't mix it up with">
                    <ul className="m-0 grid list-none gap-4 p-0">
                      {lookAlikes.map(({ other, how }) => (
                        <li
                          key={other.slug}
                          className="grid grid-cols-[56px_1fr] items-start gap-4"
                        >
                          <SignImage
                            sign={other}
                            className="size-14 border-2 border-ink"
                          />
                          <p className="m-0">
                            <Link
                              to={signPagePath(other)}
                              className="font-sans font-semibold text-rush hover:underline"
                            >
                              {other.name} ({other.code})
                            </Link>
                            . {how}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Block>
                )}
                <Block title="How to remember it">
                  <p className="m-0">{extra.remember}</p>
                </Block>
              </>
            )}
            <Block title={`How to read ${guide.label.toLowerCase()}`}>
              <p className="m-0">{guide.rule}</p>
              {classPage && (
                <p className="m-0 mt-3">
                  <Link
                    to={classPage.path}
                    className="font-sans text-[15px] font-semibold text-rush hover:underline"
                  >
                    The full guide to {guide.label.toLowerCase()}
                  </Link>
                </p>
              )}
            </Block>
          </section>

          {/* Only signs with the full write-up carry an ad. The rest are short
              and noindex, and an ad on a thin page reads as low value. */}
          {extra && <InlineAd />}

          <section className="mt-10">
            <h2 className="m-0 mb-4 border-b-2 border-ink pb-3 font-display text-xl font-extrabold uppercase tracking-tight">
              More {guide.label.toLowerCase()}
            </h2>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
              {relatedSigns(sign).map((other) => (
                <li key={other.slug}>
                  <Link
                    to={signPagePath(other)}
                    className="grid h-full grid-cols-[48px_1fr] items-center gap-2.5 border-2 border-ink bg-paper-3 p-2.5 outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
                  >
                    <SignImage
                      sign={other}
                      className="size-12 border-2 border-ink"
                    />
                    <span className="font-display text-[11.5px] font-extrabold uppercase leading-tight tracking-[0.02em]">
                      {other.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mb-0 mt-5 text-[14.5px] leading-snug text-ink-2">
              On the way to your test? Read{" "}
              <Link
                to="/ntsa-test"
                className="font-semibold text-rush hover:underline"
              >
                how the NTSA test works
              </Link>{" "}
              and{" "}
              <Link
                to="/model-town-board"
                className="font-semibold text-rush hover:underline"
              >
                how the Model Town Board is used
              </Link>
              .
            </p>
          </section>

          <SignCredit className="mt-8" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="m-0 mb-2 font-display text-xl font-extrabold uppercase tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </div>
  );
}
