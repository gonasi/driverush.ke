/**
 * The one share affordance. Drop `<ShareButton payload={…} />` next to any
 * result screen or page header.
 *
 * Mobile gets the OS share sheet (`navigator.share`) because that's where the
 * user's real chat list lives, and it costs zero extra UI. Desktop, and any
 * browser without the API, gets our own dialog with the channels that matter
 * here: WhatsApp first, then X, Facebook, Telegram, plus copy-link which is
 * how a surprising number of links actually move.
 *
 * Every outbound link is UTM-tagged per channel, so `useUtmCapture` can
 * attribute return traffic to the share that caused it.
 */
import * as React from "react";
import { toast } from "sonner";
import { Icon } from "~/components/brand/icon";
import type { IconDef } from "~/components/brand/icons";
import {
  CopyIcon,
  FacebookIcon,
  XIcon,
  ShareIcon,
  TelegramIcon,
  WhatsappIcon,
} from "~/components/brand/icons";

import { analytics } from "~/lib/analytics";
import {
  buildShareLink,
  SHARE_TARGETS,
  taggedShareUrl,
  type SharePayload,
} from "~/lib/share";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

const TARGET_ICONS: Record<string, IconDef> = {
  whatsapp: WhatsappIcon,
  twitter: XIcon,
  facebook: FacebookIcon,
  telegram: TelegramIcon,
};

export type ShareButtonProps = {
  payload: SharePayload;
  /** Where this button lives, e.g. "quiz_result". Rides on the analytics. */
  surface: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
};

export function ShareButton({
  payload,
  surface,
  label = "Share",
  variant = "paper",
  size = "lg",
  className,
}: ShareButtonProps) {
  const [open, setOpen] = React.useState(false);
  const link = React.useMemo(() => buildShareLink(payload), [payload]);

  async function handleClick() {
    analytics.shareOpened({ kind: link.kind, surface });

    // Native sheet where it exists. `share()` must be called straight off the
    // click to keep the user-gesture, so no awaits before this point.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: link.title,
          text: link.text,
          url: taggedShareUrl(link.url, "native"),
        });
        analytics.shareCompleted({ kind: link.kind, channel: "native" });
        return;
      } catch (err) {
        // The user backing out of the OS sheet is an AbortError, not a
        // failure: respect the decision and don't second-guess it with our
        // own dialog. Anything else means the API let us down, so fall back.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    setOpen(true);
  }

  async function copyLink() {
    const url = taggedShareUrl(link.url, "copy");
    try {
      await navigator.clipboard.writeText(url);
      analytics.shareCompleted({ kind: link.kind, channel: "copy" });
      toast.success("Link copied");
      setOpen(false);
    } catch {
      toast.error("Couldn't copy the link", {
        description: "Long-press the address bar to copy it instead.",
      });
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        <Icon icon={ShareIcon} size={16} />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share it</DialogTitle>
            <DialogDescription>{link.title}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-2.5">
              {SHARE_TARGETS.map((t) => (
                <a
                  key={t.id}
                  href={t.href!({
                    ...link,
                    url: taggedShareUrl(link.url, t.id),
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    analytics.shareCompleted({
                      kind: link.kind,
                      channel: t.id,
                    });
                    setOpen(false);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2.5 rounded-soft border border-ink/25 bg-surface px-4 py-3",
                    "font-display text-[13px] font-bold uppercase tracking-wide text-ink",
                    "outline-none transition-colors hover:border-ink/60 hover:bg-paper-2",
                    "focus-visible:border-ink/60 focus-visible:bg-paper-2 active:translate-y-px",
                  )}
                >
                  <Icon
                    icon={TARGET_ICONS[t.id]}
                    size={18}
                  />
                  {t.label}
                </a>
              ))}
            </div>
            <Button
              variant="ink"
              size="lg"
              onClick={copyLink}
              className="mt-2.5 w-full"
            >
              <Icon
                icon={CopyIcon}
                size={16}
              />
              Copy link
            </Button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
