# Promo videos

Vertical videos (1080x1920) for social media, recorded from the real app and made to look like a learner's own screen recording: full screen, typed captions, hard cuts, no brand frame. Nothing here is part of the site, and the videos are not kept in git.

- `out/`: the finished videos and their cover pictures (not in git).
- `posts.md`: the caption and hashtags to post with each one.
- `videos/`: one short script per video. `_shared.mjs` holds what they share.
- `stage.html`: what is drawn over the app: the captions, the tap dot and the closing `driverush.ke` label.
- `music/`: the three music beds, made by `make-music.mjs`. Replace any of them with a file of the same name (`a`, `b` or `c`, as mp3, m4a or wav).

## Make them again

```bash
npm run build && PORT=5191 npm run start   # in the repo root
```

```bash
npm install                                # here, once
node make-music.mjs                        # once
node capture.mjs 07-name-this-sign         # record one (or list several)
node compose.mjs 07-name-this-sign         # add sound, write out/
```

`node compose.mjs` with no name mixes every recording. `MUSIC=0` leaves the music out. `node explore.mjs <path> shot buttons` shows what a page looks like and which buttons it has, which helps when writing a new script.

Needs Google Chrome and ffmpeg.

## Photos

Six vertical photos (1080x1920) for TikTok photo posts: a real screen from the app with a headline on top. Unlike the videos these are designed cards, in the brand colours.

- `photos/`: one short script per photo: where the app is opened, how it is played to the moment wanted, and the words.
- `photo-stage.html`: the layout: headline, the app in its frame, the `driverush.ke` label.
- `out/photos/`: the finished photos, as `.png` and `.jpg` (not in git).

```bash
node photos.mjs                      # all six
node photos.mjs 04-name-this-sign    # one
SAFE=1 node photos.mjs               # also saves .work/photos/<name>-safe.jpg with TikTok's bars drawn on
```

The same built app on port 5191 must be running. Keep words out of the blue areas in the `-safe` pictures: TikTok covers them.

## LinkedIn

The launch post for Gonasi's LinkedIn page is 4:5 (1080x1350) and is a made film, not a screen recording: `videos/linkedin-launch.mjs` on `stage-launch.html`, and six pictures in `photos/li-*.mjs`. The words to post, and the commands, are in `linkedin.md`. Files go to `out/linkedin/`.
