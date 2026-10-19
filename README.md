# Eric's Recommended Albums

A listening list of albums that hold up start to finish, from the 1960s to this year. Every album links straight to Spotify and Apple Music.

**Live site:** https://main.d14l4xii94mt7b.amplifyapp.com/

## What it is

I'm an album guy. I like starting at track one and letting a record play out the way the band meant it to. These are the records I keep coming back to, and the ones I keep telling family and friends to put on. This repo is the site that shows them.

## Features

- **Two views:** album cards with typographic covers, or a compact table. The choice is remembered on each device.
- **Search:** finds albums by title, artist, genre or year. Punctuation doesn't matter, so "rem" finds R.E.M.
- **Filter and sort:** genre buttons, plus newest first, oldest first, album A to Z, or artist A to Z.
- **Listen links:** every album has a Spotify link and an Apple Music link to the standard edition, plus a small Discogs link to its master release page, which covers every pressing and is handy for finding vinyl. The build fails if any of the three is missing, so a deploy can't go out without them.
- **Open in app (Mac only):** a switch, off by default, that makes the Spotify and Apple Music buttons open the desktop apps directly instead of their web pages. It only appears on a Mac, because iPhones and iPads already open the apps from ordinary links and other computers may not have them.
- **Copy as Markdown:** copies the albums on screen as a Markdown list with their links, ready to paste into a doc or an AI agent.
- **Copy link:** copies the page address for sharing.
- **Light and dark mode:** follows your device's setting automatically. A toggle in the header overrides it, and picking the mode your device already uses goes back to following it.
- **Everywhere:** works on phones, tablets and desktops.

## Project layout

```
.
├── dev/                  The site (Vite, plain JavaScript)
│   ├── index.html
│   ├── vite.config.js    Build check: every album needs both links
│   └── src/
│       ├── albums.json   The album data the site reads
│       ├── main.js
│       └── style.css
├── project/              Planning and reference material, no code
│   ├── backgrounder/     Context and the "why"
│   ├── research/         Notes and the original collection list
│   ├── assets/           Media (not tracked in git)
│   ├── docs/             Album list, deployment notes, how-to guide
│   ├── notes/
│   └── archive/
├── .claude/skills/       Project skills for Claude Code: /new-album and /publish
├── amplify.yml           AWS Amplify build settings
├── CLAUDE.md             Background for Claude Code sessions
└── README.md
```

## Run it locally

You need Node.js (version 20 or newer).

```bash
npm --prefix dev install
npm --prefix dev run dev
```

Then open http://localhost:5173. To check the production build, which is what Amplify runs:

```bash
npm --prefix dev run build
```

## Add an album

With Claude Code in this project, type `/new-album` and give it an artist and title. It finds and checks the Spotify, Apple Music and Discogs links, picks the year, genres and cover colors, updates both files, builds and commits.

By hand:

1. Add an entry to `dev/src/albums.json`: title, artist, year, genres, a pair of cover colors, and all three links.
2. Add the same album to the master list and the Listening links table in `project/docs/albums.md`.
3. Run the build. It stops with the album's name if any link is missing or isn't an album page.

For Spotify and Apple Music, use the standard edition of the album, not a deluxe or expanded one, and check that the artist and track count match. For Discogs, use the album's master release page.

## Deployment

The site is hosted on AWS Amplify and builds from this repo. **Pushing to `main` deploys the live site**, usually within two minutes. Build settings are in `amplify.yml`, which points Amplify at the `dev/` folder.

For anything risky, work on a branch and merge into `main` once it looks right.

## More documentation

- [How to work on this project](project/docs/how-to-work-on-this.md): VS Code, the preview, adding albums, publishing
- [Album list](project/docs/albums.md): release years, genres and every Spotify and Apple Music link
- [Deployment notes](project/docs/deployment.md): Amplify setup and status
