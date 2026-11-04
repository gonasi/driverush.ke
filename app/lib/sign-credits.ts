/**
 * Whose name is on the signs, and where the rules come from.
 *
 * Pelican Signs agreed to DriveRush using their name and logo, in return for the
 * free promotion. No money changes hands, so it isn't a partnership: never call
 * it one. The chart and 3D models were made in-house, so never credit Pelican as
 * their author either. See docs/asset-rights.md.
 *
 * The NTSA is only a source. DriveRush is not affiliated with it.
 */

export const SIGN_BRAND = {
  name: "Pelican Signs",
  /** White field, so it sits on a white band in both themes. */
  logo: "/assets/pelican-signs-logo.jpg",
  logoWidth: 270,
  logoHeight: 163,
} as const;

export const SIGN_SOURCE = {
  name: "NTSA Highway Code",
  href: "https://www.ntsa.go.ke",
} as const;
