# LinkedIn launch post (Gonasi company page)

Files are in `out/linkedin/` (not in git). LinkedIn takes one kind of media per post: use the video for the launch post, and keep the images for a second post or for replies in the comments.

## Post 1: the launch (video)

Attach `out/linkedin/linkedin-launch.mp4`. Cover picture: `out/linkedin/linkedin-launch.jpg`.

```text
Gonasi just built the best NTSA prep in Kenya. Then we made it free. 🇰🇪

It is called DriveRush.ke.

Yes, we said the best. We checked.

The Model Town Board is the table every learner driver sweats over on test day. Everyone else gives you a flat picture of it and a bill.

We built the whole thing in 3D and put a car on it.

✅ A 3D Model Town Board you actually drive
✅ 45 levels: lanes, the roundabout, routes, parking, then a mock test
✅ 83 road signs on the chart. Then the same signs in 3D, because we could
✅ Rules straight from the NTSA handbook
✅ Runs in your phone's browser. Nothing to install

Price: zero. No signup either. We did not even ask for your email.

If you are charging learners for less than this, sorry about your week.

Think you have seen better? Drop it in the comments. We will wait. We do not expect to wait long.

👉 driverush.ke

#NTSA #DrivingTest #Kenya #EdTech #BuiltInKenya
```

### First comment (post it yourself, right after)

```text
Try it here: https://driverush.ke/?utm_source=linkedin&utm_medium=social&utm_campaign=launch

Start with level 1. You cannot fail it.

DriveRush does not replace driving school. It makes your time there count.

Pelican Signs name and logo used with permission. DriveRush is not affiliated with the NTSA.
```

## Post 2: the follow-up (images), a few days later

Attach the six pictures in order, `li-01` to `li-06`.

```text
Last week we asked Kenya to show us better NTSA prep than DriveRush.ke.

The challenge is still open. Here is what you would have to beat:

1. The Model Town Board in 3D
2. 45 levels, every one open
3. A route shown step by step when you are stuck
4. 83 road signs on the chart
5. The same signs in 3D
6. All of it free, with no signup

Seen better? Show us in the comments.

👉 driverush.ke

#NTSA #DrivingTest #Kenya #EdTech
```

## Replies to keep ready

- Someone names a paid app: "Thanks for sharing. Is the board there free to practise on? Ours is, all 45 levels."
- A driving school comments: "We would love your instructors to check our board rules. Message us."
- "Is it really free?": "Yes. Free, no signup. Open driverush.ke and start level 1."

## Before posting

- The cocky voice and the claims "the best", "we checked" and "a flat picture and a bill" are the owner's angle (2026-11-12). Be ready to back them in the comments.
- Post from the Gonasi page, then reshare from personal profiles with a line of your own: reshares with a comment travel further than plain reshares.
- Reply to every comment in the first hour.

## Make the files again

```bash
node capture.mjs linkedin-launch && node compose.mjs linkedin-launch
```

```bash
node photos.mjs li-01-the-board li-02-45-levels li-03-parking li-04-83-signs li-05-signs-3d li-06-show-us
```
