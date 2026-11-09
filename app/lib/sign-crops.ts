/**
 * Tight crops of each sign's artwork on the Pelican chart, for thumbnails.
 *
 * The trainer's regions cover the whole sign card, code key included, so the
 * camera frames what the learner sees printed. Thumbnails want the sign alone,
 * without the key, so they crop from these instead. Both were measured from
 * the chart SVG and need re-measuring if the chart is redrawn.
 */
import crops from "~/data/road-sign-crops.json";
import type { RegionBox } from "~/lib/image-focus";

const CROPS = crops as Record<string, RegionBox>;

/** The sign's exact edges, falling back to its region when it has no crop. */
export function signCrop(region: RegionBox & { code?: string }): RegionBox {
  return (region.code && CROPS[region.code]) || region;
}
