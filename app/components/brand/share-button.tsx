/**
 * The one share affordance. Drop `<ShareButton payload={…} />` next to any
 * result screen or page header.
 *
 * A finished run opens our own sheet, led by the result picture
 * (`~/lib/share-picture`): one tap hands that image and the link to the
 * phone's share sheet, which is how it gets into Instagram, a WhatsApp Status
 * or a Facebook story. Under it sit the plain link buttons, WhatsApp first,
 * for a chat where the preview card does the work, plus copy-link.
 *
 * A page (a blog post, the sign chart) has no result to picture, so on a
 * phone it goes straight to the OS share sheet with its link, and elsewhere
 * to the same sheet without the picture.
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
  DownloadIcon,
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
import { renderSharePicture } from "~/lib/share-picture";
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
  const scored = payload.kind === "page" ? null : payload;
  // Keyed on the numbers, not the object: callers pass a fresh payload on
  // every render, and the picture should be drawn once per result.
  const pictureKey = scored
    ? `${scored.kind}:${scored.total}:${scored.firstTry}`
    : null;

  // The picture is drawn when the sheet opens, not on the tap that shares it:
  // `navigator.share` has to run straight off a click, with nothing awaited.
  const [picture, setPicture] = React.useState<{
    file: File;
    url: string;
  } | null>(null);
  React.useEffect(() => {
    if (!open || !scored) return;
    let cancelled = false;
    let url: string | undefined;
    renderSharePicture(scored)
      .then((file) => {
        if (cancelled) return;
        url = URL.createObjectURL(file);
        setPicture({ file, url });
      })
      // No picture leaves the link buttons, which is the sheet we had before.
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setPicture(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pictureKey]);

  const canSendPicture =
    picture != null &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [picture.file] });

  async function sharePicture() {
    if (!picture) return;
    try {
      await navigator.share({
        files: [picture.file],
        // The link rides in the text: with a file attached, several apps
        // keep the caption and drop a separate `url`.
        text: `${link.title}\n${taggedShareUrl(link.url, "native")}`,
      });
      analytics.shareCompleted({ kind: link.kind, channel: "picture" });
      setOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Couldn't open sharing", {
        description: "Save the picture and post it from your gallery.",
      });
    }
  }

  function savePicture() {
    if (!picture) return;
    const a = document.createElement("a");
    a.href = picture.url;
    a.download = picture.file.name;
    a.click();
    analytics.shareCompleted({ kind: link.kind, channel: "picture_save" });
    toast.success("Picture saved", {
      description: "Post it to Instagram or your status from your gallery.",
    });
  }

  async function handleClick() {
    analytics.shareOpened({ kind: link.kind, surface });

    // A page has no picture: the native sheet, where it exists, is all it
    // needs. `share()` must be called straight off the click to keep the
    // user-gesture, so no awaits before this point.
    if (!scored && typeof navigator !== "undefined" && navigator.share) {
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
            {scored && (
              <div className="mb-4 mt-1 grid gap-2.5">
                <div className="mx-auto aspect-[4/5] h-[min(30dvh,250px)] overflow-hidden rounded-soft bg-ink/10">
                  {picture && (
                    <img
                      src={picture.url}
                      alt={`Your result picture: ${link.title}`}
                      className="block size-full"
                    />
                  )}
                </div>
                {canSendPicture ? (
                  <Button variant="rush" size="lg" onClick={sharePicture}>
                    <Icon icon={ShareIcon} size={16} />
                    Share picture
                  </Button>
                ) : (
                  <Button
                    variant="rush"
                    size="lg"
                    onClick={savePicture}
                    disabled={!picture}
                  >
                    <Icon icon={DownloadIcon} size={16} />
                    Save picture
                  </Button>
                )}
                <p className="m-0 text-center text-[12.5px] leading-snug text-ink-3">
                  For Instagram, WhatsApp Status and Facebook stories.
                  {canSendPicture && (
                    <>
                      {" "}
                      <button
                        type="button"
                        onClick={savePicture}
                        className="font-semibold text-ink underline underline-offset-2"
                      >
                        Save it instead
                      </button>
                    </>
                  )}
                </p>
                <p className="m-0 mt-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                  Or send the link
                </p>
              </div>
            )}
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
                  <Icon icon={TARGET_ICONS[t.id]} size={18} />
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
              <Icon icon={CopyIcon} size={16} />
              Copy link
            </Button>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
