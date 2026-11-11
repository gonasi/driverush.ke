/**
 * DriveRush icon set (draft 2, "sign-grade"). Replaces Hugeicons.
 *
 * Two tiers:
 * - These are the quiet tier: one-colour controls drawn on a 24 grid, a
 *   rounded line plus an optional faint fill layer (`b`) for depth. Render them
 *   with `<Icon icon={…} />`. They follow `currentColor`.
 * - The loud tier is `<SignIcon name="warning" />` (art/sign-icon.tsx): tiny
 *   real signs in full colour, kept for status and anything about the road.
 *   Defs that have a sign twin carry its name in `sign`, so a render site can
 *   opt into the colour version without a second lookup.
 *
 * Path keys: `s` stroked line, `b` back fill at low opacity, `f` solid fill,
 * `brand` a platform's own filled mark (from Simple Icons, CC0).
 */
import type { SignName } from "~/components/brand/art/sign-glyphs";

export type IconDef = {
  s?: string;
  b?: string;
  f?: string;
  brand?: string;
  sign?: SignName;
};

/** A circle as one path, so icons stay a handful of `d` strings. */
function circle(x: number, y: number, r: number) {
  return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
}

// Places
export const HomeIcon: IconDef = {
  s: "M4 11l8-7 8 7v9h-5.5v-6h-5v6H4z",
};
export const BookIcon: IconDef = {
  s: "M5 4h11l3 3v13H5zM9 10h6M9 14h6",
};

// Move
export const ArrowRightIcon: IconDef = {
  s: "M4 12h15M13.5 6.5L19 12l-5.5 5.5",
};
export const ArrowLeftIcon: IconDef = { s: "M20 12H5M10.5 6.5L5 12l5.5 5.5" };
export const ArrowOutIcon: IconDef = { s: "M7 17L17 7M9 7h8v8" };
export const GoIcon: IconDef = {
  s: circle(12, 12, 9) + "M8 12h7.5M12.5 9l3 3-3 3",
  b: circle(12, 12, 9),
  sign: "mandatory",
};
export const ChevronRightIcon: IconDef = { s: "M9.5 5.5L16 12l-6.5 6.5" };
export const ChevronLeftIcon: IconDef = { s: "M14.5 5.5L8 12l6.5 6.5" };
export const ChevronUpIcon: IconDef = { s: "M5.5 14.5L12 8l6.5 6.5" };
export const ChevronDownIcon: IconDef = { s: "M5.5 9.5L12 16l6.5-6.5" };
export const MenuIcon: IconDef = { s: "M4 7h16M4 12h16M4 17h10" };

// Do
export const CheckIcon: IconDef = { s: "M5 12.5l4.5 4.5L19 7" };
export const CloseIcon: IconDef = { s: "M6 6l12 12M18 6L6 18" };
export const PlusIcon: IconDef = { s: "M12 5v14M5 12h14" };
export const MinusIcon: IconDef = { s: "M5 12h14" };
export const StarIcon: IconDef = {
  f: "M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9L3.4 9.5l6-.8z",
};
export const RefreshIcon: IconDef = {
  s: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3M18 3.5v4h-4",
};
export const RotateIcon: IconDef = {
  s: "M18.5 13a6.5 6.5 0 1 1-6.5-7.5h2.5M12 2.5l3 3-3 3",
};
export const ShuffleIcon: IconDef = {
  s: "M4 7.5h3.5l9 9H20M4 16.5h3.5l2.5-2.5M14 10l2.5-2.5H20M17.5 5l2.5 2.5-2.5 2.5M17.5 14l2.5 2.5-2.5 2.5",
};
export const CopyIcon: IconDef = {
  s: "M9 9h10.5v10.5H9zM15 9V4.5H4.5V15H9",
  b: "M9 9h10.5v10.5H9z",
};
export const LinkIcon: IconDef = {
  s: "M10 14l4-4M8.5 11.5L6.3 13.7a3.5 3.5 0 0 0 5 5l2.2-2.2M15.5 12.5l2.2-2.2a3.5 3.5 0 0 0-5-5L10.5 7.5",
};
export const ShareIcon: IconDef = {
  s: "M12 3.5V15M7.5 8L12 3.5 16.5 8M5.5 12v8.5h13V12",
  b: "M5.5 12v8.5h13V12z",
};
export const DownloadIcon: IconDef = {
  s: "M12 3.5V15M7 10.5l5 5 5-5M4.5 20h15",
};
export const SaveIcon: IconDef = {
  s: "M4.5 4.5h12l3 3v12h-15zM8 4.5v4.5h7V4.5M7.5 19.5V14h9v5.5",
  b: "M4.5 4.5h12l3 3v12h-15z",
};
export const EditIcon: IconDef = {
  s: "M15 4.5l4.5 4.5L9 19.5H4.5V15zM12.5 7l4.5 4.5",
  b: "M15 4.5l4.5 4.5L9 19.5H4.5V15z",
};
export const DeleteIcon: IconDef = {
  s: "M4.5 6.5h15M9 6.5v-3h6v3M6.5 6.5l1 14h9l1-14M10 10.5v6M14 10.5v6",
  b: "M6.5 6.5l1 14h9l1-14z",
};
export const DragIcon: IconDef = {
  f:
    circle(9, 6, 1.4) +
    circle(15, 6, 1.4) +
    circle(9, 12, 1.4) +
    circle(15, 12, 1.4) +
    circle(9, 18, 1.4) +
    circle(15, 18, 1.4),
};
export const CropIcon: IconDef = { s: "M6.5 2.5v15h15M2.5 6.5h15v15" };
export const ImageIcon: IconDef = {
  s: "M3.5 4.5h17v15h-17zM3.5 16l5-5 4 4 2.5-2.5 5.5 5.5",
  b: "M3.5 4.5h17v15h-17z",
  f: circle(15.8, 8.6, 1.4),
};
export const FocusIcon: IconDef = {
  s: "M4 8.5V4h4.5M15.5 4H20v4.5M20 15.5V20h-4.5M8.5 20H4v-4.5",
  b: circle(12, 12, 3.2),
  f: circle(12, 12, 1.3),
};
export const GridIcon: IconDef = {
  s: "M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z",
  b: "M4.5 4.5h6v6h-6z",
};
export const SettingsIcon: IconDef = {
  s:
    "M4 7h3M11 7h9M4 12h9M17 12h3M4 17h5M13 17h7" +
    circle(9, 7, 2) +
    circle(15, 12, 2) +
    circle(11, 17, 2),
  b: circle(9, 7, 2) + circle(15, 12, 2) + circle(11, 17, 2),
};
export const MailIcon: IconDef = {
  s: "M3.5 5.5h17v13h-17zM4 6.5l8 6.5 8-6.5",
  b: "M3.5 5.5h17v13h-17z",
};
export const PhoneIcon: IconDef = {
  s: "M7.5 2.5h9v19h-9zM10.5 18.5h3",
  b: "M7.5 2.5h9v19h-9z",
};

// Play
export const PlayIcon: IconDef = {
  s: "M7 4.8L19 12 7 19.2z",
  b: "M7 4.8L19 12 7 19.2z",
};
export const PauseIcon: IconDef = {
  s: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  b: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
};
export const PlayRoundIcon: IconDef = {
  s: circle(12, 12, 9.5) + "M10 8.3l5.5 3.7-5.5 3.7z",
  b: circle(12, 12, 9.5),
};
export const SoundIcon: IconDef = {
  s: "M4 9.5h3.5L13 5v14l-5.5-4.5H4zM16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11",
  b: "M4 9.5h3.5L13 5v14l-5.5-4.5H4z",
};
export const SunIcon: IconDef = {
  s:
    circle(12, 12, 4) +
    "M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  b: circle(12, 12, 4),
};
export const MoonIcon: IconDef = {
  s: "M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z",
  b: "M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z",
};

// Status (sign-shaped, each with a colour twin)
export const WarningIcon: IconDef = {
  s: "M12 3.5L21.5 20h-19zM12 10v4M12 17h.01",
  b: "M12 3.5L21.5 20h-19z",
  sign: "warning",
};
export const StopIcon: IconDef = {
  s: "M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3zM12 7.5v5.5M12 16.5h.01",
  b: "M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z",
  sign: "stop",
};
export const InfoIcon: IconDef = {
  s: "M4.5 3.5h15v17h-15zM12 11v5.5M12 7.5h.01",
  b: "M4.5 3.5h15v17h-15z",
  sign: "info",
};
export const NoIcon: IconDef = {
  s: circle(12, 12, 9) + "M5.6 5.6l12.8 12.8",
  b: circle(12, 12, 9),
  sign: "no",
};
export const DoneIcon: IconDef = {
  s: circle(12, 12, 9) + "M8 12.3l2.8 2.8L16.2 9.6",
  b: circle(12, 12, 9),
  sign: "done",
};
export const FinishIcon: IconDef = {
  s: "M5.5 21.5V3M5.5 4h14v9.5h-14",
  f: "M5.5 4h4.7v4.75H5.5zM14.8 4h4.7v4.75h-4.7zM10.2 8.75h4.6v4.75h-4.6z",
  sign: "finish",
};

// Road (ours alone)
export const TrafficLightIcon: IconDef = {
  s:
    "M7 2.5h10v19H7z" +
    circle(12, 7, 1.8) +
    circle(12, 12, 1.8) +
    circle(12, 17, 1.8),
  b: "M7 2.5h10v19H7z",
  sign: "traffic-light",
};
export const PelicanIcon: IconDef = {
  s:
    circle(8, 6.5, 2.5) +
    "M10.4 5.8L21 8.2M10.2 8Q15.5 13.5 21 8.2M6.2 8.3C4.8 10.8 5.4 13.2 8 14.5H17C17 18.2 14 21 10 21C6.2 21 3.5 18.6 3.5 15.6",
  b: "M10.4 5.8L21 8.2Q15.5 13.5 10.2 8z",
  f: circle(8, 6.2, 0.8),
  sign: "pelican",
};
export const Sign3DIcon: IconDef = {
  s: "M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5zM3.5 7.25L12 12l8.5-4.75M12 12v9.5",
  b: "M12 2.5l8.5 4.75L12 12 3.5 7.25z",
  sign: "sign-3d",
};
export const RoadIcon: IconDef = {
  s: "M8.5 3L3.5 21M15.5 3l5 18M12 4v2.5M12 10v3M12 16.5v4",
  b: "M8.5 3h7l5 18h-17z",
  sign: "road",
};
export const PinIcon: IconDef = {
  s: "M12 21.5s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" + circle(12, 9.5, 2.5),
  b: "M12 21.5s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z",
  sign: "info",
};
export const LearnerIcon: IconDef = {
  s: "M4 4h16v16H4zM9.5 7.5v9H15",
  b: "M4 4h16v16H4z",
  sign: "learner",
};

// Platforms keep their own marks (Simple Icons, CC0).
export const WhatsappIcon: IconDef = {
  brand:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
};
export const TelegramIcon: IconDef = {
  brand:
    "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
};
export const XIcon: IconDef = {
  brand:
    "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
};
export const FacebookIcon: IconDef = {
  brand:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
};
