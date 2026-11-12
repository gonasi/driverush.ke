/**
 * The result picture: a 4:5 image of a finished run that a learner can post.
 *
 * A link is enough for a WhatsApp chat, where the preview card does the work.
 * It is not enough anywhere a post is a picture: Instagram takes no links at
 * all, and WhatsApp Status and Facebook stories show a bare link as grey text.
 * So an achievement also comes as an image, handed to the phone's share sheet
 * as a file (`navigator.share({ files })`), which is the one door a web page
 * has into those apps.
 *
 * Drawn on a canvas in the browser rather than by a package or a server:
 * it is one card, it costs nothing to run, and it works on a cheap phone with
 * no renderer to wake up. 1080×1350 because 4:5 is the tallest shape the
 * Instagram feed keeps whole, and it sits well in a status or a chat too.
 *
 * The site address is printed on the picture itself, because apps that take
 * the image often drop the caption that carried the link.
 */
import type { SharePayload } from "./share";

export const SHARE_PICTURE_WIDTH = 1080;
export const SHARE_PICTURE_HEIGHT = 1350;
export const SHARE_PICTURE_FILENAME = "driverush-result.jpg";

export type ScoredPayload = Exclude<SharePayload, { kind: "page" }>;

/** A rectangle cut out of `src`, in that image's own pixels. */
type ArtTile = { x: number; y: number; w: number; h: number };

export type SharePictureSpec = {
  /** Amber stamp, top right: which trainer this was. */
  stamp: string;
  /** The big figure, e.g. "4/5". */
  score: string;
  /** What the figure counts, set in capitals under it. */
  label: string;
  /** The line that turns a boast into an invitation. */
  challenge: string;
  /** Artwork: tiles cut from an image we already ship. */
  art: { src: string; tiles: ArtTile[]; framed: boolean };
};

/**
 * Artwork comes out of files the site already serves (the board poster and
 * the social cards), so the picture adds nothing to download. The tile
 * rectangles are where the pictures sit inside those 1200×630 cards; keep
 * them in step with `/tools/og` if a card is redesigned.
 */
const ART: Record<ScoredPayload["kind"], SharePictureSpec["art"]> = {
  board: {
    src: "/assets/board/poster.jpg",
    tiles: [{ x: 0, y: 0, w: 1200, h: 630 }],
    framed: true,
  },
  pelican: {
    src: "/og/pelican.png",
    tiles: [56, 268, 480].map((x) => ({ x, y: 231, w: 196, h: 196 })),
    framed: false,
  },
  signs3d: {
    src: "/og/signs3d.png",
    tiles: [470, 690, 910].map((x) => ({ x, y: 155, w: 204, h: 348 })),
    framed: true,
  },
};

/** What the picture says. Pure, so the wording can be tested without a canvas. */
export function sharePictureSpec(payload: ScoredPayload): SharePictureSpec {
  const { kind, total, firstTry } = payload;
  const art = ART[kind];

  if (kind === "board") {
    const base = {
      stamp: "Model Town Board",
      challenge: "Can you drive it clean?",
      art,
    };
    if (total === 1 && firstTry === 1)
      return { ...base, score: "Clean", label: "Board task, first try" };
    if (firstTry === 0)
      return {
        ...base,
        score: String(total),
        label: total === 1 ? "Board task driven" : "Board tasks driven",
      };
    return {
      ...base,
      score: `${firstTry}/${total}`,
      label: "Board tasks clean on the first try",
    };
  }

  return {
    stamp: kind === "pelican" ? "Pelican chart" : "3D signs",
    score: `${firstTry}/${total}`,
    label:
      total === 1
        ? "Kenyan road sign on the first try"
        : "Kenyan road signs on the first try",
    challenge: "How many can you name cold?",
    art,
  };
}

// ---- drawing --------------------------------------------------------------

/**
 * Fixed colours, not theme tokens: a posted picture has no light or dark mode,
 * and the dark card is the one that holds up in a feed.
 */
const C = {
  bg: "#0e1014",
  paper: "#f2ede3",
  muted: "#a8a399",
  rush: "#ff3d4f",
  amber: "#e6a100",
  black: "#0e1014",
  green: "#1e8449",
  gold: "#d4a017",
  flagRed: "#e11d2e",
};

const DISPLAY = '"Sora", "Montserrat", system-ui, sans-serif';
const SERIF = '"Libre Baskerville", Georgia, serif';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

const PAD = 72;
const INNER = SHARE_PICTURE_WIDTH - PAD * 2;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    // No artwork is a plainer picture, not a failed share.
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Canvas only uses a web font once the page has it; ask, but never hang. */
async function fontsReady(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const wanted = [
    `800 100px ${DISPLAY}`,
    `italic 400 60px ${SERIF}`,
    `700 24px ${MONO}`,
  ];
  await Promise.race([
    Promise.all(wanted.map((f) => document.fonts.load(f))).catch(() => {}),
    new Promise((r) => setTimeout(r, 1500)),
  ]);
}

function spacing(ctx: CanvasRenderingContext2D, value: string) {
  // Newer browsers only; older ones draw the same words a little looser.
  (ctx as unknown as { letterSpacing: string }).letterSpacing = value;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawArt(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  art: SharePictureSpec["art"],
  top: number,
  height: number,
) {
  const gap = 24;
  const n = art.tiles.length;
  const ratio = art.tiles[0].h / art.tiles[0].w;
  let w = (INNER - gap * (n - 1)) / n;
  let h = w * ratio;
  if (h > height) {
    h = height;
    w = h / ratio;
  }
  const rowWidth = w * n + gap * (n - 1);
  let x = PAD + (INNER - rowWidth) / 2;
  const y = top + (height - h) / 2;
  for (const t of art.tiles) {
    ctx.drawImage(img, t.x, t.y, t.w, t.h, x, y, w, h);
    if (art.framed) {
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    }
    x += w + gap;
  }
}

/** Draw the picture for a finished run and hand it back as a JPEG file. */
export async function renderSharePicture(
  payload: ScoredPayload,
): Promise<File> {
  const spec = sharePictureSpec(payload);
  const [img] = await Promise.all([loadImage(spec.art.src), fontsReady()]);

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_PICTURE_WIDTH;
  canvas.height = SHARE_PICTURE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas");

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "alphabetic";

  // Wordmark, top left.
  ctx.font = `800 40px ${DISPLAY}`;
  spacing(ctx, "-1px");
  ctx.fillStyle = C.paper;
  ctx.fillText("DRIVERUSH", PAD, 116);
  const markWidth = ctx.measureText("DRIVERUSH").width;
  ctx.fillStyle = C.rush;
  ctx.fillText(".KE", PAD + markWidth, 116);

  // Stamp, top right.
  ctx.font = `700 22px ${MONO}`;
  spacing(ctx, "3px");
  const stamp = spec.stamp.toUpperCase();
  const stampWidth = ctx.measureText(stamp).width + 36;
  ctx.fillStyle = C.amber;
  ctx.fillRect(canvas.width - PAD - stampWidth, 76, stampWidth, 52);
  ctx.fillStyle = C.black;
  ctx.fillText(stamp, canvas.width - PAD - stampWidth + 18, 110);

  if (img) drawArt(ctx, img, spec.art, 180, 500);

  // The figure, shrunk until it fits the width.
  spacing(ctx, "-6px");
  let size = 210;
  const score = spec.score.toUpperCase();
  do {
    ctx.font = `800 ${size}px ${DISPLAY}`;
    size -= 10;
  } while (ctx.measureText(score).width > INNER && size > 80);
  ctx.fillStyle = C.paper;
  ctx.fillText(score, PAD - 6, 900);

  // What it counts.
  ctx.font = `800 44px ${DISPLAY}`;
  spacing(ctx, "-1px");
  let y = 968;
  for (const line of wrap(ctx, spec.label.toUpperCase(), INNER)) {
    ctx.fillText(line, PAD, y);
    y += 52;
  }

  // The invitation.
  ctx.font = `italic 400 54px ${SERIF}`;
  spacing(ctx, "0px");
  ctx.fillStyle = C.rush;
  ctx.fillText(spec.challenge, PAD, y + 44);

  // Where to go, printed on the picture in case the caption is dropped.
  ctx.font = `800 34px ${DISPLAY}`;
  const where = "driverush.ke";
  const pillWidth = ctx.measureText(where).width + 56;
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.roundRect(PAD, 1196, pillWidth, 72, 10);
  ctx.fill();
  ctx.fillStyle = C.black;
  ctx.fillText(where, PAD + 28, 1244);
  ctx.font = `500 28px "Montserrat", system-ui, sans-serif`;
  ctx.fillStyle = C.muted;
  ctx.fillText("Free practice for the NTSA test", PAD + pillWidth + 28, 1242);

  // Kenyan flag rule, as on the social cards.
  const seg = canvas.width / 4;
  [C.black, C.flagRed, C.green, C.gold].forEach((colour, i) => {
    ctx.fillStyle = colour;
    ctx.fillRect(seg * i, canvas.height - 16, seg, 16);
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Could not encode the picture");
  return new File([blob], SHARE_PICTURE_FILENAME, { type: "image/jpeg" });
}
