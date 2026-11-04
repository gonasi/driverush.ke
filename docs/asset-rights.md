# Asset rights

Who made what DriveRush uses, and what we're allowed to do with it. Keep this up
to date when an asset or an agreement changes. No personal contact details here.

## Pelican Signs name and logo
- **Position:** Pelican Signs agreed to DriveRush using their name and logo. They get free promotion and we get a known brand. No money changes hands, so it is not a partnership and must not be described as one.
- **Used in:** the "Pelican chart" trainer name and URL, the credit line, and the logos on the chart and 3D sign posts.
- **Agreed on:** _to fill in: date_
- **Agreed by:** _to fill in: role at Pelican Signs_
- **In writing:** _to fill in: where the confirmation is kept_

## Chart and 3D models
- **Made by:** the DriveRush team, in-house. Files: `public/assets/road-signs/road-signs.svg`, `public/assets/road-signs/models/`.
- **Contractors:** _to fill in: anyone paid to draw or model these, and where the assignment of rights is kept_
- Do not credit Pelican Signs as the author of this artwork.

## Voice clips
- **Made with:** ElevenLabs, on a paid plan. The clips in `public/assets/road-signs/sounds/` carry ElevenLabs content tags.
- **Receipt:** _to fill in: where the proof of the paid plan is kept_

## Sign notes
- **Source:** written in DriveRush's own words on 2026-11-04, from NTSA / Highway Code material. Same instructions, no new facts.
- **Stored in:** `app/data/road-signs-pelican.json` and `app/data/road-signs-3d.json`. Keep the two identical by sign code.

## If Pelican's permission ever ends
1. Remove `SignCredit` and the footer line that says the name and logo are used with permission.
2. Rename the trainer in the copy, and move `/road-signs/pelican` to a new URL with a 301.
3. Remove the logo from the 3D models: it's one material per model (`lambert8_Pelican_Logo*`), on 78 of 84 models, about 4% of the geometry.
4. Remove the Hi-Way Signs banner and Pelican logo from the chart: 31 elements around x 826-1077, y 463-673. No sign overlaps them.
5. Remove "Pelican" from the SEO keywords in `app/lib/site.ts`, the social cards and the blog posts, then regenerate the cards with `npm run build:og`.
