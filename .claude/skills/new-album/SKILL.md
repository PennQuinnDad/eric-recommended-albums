---
name: new-album
description: Add a new album to Eric's Recommended Albums. Finds and checks its Spotify, Apple Music and Discogs links, fills in the year, genres and cover colors, updates albums.json and albums.md, builds, and commits. Use when the user says "new album", "add an album", "add [album] by [artist]", or runs /new-album in this project.
---

# New album

Adds one album (or several, one after another) to the list. Every album needs three checked links: **Spotify**, **Apple Music** and **Discogs**. The site's build refuses to run without all three, so don't skip any.

Project root: `~/dev/eric-recommended-albums`. Run everything from there. The helper is `.claude/skills/new-album/album-tools.mjs` (plain Node, no install). In the commands below, `TOOL` means `node .claude/skills/new-album/album-tools.mjs`.

## Steps

### 1. Get the album

You need the artist and the album title. If Eric gave only one, ask. Eric types fast, so fix obvious typos ("Sufian Stevens" is Sufjan Stevens, "Nico Case" is Neko Case) and say what you read. If the title could mean more than one album, ask which.

### 2. Find Apple Music and Discogs

```bash
TOOL find "<artist>" "<title>"
```

It also warns if the album is already on the list (`ALREADY LISTED`). If so, tell Eric and stop.

Reading the output:
- **Apple Music:** use the standard album, not a Deluxe, Legacy, Expanded, Anniversary, Live or Mono edition. The script marks extras. If the only listing is a "Bonus Track Version", use it and say so.
- **Discogs:** use the master with **by far the most pressings** whose track count matches the standard album. A master with only a handful of pressings is usually a promo, a test pressing or a single. Brand new albums legitimately have few. If there is no master at all, stop and ask Eric. Don't substitute a single release page, because the build only accepts `/master/` links.

### 3. Find Spotify

Use WebSearch with `allowed_domains: ["open.spotify.com"]`, searching "<artist> <title> album Spotify". The album ID is the part after `/album/` in the link, without any `?query`. Check the likely candidates:

```bash
TOOL spotify <albumId> [<albumId> ...]
```

Choose the listing that is:
- by the right artist, and **not** a compilation, live album, mono version or deluxe edition
- **fully playable** (`playable N/N`). The script flags anything that isn't.
- close to the Apple Music track count. A few extra bonus tracks are fine. Record the difference in `linkNotes` (see below).

Spotify often has several identical regional copies of one album. Any fully playable one is fine.

### 4. Decide the details

- **year:** the original release year, not a remaster or reissue year. Apple Music and Discogs should agree.
- **genres:** 2 or 3. Suggest them from Discogs' genres and styles, but use the site's existing names (the `find` output lists them) so the genre buttons don't fill up with near-duplicates ("Indie Rock", not "Indie"). A new genre is fine when nothing existing fits.
- **colors:** two hex colors, `[background, text]`, that echo the real cover, for example the cover's main color and a contrasting one. The text must read clearly on the background (the tool refuses below 3:1). Glance at `dev/src/albums.json` so the new cover isn't a near-twin of the albums beside it.
- **why:** leave it as `""` unless Eric gave a note, and then use his words exactly. Never invent one.
- **copies:** `[]` unless Eric says he owns it.

### 5. Add it

Write the entry to a temporary JSON file in your scratchpad directory:

```json
{
  "title": "Kind of Blue",
  "artist": "Miles Davis",
  "year": 1959,
  "genres": ["Jazz", "Modal"],
  "colors": ["#1f3f66", "#f2e8d0"],
  "links": {
    "spotify": "https://open.spotify.com/album/168H0qRC5kMMGEglYSpv9R",
    "appleMusic": "https://music.apple.com/us/album/kind-of-blue/268443092",
    "discogs": "https://www.discogs.com/master/5460-Miles-Davis-Kind-Of-Blue"
  },
  "linkNotes": { "spotify": "the 5 original tracks plus one alternate take" }
}
```

`linkNotes` is optional. Use it only when a link isn't the plain album (a remaster, or extra tracks). Then:

```bash
TOOL add <file.json> --dry-run     # validates everything and writes nothing
TOOL add <file.json>               # writes albums.json and albums.md
```

The tool checks that all three links resolve, that the Discogs page is by the same artist, that the album isn't already listed, and that the cover colors are readable. It adds the album to `dev/src/albums.json`, to the numbered list in `project/docs/albums.md`, and to its Listening links table. If it prints problems, fix them and run it again. Nothing is written when anything fails.

### 6. Build and look

```bash
npm --prefix dev run build
```

If it fails, show the real error and stop. If the preview is running (`albums-site` in `.claude/launch.json`), search for the album in the browser and check its card: the cover, the three links and the genres.

### 7. Commit locally

```bash
git add -A && git commit -m "Add <title> by <artist>

<Co-Authored-By line from the session's attribution instructions>"
```

Don't push. Tell Eric it's committed and that `/publish` will put it on the live site.

## Report back

Keep it short: the album and year, which editions the links point to (and any difference between services), the genres and the cover colors you picked, and anything you weren't sure about. Genres are marked † in `albums.md` until Eric confirms them.

## Never

- Never add an album without all three checked links.
- Never link a deluxe or expanded edition when a standard one exists.
- Never push, and never publish without Eric's yes.
- Never invent a "why it matters" note.
- Never use em dashes in anything written for the site.
