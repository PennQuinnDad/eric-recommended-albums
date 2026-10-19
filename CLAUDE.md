# Eric's Recommended Albums

Here's a list of some of the albums I would absolutely recommend. Things that are really bedrock to me, things that I go back to again and again over the years. The kind of albums I recommend to family and friends.

## How this project is organized

- `project/` holds planning and reference material — no code.
  - Read `project/backgrounder/` first for context on what this is and why.
  - Put research findings in `project/research/`, specs and decisions in `project/docs/`, meeting notes and logs in `project/notes/`.
  - Media goes in `project/assets/`; it is git-ignored, so don't rely on it being in the repo.
  - Move superseded material to `project/archive/` instead of deleting it.
- `dev/` holds all code. Keep any app, package manifest, and build config inside `dev/`, not at the project root.
- One git repository covers the whole project from this root.

## Deployment: AWS Amplify + GitHub

- The app in `dev/` deploys through AWS Amplify, which builds from the GitHub repo's `main` branch.
- `amplify.yml` at the root sets `appRoot: dev`. When the app's framework or build output changes, update its build commands and `baseDirectory` to match.
- Setup status and remaining steps are in `project/docs/deployment.md`. Update it and the README's Deployment section as steps are done.
- Don't push to `main` or change the Amplify app without the user's go-ahead. A push to `main` is a production deploy.
- To publish, use the project skill `/publish` (`.claude/skills/publish/`): it builds, shows what's unpushed, asks before pushing, pushes, and watches the live site until the new version is up. Don't confuse it with the account-level `/deploy` skill, which rebuilds Eric's Budget Tracker and has nothing to do with this site.
- GitHub: `PennQuinnDad/eric-recommended-albums` (Eric's Quinn Penn account, public repo). This repo's git config pins its sign-in to PennQuinnDad, so pushes work even though the GitHub CLI's active account may be Eric-Slalom-Git. For `gh` commands about this repo, prefix them with `GH_TOKEN=$(gh auth token --user PennQuinnDad)`.

## The site

- `dev/` is a Vite site in plain JavaScript (no framework): `dev/index.html`, `dev/src/main.js`, `dev/src/style.css`.
- Album data lives in `dev/src/albums.json`, which is what the site reads. `project/docs/albums.md` is the human-readable master list. When an album is added or changed, update both.
- **Every album must have three links**: Spotify, Apple Music and Discogs (`links.spotify`, `links.appleMusic`, `links.discogs` in `albums.json`, plus the Listening links table in `albums.md`). Spotify and Apple Music point to the standard edition of the album, not deluxe or expanded, with the artist and track count checked. Discogs points to the album's **master** release page (`https://www.discogs.com/master/<id>-<slug>`): pick the master with by far the most pressings whose track count matches, since promos and test pressings have their own tiny masters. `dev/vite.config.js` fails the build if any link is missing or malformed, so a deploy can't go out without them. Apple Music: the iTunes Search API (`itunes.apple.com/search`, or `/lookup?id=<artistId>&entity=album` when search misses). Spotify: find the album page, then confirm it with `open.spotify.com/oembed?url=...`. Discogs: `api.discogs.com/database/search?type=master` and `/masters/<id>` work without a login at 25 requests a minute.
- **To add an album, use the project skill `/new-album`** (`.claude/skills/new-album/`). It finds and checks all three links, picks the year, genres and cover colors, updates `albums.json` and `albums.md`, builds and commits. Its helper script does the validation, so don't hand-edit the two files unless you have to.
- **Light/dark theme:** the page follows the device's setting, and the header toggle overrides it by setting `data-theme` on `<html>` (saved as `albums-theme` in localStorage; a tiny script in `index.html` applies it before first paint). In `style.css` the dark color values appear twice on purpose, once under `@media (prefers-color-scheme: dark)` and once under `:root[data-theme='dark']`. When you change a dark color, change both.
- Each album's `colors` pair (background, text) drives its typographic cover. Real cover art isn't used.
- Run locally: `npm --prefix dev run dev`. Build: `npm --prefix dev run build`.
