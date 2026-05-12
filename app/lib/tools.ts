/**
 * Internal authoring tools — the `/tools` dashboard. DriveRush ships its
 * learning content hardcoded (no database), so these are small in-browser
 * utilities for *producing* that content. The sidebar in
 * `app/routes/tools/_layout.tsx` and the `/tools` landing both render this list.
 */
import type { IconSvgElement } from "@hugeicons/react";
import {
  ImageCropFreeIcons,
  Image02FreeIcons,
  VolumeHighFreeIcons,
} from "@hugeicons/core-free-icons";

export type ToolStatus = "live" | "soon";

export type Tool = {
  /** URL slug under `/tools`, e.g. `"image-coords"`. */
  slug: string;
  /** Full route path, e.g. `"/tools/image-coords"`. */
  path: string;
  title: string;
  /** One-line description for the sidebar / landing card. */
  blurb: string;
  icon: IconSvgElement;
  status: ToolStatus;
};

export const TOOLS: Tool[] = [
  {
    slug: "image-coords",
    path: "/tools/image-coords",
    title: "Image coordinates",
    blurb:
      "Map focus regions on the road-sign sheet — drag a crop box, set the name & metadata, preview the zoom-and-blur playback, then save to app/data/road-signs-pelican.json (the trainer's source of truth).",
    icon: ImageCropFreeIcons,
    status: "live",
  },
  {
    slug: "sprite-slicer",
    path: "/tools/sprite-slicer",
    title: "Sprite slicer",
    blurb:
      "Cut a sign sheet into individual PNG/SVG assets with consistent padding. Planned.",
    icon: Image02FreeIcons,
    status: "soon",
  },
  {
    slug: "audio-namer",
    path: "/tools/audio-namer",
    title: "Audio namer",
    blurb:
      "Record or attach the spoken name for each sign and batch-export the audio map. Planned.",
    icon: VolumeHighFreeIcons,
    status: "soon",
  },
];

/** Look up a tool by slug. */
export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
