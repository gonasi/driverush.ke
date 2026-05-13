import * as React from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01FreeIcons,
  Copy01FreeIcons,
  Link04FreeIcons,
  RefreshFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/share";

import { SITE } from "~/lib/site";
import {
  UTM_CAMPAIGNS,
  UTM_CHANNELS,
  type UtmChannel,
  addUtm,
  utmSlug,
} from "~/lib/utm";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Share builder · DriveRush Tools" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

const CHANNEL_OPTIONS: { value: UtmChannel | "custom"; label: string }[] = [
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "email", label: "Email" },
  { value: "partner", label: "Partner referral" },
  { value: "press", label: "Press / media" },
  { value: "qr", label: "QR code / offline" },
  { value: "paid_search", label: "Paid search (Google)" },
  { value: "paid_social", label: "Paid social (Meta)" },
  { value: "custom", label: "Custom…" },
];

const DEFAULT_URL = SITE.url.replace(/\/$/, "") + "/";

export default function ShareBuilder() {
  const [url, setUrl] = React.useState(DEFAULT_URL);
  const [channel, setChannel] = React.useState<UtmChannel | "custom">(
    "twitter",
  );
  const [source, setSource] = React.useState<string>(
    UTM_CHANNELS.twitter.source,
  );
  const [medium, setMedium] = React.useState<string>(
    UTM_CHANNELS.twitter.medium,
  );
  const [campaign, setCampaign] = React.useState<string>("launch");
  const [content, setContent] = React.useState("");
  const [term, setTerm] = React.useState("");

  function applyChannel(next: UtmChannel | "custom") {
    setChannel(next);
    if (next !== "custom") {
      const preset = UTM_CHANNELS[next];
      setSource(preset.source);
      setMedium(preset.medium);
    }
  }

  const tagged = React.useMemo(() => {
    if (!url.trim() || !source.trim() || !medium.trim()) return url;
    return addUtm(url.trim(), {
      source: source.trim(),
      medium: medium.trim(),
      campaign: campaign.trim() ? utmSlug(campaign) : undefined,
      content: content.trim() || undefined,
      term: term.trim() || undefined,
    });
  }, [url, source, medium, campaign, content, term]);

  const ready =
    url.trim().length > 0 &&
    source.trim().length > 0 &&
    medium.trim().length > 0;

  async function handleCopy() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(tagged);
      toast.success("Tagged link copied", {
        description: tagged,
      });
    } catch {
      toast.error("Couldn't copy — select the link and copy manually");
    }
  }

  function handleReset() {
    setUrl(DEFAULT_URL);
    applyChannel("twitter");
    setCampaign("launch");
    setContent("");
    setTerm("");
  }

  return (
    <div>
      <header className="border-b-2 border-ink pb-6">
        <span className="eyebrow text-ink">Internal · campaigns</span>
        <h1 className="m-0 mt-3 font-display text-[clamp(32px,5vw,52px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
          Share <span className="italic text-rush">builder</span>
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-[clamp(16px,2vw,20px)] leading-tight text-ink-2">
          Tag a DriveRush link with UTMs before posting it anywhere — socials,
          email, partner pages. Keeps GA attribution clean and the campaign
          vocabulary consistent across the team.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
        {/* Form */}
        <section className="grid gap-5">
          <Field
            label="Destination URL"
            hint="Where the link should land. Any DriveRush page works."
          >
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://driverush.ke/practice"
              autoComplete="off"
            />
          </Field>

          <Field label="Channel preset" hint="Fills source + medium for you.">
            <Select
              value={channel}
              onValueChange={(v) => applyChannel(v as UtmChannel | "custom")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="utm_source" hint="Where the link lives.">
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="twitter"
              />
            </Field>
            <Field label="utm_medium" hint="How it gets there.">
              <Input
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="social"
              />
            </Field>
          </div>

          <Field
            label="utm_campaign"
            hint="Pick a preset or type your own — we'll slugify it."
          >
            <Input
              list="campaign-presets"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="launch"
            />
            <datalist id="campaign-presets">
              {UTM_CAMPAIGNS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="utm_content"
              hint="Optional. Distinguish creative variants (a/b)."
            >
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="hero_v1"
              />
            </Field>
            <Field
              label="utm_term"
              hint="Optional. Paid-search keyword, mostly."
            >
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="kenya driving test"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="paper" size="sm" onClick={handleReset}>
              <HugeiconsIcon
                icon={RefreshFreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              Reset
            </Button>
          </div>
        </section>

        {/* Preview */}
        <section className="grid gap-4 self-start border-2 border-ink bg-surface p-6 shadow-stamp lg:sticky lg:top-6">
          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            <HugeiconsIcon icon={Link04FreeIcons} size={13} strokeWidth={2.5} />
            Tagged link
          </div>
          <div className="break-all border-2 border-dashed border-ink bg-paper-3 p-4 font-mono text-[12.5px] leading-relaxed text-ink">
            {ready ? tagged : "Fill in URL, source, and medium to preview…"}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="ink"
              size="lg"
              onClick={handleCopy}
              disabled={!ready}
            >
              <HugeiconsIcon
                icon={Copy01FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
              Copy link
            </Button>
            <Button variant="paper" size="lg" asChild disabled={!ready}>
              <a
                href={ready ? tagged : undefined}
                target="_blank"
                rel="noreferrer noopener"
              >
                Open
                <HugeiconsIcon
                  icon={ArrowUpRight01FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </a>
            </Button>
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Tip · keep utm_campaign stable across a single push so GA reports
            don't fragment.
          </p>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[12px] leading-relaxed text-ink-3">{hint}</p>}
    </div>
  );
}
