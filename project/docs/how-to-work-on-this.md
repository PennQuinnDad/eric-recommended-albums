# How to work on this project

A short guide to working on the site in VS Code, with or without Claude Code.

## Open the project

Open the project root, not `dev/`, so both halves are visible: `project/` (notes and the album list) and `dev/` (the site).

```bash
code ~/dev/eric-recommended-albums
```

The Claude Code extension opens in a side panel. It reads `CLAUDE.md` automatically, so it already knows the layout, the Amplify setup and the album link rule.

## See the site while you work

In VS Code's terminal (Ctrl+`):

```bash
npm --prefix dev run dev
```

Open http://localhost:5173. Saved edits show up within a second. Stop the server with Ctrl+C.

To check that the real build works (this is what Amplify runs):

```bash
npm --prefix dev run build
```

## Which file to change

| To change | Open |
| --- | --- |
| The album list | `dev/src/albums.json`, plus `project/docs/albums.md` (keep the two in sync) |
| Page text and layout | `dev/index.html` |
| Behavior (search, sort, copy buttons) | `dev/src/main.js` |
| Colors, spacing, mobile look | `dev/src/style.css` |

## Adding an album

The easiest way is to tell Claude Code: "add [album] by [artist]." It will:

1. Find the Spotify and Apple Music links and check both point to the standard edition of the right album.
2. Pick a pair of cover colors.
3. Add the album to `albums.json` and `albums.md`.
4. Build and check it in the preview.

Doing it by hand: copy an existing entry in `albums.json`, then update the title, artist, year, genres, colors and both links. The build fails if either link is missing or isn't an album page, so a deploy can't go out without them.

## Save and publish

1. Open Source Control (Ctrl+Shift+G) to see what changed.
2. Write a short message and commit.
3. Click Sync Changes or Push.

**Pushing to `main` deploys the live site** through AWS Amplify, usually in about 80 to 100 seconds. For anything you're unsure about, make a branch first (the branch name at the bottom left of the window) and merge into `main` only once it looks right.

- Live site: https://main.d14l4xii94mt7b.amplifyapp.com/
- Repo: https://github.com/PennQuinnDad/eric-recommended-albums

### Publishing with Claude Code

In a Claude Code session in this project, type `/publish`. It builds the site, shows you what would go live, asks before pushing, pushes, and then watches the live site and tells you when the new version is up. If something is wrong along the way (a failed build, being behind GitHub), it stops and says so. Don't use `/deploy` for this site: that's a different skill for the Budget Tracker.

## GitHub account

This repo pushes as the Quinn Penn account (`PennQuinnDad`), set up in this repo's git config. That should work from VS Code too. If VS Code asks you to sign in to GitHub, cancel and push from the terminal instead, so it doesn't use the Slalom account.

## More

- Deployment setup and status: `project/docs/deployment.md`
- The album list with release years, genres and links: `project/docs/albums.md`
