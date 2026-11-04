/**
 * Who DriveRush is built with. Pelican Signs is our partner: the chart and the
 * 3D models both carry their mark. The NTSA is a source, not a partner, so it's
 * credited separately and must never be described as one.
 */

export const PELICAN = {
  name: "Pelican Signs",
  /** White field, so it renders on a white band regardless of theme. */
  logo: "/assets/partners/pelican-logo.jpg",
  logoWidth: 270,
  logoHeight: 163,
} as const;

export const SIGN_SOURCE = {
  name: "NTSA Highway Code",
  href: "https://www.ntsa.go.ke",
} as const;
