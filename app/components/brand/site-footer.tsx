/**
 * Shared site footer: the trainers, the contact details, and who the signs are
 * credited to. One source of truth so every primary route shares the same chrome.
 */
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02FreeIcons, Mail01FreeIcons } from "@hugeicons/core-free-icons";

import { analytics } from "~/lib/analytics";
import { SIGN_BRAND, SIGN_SOURCE } from "~/lib/sign-credits";
import { SITE } from "~/lib/site";

import { Logo } from "~/components/brand/logo";
import { SignCredit } from "~/components/brand/sign-credit";
import { PoweredByGonasi } from "~/components/brand/powered-by-gonasi";

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-5 sm:px-9">{children}</div>
);

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-double border-ink bg-ink py-12 text-paper">
      <Container>
        <div className="grid gap-6 border-b border-paper/20 pb-7 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo variant="plain" height={64} themed="on-ink" />
            <p className="mt-4 max-w-sm font-serif text-base leading-snug opacity-80">
              Memorise Kenyan road signs for the NTSA test, on the Pelican chart
              or in 3D.
            </p>

            <h3 className="m-0 mb-3 mt-6 font-display text-xs font-extrabold uppercase tracking-widest">
              Contact
            </h3>
            <ul className="m-0 list-none p-0">
              <li className="py-1">
                <a
                  href={`tel:${SITE.contact.phone}`}
                  onClick={() =>
                    analytics.contactClicked({
                      channel: "phone",
                      location: "footer",
                    })
                  }
                  className="inline-flex items-center gap-2 font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  <HugeiconsIcon
                    icon={Call02FreeIcons}
                    size={14}
                    strokeWidth={2}
                  />
                  {SITE.contact.phoneDisplay}
                </a>
              </li>
              <li className="py-1">
                <a
                  href={`mailto:${SITE.contact.email}`}
                  onClick={() =>
                    analytics.contactClicked({
                      channel: "email",
                      location: "footer",
                    })
                  }
                  className="inline-flex items-center gap-2 break-all font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  <HugeiconsIcon
                    icon={Mail01FreeIcons}
                    size={14}
                    strokeWidth={2}
                  />
                  {SITE.contact.email}
                </a>
              </li>
            </ul>
          </div>
          <FooterCol
            heading="Train"
            items={[
              { label: "Pelican chart", href: "/road-signs/pelican" },
              { label: "3D signs", href: "/road-signs/3d" },
              { label: "All signs", href: "/road-signs" },
            ]}
          />
          <FooterCol
            heading="More"
            items={[
              { label: "Model Town Board (soon)", href: "/model-town-board" },
              { label: "Blog", href: "/blogs" },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-paper/20 py-5">
          <SignCredit size="sm" onInk />
          <span className="font-mono text-[10.5px] uppercase tracking-widest opacity-70">
            {SIGN_BRAND.name} name and logo used with permission
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-widest opacity-70">
            Based on the{" "}
            <a
              href={SIGN_SOURCE.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                analytics.partnerClicked({
                  name: SIGN_SOURCE.name,
                  url: SIGN_SOURCE.href,
                })
              }
              className="underline-offset-2 hover:underline"
            >
              {SIGN_SOURCE.name}
            </a>
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-widest opacity-70">
            Not affiliated with the NTSA
          </span>
        </div>

        <div className="flex flex-col items-start gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <PoweredByGonasi
            variant="lockup"
            tone="on-dark"
            utmMedium="home_footer"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-widest opacity-60">
            <span>© 2026 DriveRush.ke</span>
            <span aria-hidden>·</span>
            <span>Learn · Drive · Succeed</span>
            <span aria-hidden>·</span>
            <span>Nairobi · KE</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  heading,
  items,
}: {
  heading: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="m-0 mb-3 font-display text-xs font-extrabold uppercase tracking-widest">
        {heading}
      </h3>
      <ul className="m-0 list-none p-0">
        {items.map((it) => {
          const isInternal = it.href.startsWith("/");
          return (
            <li key={it.label} className="py-1">
              {isInternal ? (
                <Link
                  to={it.href}
                  className="font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  {it.label}
                </Link>
              ) : (
                <a
                  href={it.href}
                  className="font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  {it.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
