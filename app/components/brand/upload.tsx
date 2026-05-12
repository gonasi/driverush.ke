import * as React from "react";

import { cn } from "~/lib/utils";

type UploadZoneProps = React.ComponentProps<"div"> & {
  /** Big glyph in the stamped icon block. Default "↑". */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** Mono caps constraint line, e.g. "PNG · JPG · PDF · MAX 8 MB". */
  sub?: React.ReactNode;
};

/** Dashed drop-target — stamped icon, title, constraint line. Presentational. */
function UploadZone({
  className,
  icon = "↑",
  title,
  sub,
  ...props
}: UploadZoneProps) {
  return (
    <div
      data-slot="upload-zone"
      className={cn(
        "border-2 border-dashed border-ink bg-paper-3 p-[26px] text-center dark:bg-paper-2",
        className,
      )}
      {...props}
    >
      <span className="mb-3 inline-flex size-12 items-center justify-center border-2 border-ink bg-surface font-display text-[22px] font-extrabold">
        {icon}
      </span>
      <div className="font-display text-sm font-extrabold uppercase tracking-wider">
        {title}
      </div>
      {sub != null && (
        <div className="mt-1.5 font-mono text-xs tracking-wide text-ink-3">
          {sub}
        </div>
      )}
    </div>
  );
}

type FileExtTone = "rush" | "blue" | "magenta" | "green" | "ink";

const EXT_BG: Record<FileExtTone, string> = {
  rush: "bg-rush text-white",
  blue: "bg-plate-blue text-plate-blue-foreground",
  magenta: "bg-magenta text-magenta-foreground",
  green: "bg-kenya-green text-kenya-green-foreground",
  ink: "bg-ink text-paper",
};

type FileRowProps = React.ComponentProps<"div"> & {
  /** Short extension label shown in the badge, e.g. "PDF". */
  ext: React.ReactNode;
  /** Badge colour; pick to match the file kind. Default "rush". */
  extTone?: FileExtTone;
  name: React.ReactNode;
  /** Size / status line, e.g. "2.4 MB · uploaded May 9". */
  size?: React.ReactNode;
  /** Trailing status pill — typically a <Badge>. */
  status?: React.ReactNode;
  /** Trailing action — typically a <Button> or <button>. */
  action?: React.ReactNode;
};

/** A single uploaded-file row — extension badge, name/size, status, action. */
function FileRow({
  className,
  ext,
  extTone = "rush",
  name,
  size,
  status,
  action,
  ...props
}: FileRowProps) {
  return (
    <div
      data-slot="file-row"
      className={cn(
        "grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 border-2 border-ink bg-surface px-3.5 py-2.5 font-mono text-xs",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex h-11 w-9 items-center justify-center border-2 border-ink font-display text-[9px] font-extrabold tracking-wide",
          EXT_BG[extTone],
        )}
      >
        {ext}
      </span>
      <div className="min-w-0">
        <div className="truncate font-display text-xs font-bold uppercase tracking-wide">
          {name}
        </div>
        {size != null && (
          <div className="truncate text-[11px] text-ink-3">{size}</div>
        )}
      </div>
      <div>{status}</div>
      <div>{action}</div>
    </div>
  );
}

export { UploadZone, FileRow };
export type { FileExtTone };
