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
- **Made by:** the DriveRush team, in-house. Files: `public/assets/road-signs/road-signs.v2.svg`, `public/assets/road-signs/models/`.
- **Contractors:** _to fill in: anyone paid to draw or model these, and where the assignment of rights is kept_
- Do not credit Pelican Signs as the author of this artwork.
- **Missing:** the 3D model for M.5 (Pass to the left). `M_5.glb` was an exact copy of the M.7 bicycle, so it was deleted and M.5 is out of the 3D trainer until it's re-exported. Add it back in `app/data/road-signs-3d.json` or `/tools/sign-3d`. The chart trainer still has M.5.

## Model Town Board
- **Made by:** the DriveRush team's own code. Nothing on the board is downloaded or bought.
- **The board** (roads, markings, kerbs, the parking zone, the stopping box) is drawn by `app/lib/board/full-board.ts`. Its layout follows the boards Kenyan driving schools paint, and its proportions were measured off a reference drawing of one. No artwork was copied from either.
- **The cars** are modelled in code in `app/components/board/car-model.ts`. The table, its wood and the floor are drawn in code in `app/components/board/board-table.tsx`.
- **Removed on 2026-11-11:** the cars and trees from Kenney's "Racing Pack" (CC0), used by the earlier 2D game. They are no longer in the repository.

## Voice clips
- **Made with:** ElevenLabs, on a paid plan. The clips in `public/assets/road-signs/sounds/` carry ElevenLabs content tags.
- **Receipt:** _to fill in: where the proof of the paid plan is kept_
- **File names:** some clip names don't match their sign's code, because the chart's codes are one off from the source list. M.7 plays `M.6.mp3`, M.8 plays `M.7.mp3`, M.9 plays `M.8.mp3`, and P.16 and P.17 play each other's. `audioSrc` in the data files is the source of truth. `P.38.mp3` is unused.

## Sign notes
- **Source:** written in DriveRush's own words on 2026-11-04, from NTSA / Highway Code material. Same instructions, no new facts.
- **Stored in:** `app/data/road-signs-pelican.json` and `app/data/road-signs-3d.json`. Keep the two identical by sign code.

## If Pelican's permission ever ends
1. Remove `SignCredit` and the footer line that says the name and logo are used with permission.
2. Rename the trainer in the copy, and move `/road-signs/pelican` to a new URL with a 301.
3. Remove the logo from the 3D models: it's one material per model (`lambert8_Pelican_Logo*`), on 78 of 84 models, about 4% of the geometry.
4. Remove the Hi-Way Signs banner and Pelican logo from the chart: 31 elements around x 826-1077, y 463-673. No sign overlaps them.
5. Remove "Pelican" from the SEO keywords in `app/lib/site.ts`, the social cards and the blog posts, then regenerate the cards with `npm run build:og`.
